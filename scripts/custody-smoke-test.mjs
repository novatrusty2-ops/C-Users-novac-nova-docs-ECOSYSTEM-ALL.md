#!/usr/bin/env node
/**
 * Smoke-test DFNS + Cobo credentials from gitignored .env
 * Usage: node --env-file=.env scripts/custody-smoke-test.mjs
 *        (or: node scripts/custody-smoke-test.mjs  — loads .env itself)
 * Never prints secret values.
 */
import { createHash, createPrivateKey } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import nacl from 'tweetnacl'
import { DfnsApiClient } from '@dfns/sdk'
import { AsymmetricKeySigner } from '@dfns/sdk-keysigner'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv(path) {
  if (!existsSync(path)) throw new Error(`Missing ${path}`)
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    out[t.slice(0, i)] = t.slice(i + 1)
  }
  return out
}

function mask(s) {
  if (!s) return '(missing)'
  if (s.length <= 12) return '***'
  return `${s.slice(0, 6)}…${s.slice(-4)} (len=${s.length})`
}

async function testDfns(env) {
  const baseUrl = env.DFNS_API_BASE_URL || 'https://api.dfns.io'
  const authToken = env.DFNS_AUTH_TOKEN
  const orgId = env.DFNS_ORG_ID
  const credId = env.DFNS_CRED_ID
  const keyPath = resolve(root, env.DFNS_PRIVATE_KEY_PATH || 'secrets/dfns-rsa2048.pem')

  if (!authToken) throw new Error('DFNS_AUTH_TOKEN missing')
  if (!existsSync(keyPath)) throw new Error(`DFNS private key missing at ${keyPath}`)

  const res = await fetch(`${baseUrl}/wallets`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: 'application/json',
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`DFNS GET /wallets → ${res.status} ${JSON.stringify(body).slice(0, 240)}`)
  }

  const count = Array.isArray(body.items) ? body.items.length : Array.isArray(body) ? body.length : '?'

  const privateKey = readFileSync(keyPath, 'utf8')
  createPrivateKey(privateKey) // validate PEM

  const signer = new AsymmetricKeySigner({ credId, privateKey })
  const dfns = new DfnsApiClient({ baseUrl, orgId, authToken, signer })
  const listed = await dfns.wallets.listWallets()
  const sdkCount = listed.items?.length ?? 0

  return {
    ok: true,
    baseUrl,
    orgId: mask(orgId),
    credId: mask(credId),
    token: mask(authToken),
    walletsViaFetch: count,
    walletsViaSdk: sdkCount,
  }
}

async function testCobo(env) {
  const apiKey = env.COBO_API_KEY
  const apiSecret = env.COBO_API_SECRET
  if (!apiKey || !apiSecret) throw new Error('COBO_API_KEY / COBO_API_SECRET missing')

  const hosts = [
    ...new Set(
      [env.COBO_API_BASE_URL, 'https://api.dev.cobo.com/v2', 'https://api.cobo.com/v2'].filter(Boolean),
    ),
  ]

  async function call(baseUrl) {
    const path = '/v2/wallets'
    const method = 'GET'
    const params = 'limit=1'
    const nonce = String(Date.now())
    const body = ''
    const strToSign = `${method}|${path}|${nonce}|${params}|${body}`
    const once = createHash('sha256').update(strToSign).digest()
    const contentHash = createHash('sha256').update(once).digest()
    const seed = Buffer.from(apiSecret, 'hex')
    if (seed.length !== 32) {
      throw new Error(`COBO_API_SECRET must be 32-byte hex (got ${seed.length} bytes)`)
    }
    const keyPair = nacl.sign.keyPair.fromSeed(seed)
    const signature = Buffer.from(nacl.sign.detached(contentHash, keyPair.secretKey)).toString('hex')
    const derivedPub = Buffer.from(keyPair.publicKey).toString('hex')

    const url = `${baseUrl.replace(/\/$/, '')}/wallets?${params}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Biz-Api-Key': apiKey,
        'Biz-Api-Nonce': nonce,
        'Biz-Api-Signature': signature,
      },
    })
    const text = await res.text()
    let json
    try {
      json = JSON.parse(text)
    } catch {
      json = { raw: text.slice(0, 200) }
    }
    return { res, json, baseUrl, derivedPub }
  }

  let lastErr
  for (const base of hosts) {
    const { res, json, baseUrl, derivedPub } = await call(base)
    if (res.ok) {
      const data = json?.data
      return {
        ok: true,
        baseUrl,
        apiKey: mask(apiKey),
        status: res.status,
        walletCount: Array.isArray(data) ? data.length : data ? 1 : 0,
        pubkeyMatchesKey: derivedPub === apiKey,
      }
    }
    lastErr = `${baseUrl} → ${res.status} ${JSON.stringify(json).slice(0, 280)}`
    if (res.status === 401 || res.status === 403 || res.status === 400) continue
  }
  throw new Error(`Cobo failed on all hosts. Last: ${lastErr}`)
}

async function main() {
  const env = { ...process.env, ...loadEnv(resolve(root, '.env')) }
  console.log('Custody smoke test')
  console.log('------------------')

  const dfns = await testDfns(env)
  console.log('DFNS: OK')
  console.log(JSON.stringify(dfns, null, 2))

  const cobo = await testCobo(env)
  console.log('COBO: OK')
  console.log(JSON.stringify(cobo, null, 2))

  console.log('\nBoth platforms authenticated successfully.')
}

main().catch((err) => {
  console.error('FAIL:', err.message || err)
  process.exit(1)
})
