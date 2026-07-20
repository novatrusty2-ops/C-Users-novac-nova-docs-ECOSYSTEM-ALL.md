import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assertOpenPaydReady,
  loadOpenPaydConfig,
} from '../src/openpayd.config.mjs'
import { OpenPaydClient } from '../src/openpayd.client.mjs'

test('loadOpenPaydConfig maps EMI_OPENPAYD_API_KEY as password fallback', () => {
  const cfg = loadOpenPaydConfig({
    OPENPAYD_USERNAME: 'user',
    EMI_OPENPAYD_API_KEY: 'portal-key',
    OPENPAYD_ACCOUNT_HOLDER_ID: 'holder-1',
    OPENPAYD_ENV: 'sandbox',
  })
  assert.equal(cfg.password, 'portal-key')
  assert.equal(cfg.baseUrl, 'https://sandbox.openpayd.com')
  assert.equal(cfg.legalEntity, 'Nova Bank Malta Ltd')
  assertOpenPaydReady(cfg)
})

test('OpenPaydClient OAuth + listAccounts', async () => {
  const calls = []
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init })
    if (String(url).includes('/oauth/token')) {
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            access_token: 'tok-1',
            expires_in: 900,
            accountHolderId: 'holder-1',
          }),
      }
    }
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ id: 'acc-1', currency: 'EUR' }]),
    }
  }

  const client = new OpenPaydClient(
    loadOpenPaydConfig({
      OPENPAYD_USERNAME: 'user',
      OPENPAYD_PASSWORD: 'pass',
      OPENPAYD_ACCOUNT_HOLDER_ID: 'holder-1',
      OPENPAYD_BASE_URL: 'https://sandbox.openpayd.com',
    }),
    fetchImpl,
  )

  const accounts = await client.listAccounts({ currency: 'EUR' })
  assert.equal(accounts[0].id, 'acc-1')
  assert.equal(calls.length, 2)
  assert.match(calls[0].url, /oauth\/token/)
  assert.match(calls[0].init.headers.Authorization, /^Basic /)
  assert.equal(calls[1].init.headers['x-account-holder-id'], 'holder-1')
  assert.match(calls[1].init.headers.Authorization, /^Bearer tok-1/)
})
