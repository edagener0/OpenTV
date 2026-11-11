const SERVER_URL_KEY = 'opentv.serverUrl'
const RECENT_SERVERS_KEY = 'opentv.recentServers'
const MAX_RECENT_SERVERS = 6

export const isTauri =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in (window as unknown as object)

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    return
  }
}

export function normalizeServerUrl(input: string): string {
  const trimmed = input.trim()
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`
  const url = new URL(withScheme)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http and https servers are supported')
  }
  return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, '')}`
}

export function getServerUrl(): string | null {
  if (!isTauri) return ''
  return readStorage(SERVER_URL_KEY)
}

export function setServerUrl(url: string | null): void {
  writeStorage(SERVER_URL_KEY, url)
  if (url) rememberServer(url)
}

function readRecentServers(): string[] {
  const raw = readStorage(RECENT_SERVERS_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

export function getRecentServers(): string[] {
  const stored = readRecentServers()
  const current = isTauri ? readStorage(SERVER_URL_KEY) : null
  return current && !stored.includes(current) ? [current, ...stored] : stored
}

export function rememberServer(url: string): void {
  const next = [url, ...readRecentServers().filter((item) => item !== url)].slice(
    0,
    MAX_RECENT_SERVERS,
  )
  writeStorage(RECENT_SERVERS_KEY, JSON.stringify(next))
}

export function forgetServer(url: string): string[] {
  writeStorage(
    RECENT_SERVERS_KEY,
    JSON.stringify(readRecentServers().filter((item) => item !== url)),
  )
  return getRecentServers()
}

export function serverLabel(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.host}${parsed.pathname === '/' ? '' : parsed.pathname}`
  } catch {
    return url
  }
}

export function readPreference(key: string, fallback: string): string {
  return readStorage(`opentv.${key}`) ?? fallback
}

export function writePreference(key: string, value: string): void {
  writeStorage(`opentv.${key}`, value)
}
