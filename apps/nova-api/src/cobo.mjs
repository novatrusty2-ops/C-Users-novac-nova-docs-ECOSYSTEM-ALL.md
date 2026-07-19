import { createHash } from 'node:crypto'
import nacl from 'tweetnacl'

export async function coboFetch(env, path, { method = 'GET', params = '', body = '' } = {}) {
  const apiKey = env.COBO_API_KEY
  const apiSecret = env.COBO_API_SECRET
  const base = (env.COBO_API_BASE_URL || 'https://api.cobo.com/v2').replace(/\/$/, '')
  if (!apiKey || !apiSecret) throw new Error('COBO env incomplete')

  const apiPath = path.startsWith('/v2') ? path : `/v2${path.startsWith('/') ? path : `/${path}`}`
  const nonce = String(Date.now())
  const strToSign = `${method}|${apiPath}|${nonce}|${params}|${body}`
  const contentHash = createHash('sha256')
    .update(createHash('sha256').update(strToSign).digest())
    .digest()
  const seed = Buffer.from(apiSecret, 'hex')
  const keyPair = nacl.sign.keyPair.fromSeed(seed)
  const signature = Buffer.from(nacl.sign.detached(contentHash, keyPair.secretKey)).toString('hex')

  const qs = params ? `?${params}` : ''
  const url = `${base}${apiPath.replace(/^\/v2/, '')}${qs}`
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
    throw new Error(`Cobo ${res.status}: ${JSON.stringify(json).slice(0, 200)}`)
  }
  return json
}

export async function listCoboWallets(env) {
  const json = await coboFetch(env, '/v2/wallets', { params: 'limit=50' })
  const data = Array.isArray(json?.data) ? json.data : []
  return data.map((w) => ({
    id: w.wallet_id || w.id,
    name: w.name ?? null,
    type: w.wallet_type ?? null,
    subtype: w.wallet_subtype ?? null,
  }))
}
