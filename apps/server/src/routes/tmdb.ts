import type { FastifyInstance } from 'fastify'
import type { TmdbClient } from '../lib/tmdb.js'

export async function tmdbRoutes(app: FastifyInstance, options: { tmdb: TmdbClient }) {
  const { tmdb } = options

  app.get('/*', async (request, reply) => {
    const path = (request.params as { '*': string })['*']
    const result = await tmdb.get(path, request.query as Record<string, unknown>)
    if (result.status === 200) reply.header('cache-control', 'public, max-age=600')
    return reply.code(result.status).send(result.body)
  })
}
