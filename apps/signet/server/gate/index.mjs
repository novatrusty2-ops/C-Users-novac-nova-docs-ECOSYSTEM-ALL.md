import http from 'node:http'
import { randomBytes } from 'node:crypto'

const PORT = Number(process.env.GATE_PORT ?? 8787)
const ACCESS_CODE = process.env.GATE_ACCESS_CODE ?? 'signet-institutional'
const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 10

const attempts = new Map<string, { count: number; resetAt: number }>()

function clientKey(req) {
  return req.socket.remoteAddress ?? 'unknown'
}

function rateLimit(key) {
  const now = Date.now()
  let entry = attempts.get(key)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS }
    attempts.set(key, entry)
  }
  entry.count += 1
  if (entry.count > MAX_ATTEMPTS) {
    return false
  }
  return true
}

function send(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(payload)
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  if (req.method === 'GET' && req.url === '/health') {
    send(res, 200, { ok: true })
    return
  }

  if (req.method !== 'POST' || req.url !== '/verify') {
    send(res, 404, { error: 'Not found' })
    return
  }

  const key = clientKey(req)
  if (!rateLimit(key)) {
    send(res, 429, { error: 'Too many attempts' })
    return
  }

  let body = ''
  for await (const chunk of req) body += chunk

  try {
    const { code } = JSON.parse(body || '{}')
    if (code !== ACCESS_CODE) {
      send(res, 401, { error: 'Invalid code' })
      return
    }
    const token = randomBytes(24).toString('hex')
    send(res, 200, { token, expiresIn: 3600 })
  } catch {
    send(res, 400, { error: 'Bad request' })
  }
})

server.listen(PORT, () => {
  console.log(`Institutional gate listening on http://localhost:${PORT}`)
})
