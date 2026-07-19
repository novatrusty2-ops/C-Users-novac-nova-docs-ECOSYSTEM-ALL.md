import type { ChainToken } from '@/types'
import {
  tokensForNovaPlus,
  toChainToken,
  withPricedHints,
  type EcosystemTokenDef,
} from './ecosystemTokens'
import { oracleUsdPrice } from './oracle'
import { NOVA_PLUS_CHAIN_IDS } from './novaPlus'

const KEY = 'nova.usertokens.v1'
const CATALOG_META_KEY = 'nova.usertokens.catalog.v1'

export type UserTokenSource = 'ecosystem' | 'manual' | 'pouchpay'

/** Bump when the Nova Plus catalog grows so sessions re-sync automatically */
export function novaPlusCatalogFingerprint(): string {
  const defs = tokensForNovaPlus()
  return `nova-plus:${defs.length}:bridge7:${NOVA_PLUS_CHAIN_IDS.join(',')}:11013`
}

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
    // Normalize unknown / legacy source tags → ecosystem
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

export function mergeUserTokens(
  incoming: UserTokenRecord[],
  opts?: { refreshPrices?: boolean },
): { added: number; total: number; records: UserTokenRecord[] } {
  const existing = loadUserTokens()
  const map = new Map(existing.map((r) => [tokenKey(r.chainId, r.token), r]))
  let added = 0
  for (const rec of incoming) {
    const k = tokenKey(rec.chainId, rec.token)
    const prev = map.get(k)
    if (!prev) {
      map.set(k, rec)
      added++
      continue
    }
    if (opts?.refreshPrices) {
      map.set(k, {
        ...prev,
        token: {
          ...prev.token,
          usd: rec.token.usd ?? prev.token.usd,
          coingeckoId: rec.token.coingeckoId ?? prev.token.coingeckoId,
          name: rec.token.name || prev.token.name,
          // Prefer verified contract addresses
          address: prev.token.address || rec.token.address,
          standard: prev.token.address || rec.token.address ? 'erc20' : prev.token.standard,
        },
      })
    }
  }
  const next = [...map.values()]
  saveUserTokens(next)
  return { added, total: next.length, records: next }
}

/**
 * Import all Nova Plus tokens (NovaONE 22016 + NRW 33001 + Nova Production 9001)
 * with full oracle price hints. Liquidity is attached on balance refresh.
 */
export function importEcosystemTokensFromMesh(
  source: UserTokenRecord['source'] = 'ecosystem',
): { added: number; total: number; count: number; chains: number[] } {
  const defs = withPricedHints(tokensForNovaPlus())
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
  try {
    storage()?.setItem(CATALOG_META_KEY, novaPlusCatalogFingerprint())
  } catch {
    /* ignore */
  }
  return { ...result, count: records.length, chains: [...NOVA_PLUS_CHAIN_IDS] }
}

/**
 * Ensure the full Nova Plus catalog is present (idempotent).
 * Runs on every session — fills gaps when the catalog grows.
 */
export function ensureNovaPlusTokensImported(
  source: UserTokenRecord['source'] = 'ecosystem',
): { added: number; total: number; count: number; chains: number[]; synced: boolean } {
  const fp = novaPlusCatalogFingerprint()
  const prev = storage()?.getItem(CATALOG_META_KEY)
  const before = loadUserTokens().length
  const result = importEcosystemTokensFromMesh(source)
  const synced = result.added > 0 || prev !== fp || before === 0
  return { ...result, synced }
}

export function userTokensForChain(chainId: number): ChainToken[] {
  return loadUserTokens()
    .filter((r) => r.chainId === chainId)
    .map((r) => r.token)
}

export function clearUserTokens(): void {
  storage()?.removeItem(KEY)
  storage()?.removeItem(CATALOG_META_KEY)
  try {
    window.dispatchEvent(new Event('nova-tokens-changed'))
  } catch {
    /* node / tests */
  }
}
