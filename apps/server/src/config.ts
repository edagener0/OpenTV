import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(moduleDir, '../../..')

const booleanString = z
  .enum(['true', 'false', '1', '0', 'yes', 'no'])
  .transform((value) => value === 'true' || value === '1' || value === 'yes')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATA_DIR: z.string().default(path.join(repoRoot, 'data')),
  DATABASE_FILE: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  SESSION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  TMDB_API_KEY: z.string().trim().optional(),
  ALLOW_REGISTRATION: booleanString.default(true),
  COOKIE_SECURE: z.enum(['auto', 'true', 'false']).default('auto'),
  TRUST_PROXY: booleanString.default(false),
  CORS_ORIGINS: z.string().default(''),
  PROVIDERS_FILE: z.string().default(path.join(repoRoot, 'config', 'providers.json')),
  WEB_DIR: z.string().default(path.join(repoRoot, 'apps', 'web', 'dist')),
})

export interface AppConfig {
  env: 'development' | 'production' | 'test'
  host: string
  port: number
  logLevel: string
  dataDir: string
  databaseFile: string
  jwtSecret: Uint8Array
  sessionDays: number
  tmdbApiKey: string | undefined
  allowRegistration: boolean
  cookieSecure: 'auto' | boolean
  trustProxy: boolean
  corsOrigins: string[]
  providersFile: string
  webDir: string
}

function resolveJwtSecret(dataDir: string, provided: string | undefined): Uint8Array {
  if (provided) return new TextEncoder().encode(provided)
  const secretFile = path.join(dataDir, 'jwt-secret')
  if (existsSync(secretFile)) {
    const stored = readFileSync(secretFile, 'utf8').trim()
    if (stored.length >= 32) return new TextEncoder().encode(stored)
  }
  const generated = randomBytes(48).toString('base64url')
  writeFileSync(secretFile, generated, { mode: 0o600 })
  return new TextEncoder().encode(generated)
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(source)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid configuration: ${details}`)
  }
  const env = parsed.data
  const dataDir = path.resolve(env.DATA_DIR)
  mkdirSync(dataDir, { recursive: true })

  return {
    env: env.NODE_ENV,
    host: env.HOST,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    dataDir,
    databaseFile: env.DATABASE_FILE ?? path.join(dataDir, 'opentv.db'),
    jwtSecret: resolveJwtSecret(dataDir, env.JWT_SECRET),
    sessionDays: env.SESSION_DAYS,
    tmdbApiKey: env.TMDB_API_KEY || undefined,
    allowRegistration: env.ALLOW_REGISTRATION,
    cookieSecure: env.COOKIE_SECURE === 'auto' ? 'auto' : env.COOKIE_SECURE === 'true',
    trustProxy: env.TRUST_PROXY,
    corsOrigins: env.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    providersFile: path.resolve(env.PROVIDERS_FILE),
    webDir: path.resolve(env.WEB_DIR),
  }
}
