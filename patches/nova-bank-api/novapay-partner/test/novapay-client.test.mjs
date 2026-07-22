import test from 'node:test'
import assert from 'node:assert/strict'
import { createNovaPayClient } from '../src/novapay.client.mjs'
import { loadNovaPayConfig, redactConfig } from '../src/novapay.config.mjs'

test('loadNovaPayConfig defaults to Railway sandbox base', () => {
  const cfg = loadNovaPayConfig({})
  assert.equal(cfg.enabled, true)
  assert.match(cfg.sandboxBase, /partners\/novapay\/sandbox$/)
  const redacted = redactConfig(cfg)
  assert.equal(redacted.webhookSecretSet, false)
})

test('createNovaPayClient status against live sandbox', async () => {
  const cfg = loadNovaPayConfig(process.env)
  const client = createNovaPayClient(cfg)
  const status = await client.status()
  assert.equal(status.partner, 'novapay')
  assert.equal(status.enabled, true)
  assert.equal(status.configured, true)
})
