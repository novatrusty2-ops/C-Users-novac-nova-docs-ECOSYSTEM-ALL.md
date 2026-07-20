import type { ChainDefinition, ChainToken } from '@/types'
import { getChain, tokensOnChain } from './chains'
import {
  canSwapToken,
  canTradeToken,
  defaultTokenFlags,
  isMeshStable,
  MESH_STABLE_SYMBOLS,
} from './tokenCapabilities'

export function tokensForChain(chainId: number): ChainDefinition['tokens'] {
  return tokensOnChain(chainId)
}

export function findToken(chainId: number, symbol: string): ChainToken | undefined {
  const sym = symbol.trim().toUpperCase()
  return tokensForChain(chainId).find((t) => t.symbol.toUpperCase() === sym)
}

/** Always surface core stables for Trade even if catalog import is empty */
const CORE_STABLES = ['USDC', 'USDT', 'CUSDC', 'CUSDT', 'AUSDT', 'KUSD'] as const

/** Tradable + swappable symbols for Trade tab (stables + mesh natives) */
export function swapableSymbols(chainId: number): string[] {
  const chain = getChain(chainId)
  if (!chain) return [...CORE_STABLES]

  const fromChain = tokensOnChain(chainId)
    .filter((t) => {
      const flags = defaultTokenFlags(chainId, t)
      return flags.swappable && canSwapToken(chainId, t) && canTradeToken(chainId, t)
    })
    .map((t) => t.symbol)

  const set = new Set(fromChain.map((s) => s.toUpperCase()))
  // Ensure stable rails stay swappable on every production chain
  for (const s of CORE_STABLES) {
    if (MESH_STABLE_SYMBOLS.has(s) || isMeshStable(s)) set.add(s)
  }
  // Keep native first when present
  const native = chain.nativeCurrency.symbol.toUpperCase()
  const ordered = [...set]
  ordered.sort((a, b) => {
    if (a === native) return -1
    if (b === native) return 1
    const as = isMeshStable(a) ? 0 : 1
    const bs = isMeshStable(b) ? 0 : 1
    return as - bs || a.localeCompare(b)
  })
  return ordered
}

export function transferableTokens(chainId: number): ChainToken[] {
  return tokensOnChain(chainId).filter((t) => defaultTokenFlags(chainId, t).transferable)
}
