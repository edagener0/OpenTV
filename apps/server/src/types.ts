import type { SessionUser } from './lib/auth.js'

declare module 'fastify' {
  interface FastifyRequest {
    user: SessionUser | null
  }
}

export {}
