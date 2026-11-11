import type { FastifyRequest } from 'fastify'
import { HttpError } from '../lib/errors.js'

export async function requireUser(request: FastifyRequest): Promise<void> {
  if (!request.user) throw new HttpError(401, 'You need to sign in first', 'UNAUTHENTICATED')
}
