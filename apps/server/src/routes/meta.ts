import type { FastifyInstance } from 'fastify'
import type { AppConfig } from '../config.js'
import type { Provider } from '../lib/providers.js'
import type { TmdbClient } from '../lib/tmdb.js'

export async function metaRoutes(
  app: FastifyInstance,
  options: { config: AppConfig; providers: Provider[]; tmdb: TmdbClient; version: string },
) {
  const { config, providers, tmdb, version } = options

  app.get('/health', async () => {
    return { status: 'ok', name: 'OpenTV', version }
  })

  app.get('/server-info', async () => {
    return {
      name: 'OpenTV',
      version,
      tmdbConfigured: tmdb.configured,
      registrationEnabled: config.allowRegistration,
    }
  })

  app.get('/providers', async (_request, reply) => {
    reply.header('cache-control', 'public, max-age=300')
    return { providers }
  })
}
