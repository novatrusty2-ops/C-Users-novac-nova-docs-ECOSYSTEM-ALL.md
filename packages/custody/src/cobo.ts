/**
 * Cobo WaaS 2.0 signed fetch — credentials from env only.
 * @see https://www.cobo.com/developers/v2/guides/overview/cobo-auth
 */
import { createHash } from 'node:crypto'
import nacl from 'tweetnacl'

export function getCoboBaseUrl() {
  return (process.env.COBO_API_BASE_URL || 'https://api.cobo.com/v2').replace(/\/$/, '')
}

export async function coboFetch(
  path: string,
  init: { method?: string; params?: Record<string, string>; body?: unknown } = {},
) {
  const apiKey = process.env.COBO_API_KEY
  const apiSecret = process.env.COBO_API_SECRET
  if (!apiKey || !apiSecret) throw new Error('COBO_API_KEY / COBO_API_SECRET missing')

  const method = (init.method || 'GET').toUpperCase()
  const params = init.params
    ? Object.entries(init.params)
        .map(([k, v]) => `${k}=${v}`)
        .sort()
        .join('&')
    : ''
  const body = init.body != null ? JSON.stringify(init.body) : ''
  const nonce = String(Date.now())
  // PATH must include /v2 prefix for Cobo Auth
  const apiPath = path.startsWith('/v2') ? path : `/v2${path.startsWith('/') ? path : `/${path}`}`
  const strToSign = `${method}|${apiPath}|${nonce}|${params}|${body}`
  const contentHash = createHash('sha256')
    .update(createHash('sha256').update(strToSign).digest())
    .digest()
  const seed = Buffer.from(apiSecret, 'hex')
  const keyPair = nacl.sign.keyPair.fromSeed(seed)
  const signature = Buffer.from(nacl.sign.detached(contentHash, keyPair.secretKey)).toString('hex')

  const qs = params ? `?${params}` : ''
  const url = `${getCoboBaseUrl()}${apiPath.replace(/^\/v2/, '')}${qs}`
  const res = await fetch(url, {
    method,
    headers: {
      'Biz-Api-Key': apiKey,
      'Biz-Api-Nonce': nonce,
      'Biz-Api-Signature': signature,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body || undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Cobo ${method} ${apiPath} → ${res.status} ${JSON.stringify(json).slice(0, 200)}`)
  }
  return json
}
