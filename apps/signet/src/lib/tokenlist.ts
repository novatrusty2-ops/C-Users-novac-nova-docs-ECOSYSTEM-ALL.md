import type { ChainToken } from '@/types'
import { publicEvmChains } from './chains'

export function tokensForPublicChains(): ChainToken[] {
  const seen = new Set<string>()
  const out: ChainToken[] = []
  for (const chain of publicEvmChains()) {
    for (const token of chain.tokens) {
      const key = `${chain.id}:${token.symbol}:${token.address ?? 'native'}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ ...token })
    }
  }
  return out
}

export function tokensForChain(chainId: number): ChainToken[] {
  const chain = publicEvmChains().find((c) => c.id === chainId)
  return chain?.tokens ?? []
}

export { publicEvmChains }
