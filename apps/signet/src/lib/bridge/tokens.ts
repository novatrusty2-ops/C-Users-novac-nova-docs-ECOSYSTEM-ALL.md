import { NOVAONE_CHAIN_ID, NRW_CHAIN_ID } from './constants'

export interface BridgeToken {
  symbol: string
  name: string
  decimals: number
  /** per-chain contract address; null = native */
  addresses: Record<number, string | null>
}

export const BRIDGE_TOKENS: BridgeToken[] = [
  {
    symbol: 'NOVA',
    name: 'Nova Token',
    decimals: 18,
    addresses: { [NOVAONE_CHAIN_ID]: null, [NRW_CHAIN_ID]: '0xNOVA_WRAPPED_PLACEHOLDER' },
  },
  {
    symbol: 'NRW',
    name: 'NRW',
    decimals: 18,
    addresses: { [NRW_CHAIN_ID]: null, [NOVAONE_CHAIN_ID]: '0xNRW_WRAPPED_PLACEHOLDER' },
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    addresses: {
      1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      [NOVAONE_CHAIN_ID]: '0xUSDC_NOVA_PLACEHOLDER',
      [NRW_CHAIN_ID]: '0xUSDC_NRW_PLACEHOLDER',
    },
  },
  {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    addresses: { 1: null, [NOVAONE_CHAIN_ID]: '0xWETH_NOVA_PLACEHOLDER' },
  },
]

export function bridgeToken(symbol: string): BridgeToken | undefined {
  return BRIDGE_TOKENS.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase())
}

export function bridgeTokenOnChain(symbol: string, chainId: number): string | null | undefined {
  return bridgeToken(symbol)?.addresses[chainId]
}
