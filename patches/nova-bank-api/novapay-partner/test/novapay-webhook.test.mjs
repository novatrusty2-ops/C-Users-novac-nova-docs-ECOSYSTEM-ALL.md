import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import {
  extractSignatureHeader,
  verifyNovaPayWebhookSignature,
} from '../src/novapay.webhook.mjs'

test('unsigned accepted when secret empty', () => {
  const result = verifyNovaPayWebhookSignature({
    secret: '',
    signatureHeader: '',
    rawBody: '{}',
  })
  assert.equal(result.ok, true)
  assert.equal(result.matched, 'no-secret-sandbox')
})

test('hmac hex verifies', () => {
  const secret = 'test-secret'
  const rawBody = '{"ok":true}'
  const sig = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  const result = verifyNovaPayWebhookSignature({
    secret,
    signatureHeader: `sha256=${sig}`,
    rawBody,
  })
  assert.equal(result.ok, true)
})

test('extractSignatureHeader finds x-novapay-signature', () => {
  const value = extractSignatureHeader({ 'x-novapay-signature': 'abc' })
  assert.equal(value, 'abc')
})
