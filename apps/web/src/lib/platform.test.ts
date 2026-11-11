import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

describe('platform server helpers', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('window', { localStorage: memoryStorage(), __TAURI_INTERNALS__: {} })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('normalizes addresses', async () => {
    const { normalizeServerUrl } = await import('./platform')
    expect(normalizeServerUrl('192.168.1.20:8080')).toBe('http://192.168.1.20:8080')
    expect(normalizeServerUrl(' https://tv.example.com/ ')).toBe('https://tv.example.com')
    expect(normalizeServerUrl('https://example.com/opentv/')).toBe('https://example.com/opentv')
  })

  it('remembers recent servers, most recent first, without duplicates', async () => {
    const { getRecentServers, getServerUrl, setServerUrl } = await import('./platform')
    setServerUrl('http://a.local:8080')
    setServerUrl('https://b.example.com')
    setServerUrl('http://a.local:8080')
    expect(getServerUrl()).toBe('http://a.local:8080')
    expect(getRecentServers()).toEqual(['http://a.local:8080', 'https://b.example.com'])
  })

  it('forgets servers but always lists the active one', async () => {
    const { forgetServer, setServerUrl } = await import('./platform')
    setServerUrl('https://b.example.com')
    setServerUrl('http://a.local:8080')
    expect(forgetServer('https://b.example.com')).toEqual(['http://a.local:8080'])
    expect(forgetServer('http://a.local:8080')).toEqual(['http://a.local:8080'])
  })

  it('labels servers by host', async () => {
    const { serverLabel } = await import('./platform')
    expect(serverLabel('https://tv.example.com')).toBe('tv.example.com')
    expect(serverLabel('http://10.0.0.2:8080/opentv')).toBe('10.0.0.2:8080/opentv')
  })
})
