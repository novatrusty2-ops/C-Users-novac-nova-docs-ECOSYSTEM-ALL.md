import { getAddress } from 'ethers'
import { CHAINS } from '@/lib/chains'

/** Chains where Safe (multisig) deployment is supported offline */
export const SAFE_SUPPORTED_CHAIN_IDS = CHAINS.filter(
  (c) => c.category === 'public' || c.id === 22016 || c.id === 33001 || c.id === 138,
).map((c) => c.id)

export function isSafeSupportedChain(chainId: number): boolean {
  return SAFE_SUPPORTED_CHAIN_IDS.includes(chainId)
}

export function safeExplorerUrl(chainId: number, safeAddress: string): string | null {
  const chain = CHAINS.find((c) => c.id === chainId)
  if (!chain?.blockExplorerUrls[0]) return null
  return `${chain.blockExplorerUrls[0].replace(/\/$/, '')}/address/${getAddress(safeAddress)}`
}
