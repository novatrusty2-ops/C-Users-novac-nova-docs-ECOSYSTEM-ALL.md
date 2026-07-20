import type { ChainToken } from '@/types'
import {
  tokensForMeshCatalog,
  toChainToken,
  withPricedHints,
  type EcosystemTokenDef,
} from './ecosystemTokens'
import { oracleUsdPrice } from './oracle'

const KEY = 'nova.usertokens.v1'

export type UserTokenSource = 'ecosystem' | 'manual' | 'pouchpay'

export interface UserTokenRecord {
  chainId: number
  token: ChainToken
  source: UserTokenSource
  importedAt: number
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export function loadUserTokens(): UserTokenRecord[] {
  const raw = storage()?.getItem(KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Array<UserTokenRecord & { source?: string }>
    // Normalize legacy source tags (e.g. old "signet") → ecosystem
    return parsed.map((r) => ({
      ...r,
      source:
        r.source === 'pouchpay' || r.source === 'manual' || r.source === 'ecosystem'
          ? r.source
          : 'ecosystem',
    }))
  } catch {
    return []
  }
}

export function saveUserTokens(records: UserTokenRecord[]): void {
  storage()?.setItem(KEY, JSON.stringify(records))
  try {
    window.dispatchEvent(new Event('nova-tokens-changed'))
  } catch {
    /* node / tests */
  }
}

function tokenKey(chainId: number, t: ChainToken): string {
  return `${chainId}:${t.symbol.toUpperCase()}:${(t.address ?? 'native').toLowerCase()}`
}

export function mergeUserTokens(incoming: UserTokenRecord[]): { added: number; total: number } {
  const existing = loadUserTokens()
  const map = new Map(existing.map((r) => [tokenKey(r.chainId, r.token), r]))
  let added = 0
  for (const rec of incoming) {
    const k = tokenKey(rec.chainId, rec.token)
    if (!map.has(k)) {
      map.set(k, rec)
      added++
    }
  }
  const next = [...map.values()]
  saveUserTokens(next)
  return { added, total: next.length }
}

/** Import NovaONE + NRW + DeFi Oracle (138) catalogs with price + liquidity hints */
export function importEcosystemTokensFromMesh(
  source: UserTokenRecord['source'] = 'ecosystem',
): { added: number; total: number; count: number } {
  const defs = withPricedHints(tokensForMeshCatalog())
  const now = Date.now()
  const records: UserTokenRecord[] = defs.map((d: EcosystemTokenDef) => {
    const token = toChainToken(d)
    const hinted = oracleUsdPrice(token.symbol)
    if (token.usd == null && hinted != null) token.usd = hinted
    return {
      chainId: d.chainIds[0]!,
      token,
      source,
      importedAt: now,
    }
  })
  const result = mergeUserTokens(records)
  return { ...result, count: records.length }
}

export function userTokensForChain(chainId: number): ChainToken[] {
  return loadUserTokens()
    .filter((r) => r.chainId === chainId)
    .map((r) => r.token)
}

export function clearUserTokens(): void {
  storage()?.removeItem(KEY)
  try {
    window.dispatchEvent(new Event('nova-tokens-changed'))
  } catch {
    /* node / tests */
  }
}
