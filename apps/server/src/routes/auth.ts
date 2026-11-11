import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppConfig } from '../config.js'
import { type AuthService, passwordSchema, usernameSchema } from '../lib/auth.js'
import { HttpError, parse } from '../lib/errors.js'
import { requireUser } from './guards.js'

const credentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
})

const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(128),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
})

const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128),
})

const authRateLimit = { rateLimit: { max: 10, timeWindow: '1 minute' } }

export async function authRoutes(
  app: FastifyInstance,
  options: { auth: AuthService; config: AppConfig },
) {
  const { auth, config } = options

  app.post('/register', { config: authRateLimit }, async (request, reply) => {
    if (!config.allowRegistration) {
      throw new HttpError(403, 'Registration is disabled on this server', 'REGISTRATION_DISABLED')
    }
    const { username, password } = parse(credentialsSchema, request.body)
    const user = await auth.register(username, password)
    await auth.issueSession(request, reply, user.id)
    return reply.code(201).send({ user })
  })

  app.post('/login', { config: authRateLimit }, async (request, reply) => {
    const { username, password } = parse(loginSchema, request.body)
    const user = await auth.login(username, password)
    await auth.issueSession(request, reply, user.id)
    return { user }
  })

  app.post('/logout', async (request, reply) => {
    auth.clearSession(request, reply)
    return reply.code(204).send()
  })

  app.post('/logout-all', { preHandler: requireUser }, async (request, reply) => {
    auth.revokeSessions(request.user!.id)
    auth.clearSession(request, reply)
    return reply.code(204).send()
  })

  app.get('/me', async (request) => {
    return { user: request.user }
  })

  app.post(
    '/password',
    { preHandler: requireUser, config: authRateLimit },
    async (request, reply) => {
      const { currentPassword, newPassword } = parse(changePasswordSchema, request.body)
      await auth.changePassword(request.user!.id, currentPassword, newPassword)
      await auth.issueSession(request, reply, request.user!.id)
      return reply.code(204).send()
    },
  )

  app.delete('/me', { preHandler: requireUser, config: authRateLimit }, async (request, reply) => {
    const { password } = parse(deleteAccountSchema, request.body)
    await auth.deleteAccount(request.user!.id, password)
    auth.clearSession(request, reply)
    return reply.code(204).send()
  })
}
