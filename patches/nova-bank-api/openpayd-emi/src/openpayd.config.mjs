/**
 * OpenPayd EMI config for Nova Bank Malta Ltd.
 * Secrets come from Railway / NestJS env — never commit real values.
 */

function trim(value) {
  return (value ?? '').trim()
}

export function loadOpenPaydConfig(env = process.env) {
  const username = trim(env.OPENPAYD_USERNAME)
  const password = trim(env.OPENPAYD_PASSWORD) || trim(env.EMI_OPENPAYD_API_KEY)
  const emiApiKey = trim(env.EMI_OPENPAYD_API_KEY)
  const envName = trim(env.OPENPAYD_ENV).toLowerCase() || 'sandbox'
  const baseUrl =
    trim(env.OPENPAYD_BASE_URL) ||
    (envName === 'production'
      ? 'https://api.openpayd.com'
      : 'https://sandbox.openpayd.com')

  return {
    legalEntity: trim(env.OPENPAYD_LEGAL_ENTITY) || 'Nova Bank Malta Ltd',
    env: envName === 'production' ? 'production' : 'sandbox',
    baseUrl: baseUrl.replace(/\/+$/, ''),
    username,
    password,
    emiApiKey,
    accountHolderId: trim(env.OPENPAYD_ACCOUNT_HOLDER_ID),
    accountId: trim(env.OPENPAYD_ACCOUNT_ID),
    clientId: trim(env.OPENPAYD_CLIENT_ID),
    referralId: trim(env.OPENPAYD_REFERRAL_ID),
    webhookSecret: trim(env.OPENPAYD_WEBHOOK_SECRET),
    webhookUrl: trim(env.OPENPAYD_WEBHOOK_URL),
    settlementIban: trim(env.OPENPAYD_SETTLEMENT_IBAN),
    settlementBic: trim(env.OPENPAYD_SETTLEMENT_BIC),
    settlementCurrency: trim(env.OPENPAYD_SETTLEMENT_CURRENCY) || 'EUR',
    httpTimeoutMs: Number(env.OPENPAYD_HTTP_TIMEOUT_MS ?? 30_000),
    maxRetries: Number(env.OPENPAYD_MAX_RETRIES ?? 3),
    live:
      String(env.OPENPAYD_LIVE ?? '').toLowerCase() === 'true' ||
      envName === 'production',
  }
}

export function assertOpenPaydReady(config) {
  const missing = []
  if (!config.username) missing.push('OPENPAYD_USERNAME')
  if (!config.password) {
    missing.push('OPENPAYD_PASSWORD (or EMI_OPENPAYD_API_KEY)')
  }
  if (!config.accountHolderId) missing.push('OPENPAYD_ACCOUNT_HOLDER_ID')
  if (missing.length) {
    throw new Error(
      `OpenPayd EMI not configured for ${config.legalEntity}: missing ${missing.join(', ')}`,
    )
  }
}

export function redactConfig(config) {
  return {
    legalEntity: config.legalEntity,
    env: config.env,
    baseUrl: config.baseUrl,
    usernameSet: Boolean(config.username),
    passwordSet: Boolean(config.password),
    emiApiKeySet: Boolean(config.emiApiKey),
    accountHolderIdSet: Boolean(config.accountHolderId),
    accountIdSet: Boolean(config.accountId),
    webhookSecretSet: Boolean(config.webhookSecret),
    webhookUrl: config.webhookUrl || null,
    settlementIbanSet: Boolean(config.settlementIban),
    settlementBicSet: Boolean(config.settlementBic),
    settlementCurrency: config.settlementCurrency,
    live: config.live,
  }
}
