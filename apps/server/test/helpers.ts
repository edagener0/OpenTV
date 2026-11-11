import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { buildApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'
import { openDatabase } from '../src/db.js'

export interface TestContext {
  app: FastifyInstance
  cleanup: () => Promise<void>
}

export async function createTestApp(
  env: Record<string, string> = {},
  fetchImpl?: typeof fetch,
): Promise<TestContext> {
  const dataDir = mkdtempSync(path.join(tmpdir(), 'opentv-test-'))
  const config = loadConfig({
    NODE_ENV: 'test',
    DATA_DIR: dataDir,
    JWT_SECRET: 'test-secret-that-is-definitely-long-enough-123',
    TMDB_API_KEY: 'test-key',
    WEB_DIR: path.join(dataDir, 'missing-web'),
    ...env,
  })
  const db = openDatabase(':memory:')
  const app = await buildApp({ config, db, logger: false, ...(fetchImpl ? { fetchImpl } : {}) })
  await app.ready()
  return {
    app,
    cleanup: async () => {
      await app.close()
      rmSync(dataDir, { recursive: true, force: true })
    },
  }
}

export function sessionCookie(response: LightMyRequestResponse): string {
  const cookie = response.cookies.find((entry) => entry.name === 'opentv_session')
  if (!cookie) throw new Error('No session cookie in response')
  return `opentv_session=${cookie.value}`
}

export const clientHeaders = { 'x-opentv-client': 'test' }

export async function registerUser(
  app: FastifyInstance,
  username = 'alice',
  password = 'correct-horse-battery',
): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    headers: clientHeaders,
    payload: { username, password },
  })
  if (response.statusCode !== 201) throw new Error(`Register failed: ${response.body}`)
  return sessionCookie(response)
}
