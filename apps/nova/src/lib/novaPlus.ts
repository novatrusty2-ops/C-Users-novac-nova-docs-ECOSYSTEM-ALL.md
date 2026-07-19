/** Nova Plus — production mesh wallet: NovaONE + NRW World + Nova Plus chain */

export const NOVA_PLUS_CHAINS = {
  novaOne: 22016,
  nrwWorld: 33001,
  /** Nova Plus production / custody chain (formerly Nova Production 9001) */
  novaPlus: 9001,
} as const

export const NOVA_PLUS_CHAIN_IDS = [
  NOVA_PLUS_CHAINS.novaOne,
  NOVA_PLUS_CHAINS.nrwWorld,
  NOVA_PLUS_CHAINS.novaPlus,
] as const

export type NovaPlusChainId = (typeof NOVA_PLUS_CHAIN_IDS)[number]

export const NOVA_PLUS_LABEL = 'Nova Plus'
export const NOVA_PLUS_WALLET_NAME = 'Nova Plus Wallet'

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
      return 'Nova Plus'
    default:
      return `Chain ${chainId}`
  }
}

export function quoteAssetForChain(chainId: number): string {
  if (chainId === 33001) return 'USDT'
  if (chainId === 9001) return 'NOVA'
  return 'USDC'
}
