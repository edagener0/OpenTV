import type { FastifyInstance } from 'fastify'
import { parse } from '../lib/errors.js'
import type { LibraryService } from '../lib/library.js'
import { requireUser } from './guards.js'
import {
  favoriteBodySchema,
  heartbeatBodySchema,
  mediaParamsSchema,
  paginationSchema,
} from './schemas.js'

export async function libraryRoutes(app: FastifyInstance, options: { library: LibraryService }) {
  const { library } = options

  app.addHook('preHandler', requireUser)

  app.get('/favorites', async (request) => {
    return { items: library.listFavorites(request.user!.id) }
  })

  app.get('/favorites/:mediaType/:tmdbId', async (request) => {
    const { mediaType, tmdbId } = parse(mediaParamsSchema, request.params)
    return { favorite: library.isFavorite(request.user!.id, mediaType, tmdbId) }
  })

  app.put('/favorites/:mediaType/:tmdbId', async (request) => {
    const { mediaType, tmdbId } = parse(mediaParamsSchema, request.params)
    const body = parse(favoriteBodySchema, request.body)
    return { item: library.addFavorite(request.user!.id, { ...body, mediaType, tmdbId }) }
  })

  app.delete('/favorites/:mediaType/:tmdbId', async (request, reply) => {
    const { mediaType, tmdbId } = parse(mediaParamsSchema, request.params)
    library.removeFavorite(request.user!.id, mediaType, tmdbId)
    return reply.code(204).send()
  })

  app.get('/continue', async (request) => {
    return { items: library.continueWatching(request.user!.id) }
  })

  app.get('/history', async (request) => {
    const { limit, offset } = parse(paginationSchema, request.query)
    return { items: library.history(request.user!.id, limit, offset) }
  })

  app.get('/history/:mediaType/:tmdbId', async (request) => {
    const { mediaType, tmdbId } = parse(mediaParamsSchema, request.params)
    return { items: library.titleProgress(request.user!.id, mediaType, tmdbId) }
  })

  app.post('/history/heartbeat', async (request) => {
    const body = parse(heartbeatBodySchema, request.body)
    return { item: library.recordHeartbeat(request.user!.id, body) }
  })

  app.delete('/history/:mediaType/:tmdbId', async (request, reply) => {
    const { mediaType, tmdbId } = parse(mediaParamsSchema, request.params)
    library.removeTitle(request.user!.id, mediaType, tmdbId)
    return reply.code(204).send()
  })

  app.delete('/history', async (request, reply) => {
    library.clearHistory(request.user!.id)
    return reply.code(204).send()
  })

  app.get('/stats', async (request) => {
    return library.stats(request.user!.id)
  })
}
