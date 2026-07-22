/**
 * NovaPay webhook signature helpers (HMAC-SHA256).
 * When NOVAPAY_WEBHOOK_SECRET is empty, sandbox mode accepts unsigned events.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

function safeEqual(a, b) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

function hmacHex(secret, payload) {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex')
}

export function extractSignatureHeader(headers = {}) {
  const names = [
    'x-novapay-signature',
    'novapay-signature',
    'x-signature',
    'signature',
  ]
  for (const name of names) {
    const value = headers[name] ?? headers[name.toLowerCase()]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (Array.isArray(value) && value[0]) return String(value[0]).trim()
  }
  return ''
}

export function verifyNovaPayWebhookSignature(options) {
  const secret = options.secret?.trim()
  if (!secret) {
    // Sandbox convenience: allow unsigned when secret not configured.
    return { ok: true, matched: 'no-secret-sandbox' }
  }
  const header = options.signatureHeader?.trim()
  if (!header) {
    return { ok: false, reason: 'missing signature header' }
  }
  const raw =
    typeof options.rawBody === 'string'
      ? options.rawBody
      : Buffer.from(options.rawBody || '').toString('utf8')
  const expected = hmacHex(secret, raw)
  const bare = header.replace(/^sha256=/i, '')
  if (safeEqual(bare, expected)) {
    return { ok: true, matched: 'raw-hex' }
  }
  return { ok: false, reason: 'signature_mismatch' }
}
