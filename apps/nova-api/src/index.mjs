import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { loadEnv, dfnsKeyPath } from './env.mjs'
import { listDfnsWallets } from './dfns.mjs'
import { listCoboWallets } from './cobo.mjs'

const env = loadEnv()
const PORT = Number(env.PORT || env.NOVA_API_PORT || 8787)
const CORS_ORIGIN = env.CORS_ORIGIN || '*'

function dfnsReady(e) {
  return Boolean(
    e.DFNS_AUTH_TOKEN && e.DFNS_CRED_ID && e.DFNS_ORG_ID && existsSync(dfnsKeyPath(e)),
  )
}

function coboReady(e) {
  return Boolean(e.COBO_API_KEY && e.COBO_API_SECRET)
}

function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  })
  res.end(payload)
}

async function handler(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

  if (req.method === 'OPTIONS') {
    json(res, 204, {})
    return
  }

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      json(res, 200, {
        ok: true,
        service: 'nova-api',
        product: 'nova-wallet',
        dfns: dfnsReady(env),
        cobo: coboReady(env),
      })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/custody/status') {
      json(res, 200, {
        product: 'nova-wallet',
        dfns: {
          ready: dfnsReady(env),
          baseUrl: env.DFNS_API_BASE_URL || 'https://api.dfns.io',
        },
        cobo: {
          ready: coboReady(env),
          baseUrl: env.COBO_API_BASE_URL || 'https://api.cobo.com/v2',
        },
      })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/custody/dfns/wallets') {
      if (!dfnsReady(env)) {
        json(res, 503, { error: 'DFNS not configured' })
        return
      }
      const items = await listDfnsWallets(env)
      json(res, 200, { provider: 'dfns', count: items.length, items })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/custody/cobo/wallets') {
      if (!coboReady(env)) {
        json(res, 503, { error: 'Cobo not configured' })
        return
      }
      const items = await listCoboWallets(env)
      json(res, 200, { provider: 'cobo', count: items.length, items })
      return
    }

    json(res, 404, { error: 'not_found' })
  } catch (err) {
    json(res, 500, { error: err instanceof Error ? err.message : 'server_error' })
  }
}

createServer(handler).listen(PORT, () => {
  console.log(`nova-api listening on :${PORT}`)
})
