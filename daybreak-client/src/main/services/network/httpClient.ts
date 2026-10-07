import { NETWORK_TIMEOUT_MS, DOWNLOAD_RETRY_ATTEMPTS, DOWNLOAD_RETRY_BASE_DELAY_MS } from '@shared/constants'

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface FetchJsonOptions {
  headers?: Record<string, string>
  timeoutMs?: number
  retries?: number
  method?: string
  body?: string
}

async function fetchWithTimeout(url: string, options: FetchJsonOptions): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? NETWORK_TIMEOUT_MS)
  try {
    return await fetch(url, {
      method: options.method ?? 'GET',
      headers: options.headers,
      body: options.body,
      signal: controller.signal
    })
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Fetch with a hard timeout and exponential-backoff retries. Retries only on network failures,
 * timeouts and 5xx/429 responses - a 4xx (except 429) means retrying would just repeat the same
 * client error, so it fails fast with a clear message instead.
 */
export async function fetchWithRetry(url: string, options: FetchJsonOptions = {}): Promise<Response> {
  const retries = options.retries ?? DOWNLOAD_RETRY_ATTEMPTS
  let lastError: unknown = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options)
      if (response.ok) return response
      if (response.status === 429 || response.status >= 500) {
        lastError = new HttpError(`HTTP ${response.status} von ${url}`, response.status)
      } else {
        throw new HttpError(`HTTP ${response.status} von ${url}: ${response.statusText}`, response.status)
      }
    } catch (error) {
      if (error instanceof HttpError) throw error
      lastError = error
    }
    if (attempt < retries) {
      const delay = DOWNLOAD_RETRY_BASE_DELAY_MS * 2 ** attempt
      await sleep(delay)
    }
  }
  const reason = lastError instanceof Error ? lastError.message : String(lastError)
  throw new HttpError(`Netzwerkanfrage an ${url} fehlgeschlagen nach ${retries + 1} Versuchen: ${reason}`)
}

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const response = await fetchWithRetry(url, options)
  return (await response.json()) as T
}
