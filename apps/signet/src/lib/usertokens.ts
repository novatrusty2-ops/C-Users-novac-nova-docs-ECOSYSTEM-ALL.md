import type { ChainToken } from '@/types'
import { getPref, setPref } from './prefs'

const ADDED_KEY = 'userTokens.added'
const HIDDEN_KEY = 'userTokens.hidden'

export interface UserTokenRef {
  chainId: number
  address: string | null
  symbol: string
  name: string
  decimals: number
}

function tokenKey(chainId: number, address: string | null): string {
  return `${chainId}:${address?.toLowerCase() ?? 'native'}`
}

export function getUserAddedTokens(): UserTokenRef[] {
  return getPref<UserTokenRef[]>(ADDED_KEY, [])
}

export function addUserToken(token: UserTokenRef): void {
  const list = getUserAddedTokens()
  const key = tokenKey(token.chainId, token.address)
  if (list.some((t) => tokenKey(t.chainId, t.address) === key)) return
  setPref(ADDED_KEY, [...list, token])
}

export function removeUserToken(chainId: number, address: string | null): void {
  const key = tokenKey(chainId, address)
  setPref(
    ADDED_KEY,
    getUserAddedTokens().filter((t) => tokenKey(t.chainId, t.address) !== key),
  )
}

export function getHiddenTokenKeys(): string[] {
  return getPref<string[]>(HIDDEN_KEY, [])
}

export function hideToken(chainId: number, address: string | null): void {
  const key = tokenKey(chainId, address)
  const hidden = new Set(getHiddenTokenKeys())
  hidden.add(key)
  setPref(HIDDEN_KEY, [...hidden])
}

export function unhideToken(chainId: number, address: string | null): void {
  const key = tokenKey(chainId, address)
  setPref(
    HIDDEN_KEY,
    getHiddenTokenKeys().filter((k) => k !== key),
  )
}

export function isTokenHidden(chainId: number, address: string | null): boolean {
  return getHiddenTokenKeys().includes(tokenKey(chainId, address))
}

export function mergeWithUserTokens(chainId: number, base: ChainToken[]): ChainToken[] {
  const added = getUserAddedTokens()
    .filter((t) => t.chainId === chainId)
    .map(
      (t): ChainToken => ({
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals,
        address: t.address,
        standard: t.address ? 'erc20' : 'native',
      }),
    )
  const hidden = new Set(getHiddenTokenKeys())
  return [...base, ...added].map((t) => ({
    ...t,
    hidden: hidden.has(tokenKey(chainId, t.address)),
  }))
}
