import { isAddress } from 'ethers'
import type { ChainToken } from '@/types'
import { getChain } from './chains'
import { canTransferToken, defaultTokenFlags, isMeshStable } from './tokenCapabilities'

/** External withdrawal destination networks (production) */
export interface WithdrawDestination {
  id: string
  label: string
  chainId: number
  kind: 'mesh' | 'custody' | 'public'
  /** Hint shown under the network picker */
  hint: string
}

export const WITHDRAW_DESTINATIONS: WithdrawDestination[] = [
  {
    id: 'dbis-138',
    label: 'DeFi Oracle (138)',
    chainId: 138,
    kind: 'custody',
    hint: 'Custody chain · CEX / external EVM address',
  },
  {
    id: 'nova-one',
    label: 'NovaONE',
    chainId: 22016,
    kind: 'mesh',
    hint: 'Trading mesh · external wallet or bridge deposit',
  },
  {
    id: 'nrw-world',
    label: 'NRW World',
    chainId: 33001,
    kind: 'mesh',
    hint: 'Settlement mesh · external wallet',
  },
  {
    id: 'ethereum',
    label: 'Ethereum',
    chainId: 1,
    kind: 'public',
    hint: 'Mainnet · CEX deposit or self-custody',
  },
  {
    id: 'bnb',
    label: 'BNB Smart Chain',
    chainId: 56,
    kind: 'public',
    hint: 'BSC · CEX deposit or self-custody',
  },
]

export function withdrawDestinationsForToken(symbol: string): WithdrawDestination[] {
  const upper = symbol.toUpperCase()
  // Stables + ETH can leave to public chains; mesh-only assets stay on mesh/custody
  if (isMeshStable(upper) || upper === 'ETH' || upper === 'BTC') {
    return WITHDRAW_DESTINATIONS
  }
  return WITHDRAW_DESTINATIONS.filter((d) => d.kind !== 'public')
}

export function isExternalWithdrawAddress(to: string): boolean {
  return isAddress(to.trim())
}

export function validateWithdrawAddress(to: string): string {
  const trimmed = to.trim()
  if (!trimmed) throw new Error('Enter destination address')
  if (!isAddress(trimmed)) throw new Error('Invalid EVM address')
  return trimmed
}

export function withdrawWarning(dest: WithdrawDestination, symbol: string): string | null {
  if (dest.kind === 'public') {
    return `External withdraw of ${symbol} on ${dest.label}. Confirm the deposit network matches on your exchange.`
  }
  if (dest.chainId === 138) {
    return `Custody withdraw on DeFi Oracle (138). Use the correct chain id 138 / 0x8a for CEX deposits.`
  }
  return null
}

/** Tokens eligible for external withdraw: transferable stables + native on production chains */
export function withdrawableTokens(
  chainId: number,
  tokens: ChainToken[],
): ChainToken[] {
  return tokens.filter((t) => {
    const flags = defaultTokenFlags(chainId, t)
    if (!flags.transferable || !flags.tradable) return false
    if (t.standard === 'native') return true
    if (isMeshStable(t.symbol)) return true
    // Other catalog assets only if contract known
    return !!t.address
  })
}

export function canWithdrawToken(
  chainId: number,
  token: ChainToken,
): { ok: true } | { ok: false; reason: string } {
  const flags = defaultTokenFlags(chainId, token)
  if (!flags.tradable) {
    return { ok: false, reason: `${token.symbol} is not tradable on this network` }
  }
  return canTransferToken(chainId, token)
}

export function destinationExplorerTx(chainId: number, hash: string): string | null {
  const chain = getChain(chainId)
  if (!chain?.blockExplorerUrls[0]) return null
  return `${chain.blockExplorerUrls[0].replace(/\/$/, '')}/tx/${hash}`
}
