import { getServerUrl, isTauri } from './platform'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code = 'ERROR',
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

let tauriFetch: Promise<FetchLike> | null = null

function resolveFetch(): Promise<FetchLike> {
  if (!isTauri) return Promise.resolve((input, init) => window.fetch(input, init))
  tauriFetch ??= import('@tauri-apps/plugin-http').then(
    (module) => module.fetch as unknown as FetchLike,
  )
  return tauriFetch
}

export function apiUrl(path: string): string {
  const base = getServerUrl()
  if (base === null) throw new ApiError(0, 'No server configured', 'NO_SERVER')
  return `${base}/api${path}`
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options
  const headers: Record<string, string> = { accept: 'application/json' }
  if (method !== 'GET') headers['x-opentv-client'] = isTauri ? 'tauri' : 'web'
  if (body !== undefined) headers['content-type'] = 'application/json'

  const doFetch = await resolveFetch()
  let response: Response
  try {
    response = await doFetch(apiUrl(path), {
      method,
      headers,
      body: body === undefined ? null : JSON.stringify(body),
      credentials: 'include',
      ...(signal ? { signal } : {}),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    if (error instanceof ApiError) throw error
    throw new ApiError(0, 'Unable to reach the server', 'NETWORK_ERROR')
  }

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const details = (payload as { error?: { message?: string; code?: string }; message?: string })
      ?.error
    const message =
      details?.message ?? (payload as { message?: string } | null)?.message ?? response.statusText
    throw new ApiError(response.status, message || 'Request failed', details?.code)
  }
  return payload as T
}

export async function probeServer(baseUrl: string): Promise<boolean> {
  const doFetch = await resolveFetch()
  try {
    const response = await doFetch(`${baseUrl}/api/health`, {
      headers: { accept: 'application/json' },
    })
    if (!response.ok) return false
    const body = (await response.json()) as { name?: string }
    return body.name === 'OpenTV'
  } catch {
    return false
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}
