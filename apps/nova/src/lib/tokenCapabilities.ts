import type { ChainToken } from '@/types'
import { isStablecoin } from './prices'

/** Mesh chain ids with production tradable / transferable custody coverage */
export const MESH_TRADE_CHAIN_IDS = new Set([22016, 33001, 138, 9001, 11013, 651940])

/** Chains where stables stay swappable / transferable (mesh + public withdraw rails) */
export const STABLE_TRADE_CHAIN_IDS = new Set([
  ...MESH_TRADE_CHAIN_IDS,
  1, // Ethereum
  56, // BNB Smart Chain
])

/** Stable symbols expected tradable + transferable on mesh / DBIS 138 */
export const MESH_STABLE_SYMBOLS = new Set([
  'USDC',
  'USDT',
  'DAI',
  'BUSD',
  'AUSDT',
  'CUSDT',
  'CUSDC',
  'KUSD',
  'TUSD',
  'FRAX',
])

export function isMeshStable(symbol: string): boolean {
  return MESH_STABLE_SYMBOLS.has(symbol.trim().toUpperCase()) || isStablecoin(symbol)
}

export function defaultTokenFlags(
  chainId: number,
  token: Pick<ChainToken, 'symbol' | 'standard' | 'address' | 'tradable' | 'transferable' | 'swappable'>,
): Required<Pick<ChainToken, 'tradable' | 'transferable' | 'swappable'>> {
  if (token.tradable != null && token.transferable != null && token.swappable != null) {
    return {
      tradable: token.tradable,
      transferable: token.transferable,
      swappable: token.swappable,
    }
  }

  const onMesh = MESH_TRADE_CHAIN_IDS.has(chainId)
  const stableRail = STABLE_TRADE_CHAIN_IDS.has(chainId)
  const stable = isMeshStable(token.symbol)
  const isNative = token.standard === 'native'

  return {
    // Stables always tradable/swappable on mesh + ETH/BSC rails
    tradable: token.tradable ?? (onMesh || (stable && stableRail)),
    transferable:
      token.transferable ??
      ((onMesh || (stable && stableRail)) && (isNative || !!token.address || stable)),
    swappable: token.swappable ?? (onMesh || (stable && stableRail) || isNative),
  }
}

/** ERC-20 send requires a contract; natives always ok when transferable */
export function canTransferToken(
  chainId: number,
  token: ChainToken,
): { ok: true } | { ok: false; reason: string } {
  const flags = defaultTokenFlags(chainId, token)
  if (!flags.transferable) {
    return { ok: false, reason: `${token.symbol} is not transferable on this network` }
  }
  if (token.standard === 'erc20' && !token.address) {
    return {
      ok: false,
      reason: `${token.symbol} has no contract on this chain yet — connect & refresh to discover via explorer`,
    }
  }
  return { ok: true }
}

export function canTradeToken(chainId: number, token: ChainToken): boolean {
  return defaultTokenFlags(chainId, token).tradable
}

export function canSwapToken(chainId: number, token: ChainToken): boolean {
  return defaultTokenFlags(chainId, token).swappable
}
