const SERVER_URL_KEY = 'opentv.serverUrl'

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
}

export function readPreference(key: string, fallback: string): string {
  return readStorage(`opentv.${key}`) ?? fallback
}

export function writePreference(key: string, value: string): void {
  writeStorage(`opentv.${key}`, value)
}
