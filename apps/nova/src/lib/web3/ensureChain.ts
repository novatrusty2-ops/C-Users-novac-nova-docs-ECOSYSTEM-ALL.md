import type { ChainDefinition } from '@/types'
import { getChain } from '@/lib/chains'
import type { Eip1193Provider } from './types'

export interface WalletAddEthereumChainParam {
  chainId: string
  chainName: string
  nativeCurrency: { name: string; symbol: string; decimals: number }
  rpcUrls: string[]
  blockExplorerUrls?: string[]
}

/** EIP-155 hex chain id, e.g. 138 → 0x8a */
export function toHexChainId(chainId: number): string {
  return `0x${chainId.toString(16)}`
}

export function toWalletAddEthereumChainParam(chain: ChainDefinition): WalletAddEthereumChainParam {
  return {
    chainId: toHexChainId(chain.id),
    chainName: chain.name,
    nativeCurrency: {
      name: chain.nativeCurrency.name,
      symbol: chain.nativeCurrency.symbol,
      decimals: chain.nativeCurrency.decimals,
    },
    rpcUrls: [...chain.rpcUrls],
    blockExplorerUrls: chain.blockExplorerUrls.length
      ? chain.blockExplorerUrls.map((u) => u.replace(/\/$/, ''))
      : undefined,
  }
}

function isUserRejected(err: unknown): boolean {
  const code = (err as { code?: number })?.code
  return code === 4001 || code === 4100
}

function isUnrecognizedChain(err: unknown): boolean {
  const code = (err as { code?: number })?.code
  const msg = String((err as { message?: string })?.message ?? err ?? '').toLowerCase()
  return code === 4902 || msg.includes('unrecognized chain') || msg.includes('unknown chain')
}

/**
 * Switch the injected wallet to `chainId`, adding the chain when missing (EIP-3085 / 3326).
 * Required for production MetaMask/Trust/SafePal/Gate flows on NovaONE, NRW, and DBIS 138.
 */
export async function ensureWalletChain(
  provider: Eip1193Provider,
  chainId: number,
): Promise<number> {
  const chain = getChain(chainId)
  if (!chain) throw new Error(`Unknown chain ${chainId}`)

  const hex = toHexChainId(chainId)
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hex }],
    })
    return chainId
  } catch (err) {
    if (isUserRejected(err)) throw new Error('Network switch rejected in wallet')
    if (!isUnrecognizedChain(err)) {
      // Some wallets throw generic errors when chain is missing — try add next
      const msg = String((err as { message?: string })?.message ?? '')
      if (!msg.toLowerCase().includes('chain') && (err as { code?: number })?.code !== -32603) {
        // still attempt add for production mesh chains
      }
    }
  }

  const param = toWalletAddEthereumChainParam(chain)
  try {
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [param],
    })
  } catch (err) {
    if (isUserRejected(err)) throw new Error('Add network rejected in wallet')
    throw new Error(
      err instanceof Error
        ? err.message
        : `Could not add ${chain.name} (chain ${chainId}) to wallet`,
    )
  }

  // Some wallets add but do not auto-switch
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hex }],
    })
  } catch {
    /* already on chain or wallet will prompt */
  }
  return chainId
}

/** Production mesh chains that wallets should be able to add/switch */
export const WEB3_SWITCHABLE_CHAIN_IDS = [22016, 33001, 9001, 138, 11013, 651940, 1, 56] as const
