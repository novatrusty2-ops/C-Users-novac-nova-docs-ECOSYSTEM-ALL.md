/**
 * NovaPay partner config for Nova Bank Online.
 * Secrets come from Railway / NestJS env — never commit real values.
 */

function trim(value) {
  return (value ?? '').trim()
}

const DEFAULT_SANDBOX =
  'https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox'

export function loadNovaPayConfig(env = process.env) {
  const enabled =
    String(env.NOVAPAY_ENABLED ?? 'true').toLowerCase() !== 'false'
  const sandboxBase = (
    trim(env.NOVAPAY_SANDBOX_BASE) || DEFAULT_SANDBOX
  ).replace(/\/+$/, '')

  return {
    enabled,
    partner: 'novapay',
    mode: trim(env.NOVAPAY_MODE).toLowerCase() || 'sandbox',
    sandboxBase,
    webhookSecret: trim(env.NOVAPAY_WEBHOOK_SECRET),
    webhookUrl:
      trim(env.NOVAPAY_WEBHOOK_URL) ||
      'https://nova-bank-api-production-7311.up.railway.app/api/v1/webhooks/novapay',
    callbackPath: trim(env.NOVAPAY_CALLBACK_PATH) || '/api/v1/webhooks/novapay',
    httpTimeoutMs: Number(env.NOVAPAY_HTTP_TIMEOUT_MS ?? 30_000),
  }
}

export function assertNovaPayReady(config) {
  if (!config.enabled) {
    throw new Error('NovaPay partner disabled (NOVAPAY_ENABLED=false)')
  }
  if (!config.sandboxBase) {
    throw new Error('NOVAPAY_SANDBOX_BASE missing')
  }
}

export function redactConfig(config) {
  return {
    enabled: config.enabled,
    partner: config.partner,
    mode: config.mode,
    sandboxBase: config.sandboxBase,
    webhookSecretSet: Boolean(config.webhookSecret),
    webhookUrl: config.webhookUrl || null,
    callbackPath: config.callbackPath,
  }
}
