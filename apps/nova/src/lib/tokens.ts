import type { ChainDefinition } from '@/types'
import { getChain } from './chains'

export function tokensForChain(chainId: number): ChainDefinition['tokens'] {
  return getChain(chainId)?.tokens ?? []
}

export function findToken(chainId: number, symbol: string) {
  const sym = symbol.trim().toUpperCase()
  return tokensForChain(chainId).find((t) => t.symbol.toUpperCase() === sym)
}

export function swapableSymbols(chainId: number): string[] {
  return tokensForChain(chainId)
    .filter((t) => t.standard === 'native' || t.usd != null)
    .map((t) => t.symbol)
}
