import type { ChainToken } from '@/types'
import { tokensForChain, toChainToken, type EcosystemTokenDef } from './ecosystemTokens'

const KEY = 'nova.usertokens.v1'

export interface UserTokenRecord {
  chainId: number
  token: ChainToken
  source: 'ecosystem' | 'manual' | 'signet' | 'pouchpay'
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
    return JSON.parse(raw) as UserTokenRecord[]
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

/** Import curated NovaONE (22016) + NRW (33001) ecosystem token catalogs */
export function importEcosystemTokensFromMesh(
  source: UserTokenRecord['source'] = 'ecosystem',
): { added: number; total: number; count: number } {
  const defs = [...tokensForChain(22016), ...tokensForChain(33001)]
  const now = Date.now()
  const records: UserTokenRecord[] = defs.map((d: EcosystemTokenDef) => ({
    chainId: d.chainIds[0]!,
    token: toChainToken(d),
    source,
    importedAt: now,
  }))
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
