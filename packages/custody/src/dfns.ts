/**
 * DFNS client factory — reads credentials from env (never hardcode secrets).
 * @see https://docs.dfns.co/sdks/backend/typescript
 */
import { readFileSync } from 'node:fs'
import { DfnsApiClient } from '@dfns/sdk'
import { AsymmetricKeySigner } from '@dfns/sdk-keysigner'

export function createDfnsClient() {
  const baseUrl = process.env.DFNS_API_BASE_URL || 'https://api.dfns.io'
  const authToken = process.env.DFNS_AUTH_TOKEN
  const orgId = process.env.DFNS_ORG_ID
  const credId = process.env.DFNS_CRED_ID
  const keyPath = process.env.DFNS_PRIVATE_KEY_PATH

  if (!authToken || !orgId || !credId || !keyPath) {
    throw new Error('DFNS env incomplete: DFNS_AUTH_TOKEN, DFNS_ORG_ID, DFNS_CRED_ID, DFNS_PRIVATE_KEY_PATH')
  }

  const privateKey = readFileSync(keyPath, 'utf8')
  const signer = new AsymmetricKeySigner({ credId, privateKey })
  return new DfnsApiClient({ baseUrl, orgId, authToken, signer })
}
