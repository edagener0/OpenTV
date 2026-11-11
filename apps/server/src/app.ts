import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import Fastify, { type FastifyInstance } from 'fastify'
import type { AppConfig } from './config.js'
import { type DB, openDatabase } from './db.js'
import { AuthService } from './lib/auth.js'
import { HttpError } from './lib/errors.js'
import { LibraryService } from './lib/library.js'
import { loadProviders, providerOrigins } from './lib/providers.js'
import { TmdbClient } from './lib/tmdb.js'
import { authRoutes } from './routes/auth.js'
import { libraryRoutes } from './routes/library.js'
import { metaRoutes } from './routes/meta.js'
import { tmdbRoutes } from './routes/tmdb.js'
import './types.js'

export const CLIENT_HEADER = 'x-opentv-client'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export interface BuildOptions {
  config: AppConfig
  db?: DB
  fetchImpl?: typeof fetch
  logger?: boolean
}

function readVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
    ) as { version?: string }
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

export async function buildApp(options: BuildOptions): Promise<FastifyInstance> {
  const { config } = options
  const db = options.db ?? openDatabase(config.databaseFile)
  const providers = loadProviders(config.providersFile)
  const tmdb = new TmdbClient({
    apiKey: config.tmdbApiKey,
    ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
  })
  const auth = new AuthService(db, config)
  const library = new LibraryService(db)
  const version = readVersion()

  const app = Fastify({
    logger:
      options.logger === false
        ? false
        : {
            level: config.logLevel,
            redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
          },
    trustProxy: config.trustProxy,
    bodyLimit: 64 * 1024,
  })

  app.addHook('onClose', async () => {
    db.close()
  })

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://image.tmdb.org'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameSrc: [
          ...providerOrigins(providers),
          'https://www.youtube-nocookie.com',
          'https://www.youtube.com',
        ],
        mediaSrc: ["'self'", 'blob:', 'https:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: null,
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    strictTransportSecurity: false,
  })

  await app.register(cors, {
    origin: config.corsOrigins.length > 0 ? config.corsOrigins : false,
    credentials: true,
    allowedHeaders: ['content-type', CLIENT_HEADER],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })

  await app.register(cookie)
  await app.register(rateLimit, { global: false })

  app.decorateRequest('user', null)

  app.addHook('onRequest', async (request) => {
    if (!request.url.startsWith('/api/')) return
    if (!SAFE_METHODS.has(request.method) && !request.headers[CLIENT_HEADER]) {
      throw new HttpError(403, 'Missing client header', 'CSRF_CHECK_FAILED')
    }
    request.user = await auth.resolve(request)
  })

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({ error: { code: error.code, message: error.message } })
    }
    const status = (error as { statusCode?: number }).statusCode ?? 500
    if (status >= 500) {
      request.log.error(error)
      return reply
        .code(500)
        .send({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } })
    }
    const message = error instanceof Error ? error.message : 'Request failed'
    return reply.code(status).send({
      error: { code: status === 429 ? 'RATE_LIMITED' : 'BAD_REQUEST', message },
    })
  })

  await app.register(
    async (api) => {
      await api.register(metaRoutes, { config, providers, tmdb, version })
      await api.register(authRoutes, { prefix: '/auth', auth, config })
      await api.register(libraryRoutes, { prefix: '/library', library })
      await api.register(tmdbRoutes, { prefix: '/tmdb', tmdb })
    },
    { prefix: '/api' },
  )

  const indexFile = path.join(config.webDir, 'index.html')
  const serveWeb = existsSync(indexFile)
  if (serveWeb) {
    await app.register(fastifyStatic, {
      root: config.webDir,
      wildcard: false,
      index: false,
      setHeaders(reply, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          reply.header('cache-control', 'public, max-age=31536000, immutable')
        } else {
          reply.header('cache-control', 'no-cache')
        }
      },
    })
    app.get('/*', async (request, reply) => {
      const relative = (request.params as { '*': string })['*']
      if (relative.startsWith('api/') || relative === 'api') {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Not found' } })
      }
      if (relative && path.extname(relative)) {
        const target = path.resolve(config.webDir, relative)
        if (target.startsWith(config.webDir + path.sep) && existsSync(target)) {
          return reply.sendFile(relative)
        }
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Not found' } })
      }
      reply.header('cache-control', 'no-cache')
      return reply.sendFile('index.html')
    })
  }

  app.setNotFoundHandler((_request, reply) => {
    return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Not found' } })
  })

  return app
}
