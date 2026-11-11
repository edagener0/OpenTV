import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clientHeaders, createTestApp, registerUser, sessionCookie, type TestContext } from './helpers.js'

describe('auth', () => {
  let ctx: TestContext

  beforeEach(async () => {
    ctx = await createTestApp()
  })

  afterEach(async () => {
    await ctx.cleanup()
  })

  it('registers a user and sets an http-only session cookie', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: clientHeaders,
      payload: { username: 'alice', password: 'correct-horse-battery' },
    })
    expect(response.statusCode).toBe(201)
    expect(response.json().user.username).toBe('alice')
    const cookie = response.cookies.find((entry) => entry.name === 'opentv_session')
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.sameSite).toBe('Lax')
  })

  it('rejects duplicate usernames case-insensitively', async () => {
    await registerUser(ctx.app, 'alice')
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: clientHeaders,
      payload: { username: 'ALICE', password: 'another-password' },
    })
    expect(response.statusCode).toBe(409)
  })

  it('validates username and password', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: clientHeaders,
      payload: { username: 'a b', password: 'short' },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json().error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects state-changing requests without the client header', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { username: 'alice', password: 'correct-horse-battery' },
    })
    expect(response.statusCode).toBe(403)
  })

  it('logs in, resolves the session and logs out', async () => {
    await registerUser(ctx.app)
    const bad = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: clientHeaders,
      payload: { username: 'alice', password: 'wrong-password' },
    })
    expect(bad.statusCode).toBe(401)

    const login = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: clientHeaders,
      payload: { username: 'Alice', password: 'correct-horse-battery' },
    })
    expect(login.statusCode).toBe(200)
    const cookie = sessionCookie(login)

    const me = await ctx.app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } })
    expect(me.json().user.username).toBe('alice')

    const logout = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { ...clientHeaders, cookie },
    })
    expect(logout.statusCode).toBe(204)
    expect(logout.cookies.find((entry) => entry.name === 'opentv_session')?.value).toBe('')
  })

  it('invalidates old sessions after a password change', async () => {
    const cookie = await registerUser(ctx.app)
    const change = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/password',
      headers: { ...clientHeaders, cookie },
      payload: { currentPassword: 'correct-horse-battery', newPassword: 'new-password-123' },
    })
    expect(change.statusCode).toBe(204)
    const fresh = sessionCookie(change)

    const stale = await ctx.app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } })
    expect(stale.json().user).toBeNull()

    const current = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: fresh },
    })
    expect(current.json().user.username).toBe('alice')
  })

  it('ignores tampered tokens', async () => {
    const cookie = await registerUser(ctx.app)
    const tampered = `${cookie.slice(0, -4)}abcd`
    const me = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: tampered },
    })
    expect(me.json().user).toBeNull()
  })

  it('deletes an account with its data', async () => {
    const cookie = await registerUser(ctx.app)
    const response = await ctx.app.inject({
      method: 'DELETE',
      url: '/api/auth/me',
      headers: { ...clientHeaders, cookie },
      payload: { password: 'correct-horse-battery' },
    })
    expect(response.statusCode).toBe(204)
    const login = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: clientHeaders,
      payload: { username: 'alice', password: 'correct-horse-battery' },
    })
    expect(login.statusCode).toBe(401)
  })

  it('honours disabled registration', async () => {
    await ctx.cleanup()
    ctx = await createTestApp({ ALLOW_REGISTRATION: 'false' })
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: clientHeaders,
      payload: { username: 'alice', password: 'correct-horse-battery' },
    })
    expect(response.statusCode).toBe(403)
  })
})
