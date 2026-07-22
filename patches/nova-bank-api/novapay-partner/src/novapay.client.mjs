/**
 * Thin HTTP client for Nova Bank → NovaPay partner sandbox routes.
 */

export function createNovaPayClient(config) {
  const base = config.sandboxBase.replace(/\/+$/, '')
  const timeoutMs = config.httpTimeoutMs || 30_000

  async function request(method, path, body) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetch(`${base}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      })
      const text = await res.text()
      let data
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = { raw: text }
      }
      if (!res.ok) {
        const err = new Error(`NovaPay ${method} ${path} → ${res.status}`)
        err.status = res.status
        err.data = data
        throw err
      }
      return data
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    status: () => request('GET', '/status'),
    manifest: () => request('GET', '/manifest'),
    events: () => request('GET', '/events'),
    receive: (payload) => request('POST', '/receive', payload),
    send: (payload) => request('POST', '/send', payload),
  }
}
