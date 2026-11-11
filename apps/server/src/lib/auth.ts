import { hash, verify } from '@node-rs/argon2'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { jwtVerify, SignJWT } from 'jose'
import { z } from 'zod'
import type { AppConfig } from '../config.js'
import type { DB } from '../db.js'
import { HttpError } from './errors.js'

export const SESSION_COOKIE = 'opentv_session'
const ISSUER = 'opentv'

const HASH_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'must be at least 3 characters')
  .max(32, 'must be at most 32 characters')
  .regex(/^[a-zA-Z0-9_.-]+$/, 'may only contain letters, numbers, dots, dashes and underscores')

export const passwordSchema = z
  .string()
  .min(8, 'must be at least 8 characters')
  .max(128, 'must be at most 128 characters')

export interface SessionUser {
  id: number
  username: string
  createdAt: number
}

interface UserRow {
  id: number
  username: string
  password_hash: string
  token_version: number
  created_at: number
}

export class AuthService {
  private dummyHash: Promise<string>

  constructor(
    private readonly db: DB,
    private readonly config: AppConfig,
  ) {
    this.dummyHash = hash('opentv-timing-guard', HASH_OPTIONS)
  }

  async register(username: string, password: string): Promise<SessionUser> {
    const existing = this.db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existing) throw new HttpError(409, 'That username is already taken', 'USERNAME_TAKEN')
    const passwordHash = await hash(password, HASH_OPTIONS)
    const createdAt = Date.now()
    try {
      const result = this.db
        .prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)')
        .run(username, passwordHash, createdAt)
      return { id: Number(result.lastInsertRowid), username, createdAt }
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE')) {
        throw new HttpError(409, 'That username is already taken', 'USERNAME_TAKEN')
      }
      throw error
    }
  }

  async login(username: string, password: string): Promise<SessionUser> {
    const row = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as
      UserRow | undefined
    const valid = row
      ? await verify(row.password_hash, password)
      : await verify(await this.dummyHash, password).then(() => false)
    if (!row || !valid) {
      throw new HttpError(401, 'Invalid username or password', 'INVALID_CREDENTIALS')
    }
    return { id: row.id, username: row.username, createdAt: row.created_at }
  }

  async changePassword(userId: number, current: string, next: string): Promise<void> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as
      UserRow | undefined
    if (!row || !(await verify(row.password_hash, current))) {
      throw new HttpError(401, 'Current password is incorrect', 'INVALID_CREDENTIALS')
    }
    const passwordHash = await hash(next, HASH_OPTIONS)
    this.db
      .prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?')
      .run(passwordHash, userId)
  }

  async deleteAccount(userId: number, password: string): Promise<void> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as
      UserRow | undefined
    if (!row || !(await verify(row.password_hash, password))) {
      throw new HttpError(401, 'Password is incorrect', 'INVALID_CREDENTIALS')
    }
    this.db.prepare('DELETE FROM users WHERE id = ?').run(userId)
  }

  revokeSessions(userId: number): void {
    this.db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(userId)
  }

  async issueSession(request: FastifyRequest, reply: FastifyReply, userId: number): Promise<void> {
    const row = this.db.prepare('SELECT token_version FROM users WHERE id = ?').get(userId) as
      Pick<UserRow, 'token_version'> | undefined
    if (!row) throw new HttpError(404, 'User not found', 'NOT_FOUND')
    const maxAge = this.config.sessionDays * 24 * 60 * 60
    const token = await new SignJWT({ ver: row.token_version })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(userId))
      .setIssuer(ISSUER)
      .setIssuedAt()
      .setExpirationTime(`${this.config.sessionDays}d`)
      .sign(this.config.jwtSecret)
    reply.setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.isSecure(request),
      path: '/',
      maxAge,
    })
  }

  clearSession(request: FastifyRequest, reply: FastifyReply): void {
    reply.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.isSecure(request),
      path: '/',
    })
  }

  async resolve(request: FastifyRequest): Promise<SessionUser | null> {
    const token = request.cookies[SESSION_COOKIE]
    if (!token) return null
    try {
      const { payload } = await jwtVerify(token, this.config.jwtSecret, {
        issuer: ISSUER,
        algorithms: ['HS256'],
      })
      const userId = Number(payload.sub)
      if (!Number.isInteger(userId)) return null
      const row = this.db
        .prepare('SELECT id, username, token_version, created_at FROM users WHERE id = ?')
        .get(userId) as Omit<UserRow, 'password_hash'> | undefined
      if (!row || row.token_version !== payload.ver) return null
      return { id: row.id, username: row.username, createdAt: row.created_at }
    } catch {
      return null
    }
  }

  private isSecure(request: FastifyRequest): boolean {
    if (this.config.cookieSecure === 'auto') return request.protocol === 'https'
    return this.config.cookieSecure
  }
}
