import { readFileSync, existsSync } from 'node:fs'
import { DfnsApiClient } from '@dfns/sdk'
import { AsymmetricKeySigner } from '@dfns/sdk-keysigner'
import { dfnsKeyPath } from './env.mjs'

export function createDfns(env) {
  const authToken = env.DFNS_AUTH_TOKEN
  const orgId = env.DFNS_ORG_ID
  const credId = env.DFNS_CRED_ID
  const keyPath = dfnsKeyPath(env)
  if (!authToken || !orgId || !credId) {
    throw new Error('DFNS env incomplete')
  }
  if (!existsSync(keyPath)) throw new Error('DFNS private key missing')
  const privateKey = readFileSync(keyPath, 'utf8')
  const signer = new AsymmetricKeySigner({ credId, privateKey })
  return new DfnsApiClient({
    baseUrl: env.DFNS_API_BASE_URL || 'https://api.dfns.io',
    orgId,
    authToken,
    signer,
  })
}

export async function listDfnsWallets(env) {
  const dfns = createDfns(env)
  const { items } = await dfns.wallets.listWallets()
  return (items || []).map((w) => ({
    id: w.id,
    name: w.name ?? null,
    network: w.network,
    address: w.address ?? null,
    status: w.status ?? null,
  }))
}
