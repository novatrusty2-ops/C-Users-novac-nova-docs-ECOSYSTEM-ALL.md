import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import {
  extractSignatureHeader,
  verifyOpenPaydWebhookSignature,
} from '../src/openpayd.webhook.mjs'

test('extractSignatureHeader finds signature-digest', () => {
  assert.equal(extractSignatureHeader({ 'signature-digest': 'abc' }), 'abc')
})

test('verify raw hex HMAC', () => {
  const secret = 'whsec_test'
  const body = '{"type":"PAYIN","id":"1"}'
  const sig = createHmac('sha256', secret).update(body).digest('hex')
  const result = verifyOpenPaydWebhookSignature({
    rawBody: body,
    signatureHeader: sig,
    secret,
  })
  assert.equal(result.ok, true)
  assert.equal(result.matched, 'raw-hex')
})

test('verify t=v1 hex HMAC', () => {
  const secret = 'whsec_test'
  const body = '{"type":"PAYIN","id":"2"}'
  const t = String(Math.floor(Date.now() / 1000))
  const v1 = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')
  const result = verifyOpenPaydWebhookSignature({
    rawBody: body,
    signatureHeader: `t=${t},v1=${v1}`,
    secret,
  })
  assert.equal(result.ok, true)
  assert.equal(result.matched, 't-v1-hex')
})

test('reject bad signature', () => {
  const result = verifyOpenPaydWebhookSignature({
    rawBody: '{}',
    signatureHeader: 'deadbeef',
    secret: 'whsec_test',
  })
  assert.equal(result.ok, false)
})
