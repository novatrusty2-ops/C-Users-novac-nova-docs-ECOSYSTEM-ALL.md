/**
 * OpenPayd webhook signature helpers.
 * Confirm algorithm against https://apidocs.openpayd.com/ → Webhook Signatures
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

function hmacBase64(secret, payload) {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('base64')
}

export function extractSignatureHeader(headers) {
  const names = [
    'signature-digest',
    'x-signature-digest',
    'x-openpayd-signature',
    'openpayd-signature',
    'x-signature',
  ]
  for (const name of names) {
    const value = headers[name] ?? headers[name.toLowerCase()]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (Array.isArray(value) && value[0]) return String(value[0]).trim()
  }
  return ''
}

export function verifyOpenPaydWebhookSignature(options) {
  const secret = options.secret?.trim()
  if (!secret) {
    return { ok: false, reason: 'OPENPAYD_WEBHOOK_SECRET not set' }
  }
  const header = options.signatureHeader?.trim()
  if (!header) {
    return { ok: false, reason: 'missing signature header' }
  }

  const raw =
    typeof options.rawBody === 'string'
      ? options.rawBody
      : options.rawBody.toString('utf8')

  const rawHex = hmacHex(secret, raw)
  const rawB64 = hmacBase64(secret, raw)
  const headerBare = header.replace(/^sha256=/i, '')
  if (safeEqual(headerBare, rawHex)) {
    return { ok: true, matched: 'raw-hex' }
  }
  if (safeEqual(headerBare, rawB64)) {
    return { ok: true, matched: 'raw-base64' }
  }

  const parts = Object.fromEntries(
    header
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf('=')
        return i === -1 ? [p, ''] : [p.slice(0, i), p.slice(i + 1)]
      }),
  )

  if (parts.t && parts.v1) {
    const ts = Number(parts.t)
    const skew = options.maxSkewSeconds ?? 300
    if (!Number.isFinite(ts)) {
      return { ok: false, reason: 'invalid timestamp in signature header' }
    }
    if (Math.abs(Math.floor(Date.now() / 1000) - ts) > skew) {
      return { ok: false, reason: 'signature timestamp outside allowed skew' }
    }
    const signed = `${parts.t}.${raw}`
    const v1Hex = hmacHex(secret, signed)
    const v1B64 = hmacBase64(secret, signed)
    if (safeEqual(parts.v1, v1Hex)) {
      return { ok: true, matched: 't-v1-hex' }
    }
    if (safeEqual(parts.v1, v1B64)) {
      return { ok: true, matched: 't-v1-base64' }
    }
  }

  return { ok: false, reason: 'signature mismatch' }
}
