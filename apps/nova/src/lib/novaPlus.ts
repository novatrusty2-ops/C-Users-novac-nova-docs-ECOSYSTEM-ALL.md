/** Nova Plus — NovaONE + NRW World + Nova Production mesh */

export const NOVA_PLUS_CHAINS = {
  novaOne: 22016,
  nrwWorld: 33001,
  novaProduction: 9001,
} as const

export const NOVA_PLUS_CHAIN_IDS = [
  NOVA_PLUS_CHAINS.novaOne,
  NOVA_PLUS_CHAINS.nrwWorld,
  NOVA_PLUS_CHAINS.novaProduction,
] as const

export type NovaPlusChainId = (typeof NOVA_PLUS_CHAIN_IDS)[number]

export const NOVA_PLUS_LABEL = 'Nova Plus'

export function isNovaPlusChain(chainId: number): boolean {
  return (NOVA_PLUS_CHAIN_IDS as readonly number[]).includes(chainId)
}

export function novaPlusChainLabel(chainId: number): string {
  switch (chainId) {
    case 22016:
      return 'NovaONE'
    case 33001:
      return 'NRW World'
    case 9001:
      return 'Nova Production'
    default:
      return `Chain ${chainId}`
  }
}

export function quoteAssetForChain(chainId: number): string {
  if (chainId === 33001) return 'USDT'
  if (chainId === 9001) return 'NOVA'
  return 'USDC'
}
