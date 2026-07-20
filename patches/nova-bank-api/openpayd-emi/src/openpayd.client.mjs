/**
 * Minimal OpenPayd REST client (OAuth + accounts).
 * Docs: https://apidocs.openpayd.com/
 */

import { assertOpenPaydReady } from './openpayd.config.mjs'

export class OpenPaydClient {
  constructor(config, fetchImpl = fetch) {
    this.config = config
    this.fetchImpl = fetchImpl
    this.accessToken = null
    this.tokenExpiresAt = 0
  }

  async getAccessToken(force = false) {
    assertOpenPaydReady(this.config)
    const now = Date.now()
    if (!force && this.accessToken && this.tokenExpiresAt - 15_000 > now) {
      return {
        access_token: this.accessToken,
        accountHolderId: this.config.accountHolderId,
      }
    }

    const basic = Buffer.from(
      `${this.config.username}:${this.config.password}`,
      'utf8',
    ).toString('base64')
    const url = `${this.config.baseUrl}/api/oauth/token?grant_type=client_credentials`
    const res = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
    })
    const text = await res.text()
    if (!res.ok) {
      throw new Error(
        `OpenPayd OAuth failed HTTP ${res.status}: ${text.slice(0, 400)}`,
      )
    }
    const data = JSON.parse(text)
    if (!data.access_token) {
      throw new Error('OpenPayd OAuth response missing access_token')
    }
    this.accessToken = data.access_token
    const ttlSec = Number(data.expires_in ?? 800)
    this.tokenExpiresAt = Date.now() + Math.max(60, ttlSec) * 1000
    return data
  }

  async request(options) {
    assertOpenPaydReady(this.config)
    let lastError
    const attempts = Math.max(1, this.config.maxRetries)

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const token = await this.getAccessToken(attempt > 1)
        const holder = options.accountHolderId || this.config.accountHolderId
        const headers = {
          Authorization: `Bearer ${token.access_token}`,
          Accept: 'application/json',
          'x-account-holder-id': holder,
          ...(options.headers ?? {}),
        }
        if (options.body !== undefined) {
          headers['Content-Type'] = 'application/json'
        }
        if (options.idempotencyKey) {
          headers['x-idempotency-key'] = options.idempotencyKey
        }

        const controller = new AbortController()
        const timer = setTimeout(
          () => controller.abort(),
          this.config.httpTimeoutMs,
        )
        try {
          const res = await this.fetchImpl(
            `${this.config.baseUrl}${options.path}`,
            {
              method: options.method ?? 'GET',
              headers,
              body:
                options.body === undefined
                  ? undefined
                  : JSON.stringify(options.body),
              signal: controller.signal,
            },
          )
          const text = await res.text()
          if (res.status === 401 && attempt < attempts) {
            this.accessToken = null
            continue
          }
          if (!res.ok) {
            throw new Error(
              `OpenPayd ${options.method ?? 'GET'} ${options.path} failed HTTP ${res.status}: ${text.slice(0, 500)}`,
            )
          }
          if (!text) return {}
          return JSON.parse(text)
        } finally {
          clearTimeout(timer)
        }
      } catch (err) {
        lastError = err
        if (attempt >= attempts) break
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError))
  }

  listAccounts(params = {}) {
    const q = params.currency
      ? `?currency=${encodeURIComponent(params.currency)}`
      : ''
    return this.request({ path: `/api/accounts${q}` })
  }

  getAccount(accountId) {
    return this.request({
      path: `/api/accounts/${encodeURIComponent(accountId)}`,
    })
  }

  createPayout(body, idempotencyKey) {
    return this.request({
      method: 'POST',
      path: '/api/transactions',
      body,
      idempotencyKey,
    })
  }
}
