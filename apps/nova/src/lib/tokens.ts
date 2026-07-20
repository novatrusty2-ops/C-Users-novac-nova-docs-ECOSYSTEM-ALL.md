import type { ChainDefinition, ChainToken } from '@/types'
import { getChain, tokensOnChain } from './chains'
import { canSwapToken, canTradeToken, defaultTokenFlags } from './tokenCapabilities'

export function tokensForChain(chainId: number): ChainDefinition['tokens'] {
  return tokensOnChain(chainId)
}

export function findToken(chainId: number, symbol: string): ChainToken | undefined {
  const sym = symbol.trim().toUpperCase()
  return tokensForChain(chainId).find((t) => t.symbol.toUpperCase() === sym)
}

/** Tradable + swappable symbols for Trade tab (stables + mesh natives) */
export function swapableSymbols(chainId: number): string[] {
  const chain = getChain(chainId)
  if (!chain) return []
  return tokensOnChain(chainId)
    .filter((t) => {
      const flags = defaultTokenFlags(chainId, t)
      return flags.swappable && canSwapToken(chainId, t) && canTradeToken(chainId, t)
    })
    .map((t) => t.symbol)
}

export function transferableTokens(chainId: number): ChainToken[] {
  return tokensOnChain(chainId).filter((t) => defaultTokenFlags(chainId, t).transferable)
}
