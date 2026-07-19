import type { ChainDefinition } from '@/types'
import { BRAND } from './brand'

/** Nova Wallet chain registry — NovaONE + NRW primary; ETH/BSC optional toggles only */
export const CHAINS: ChainDefinition[] = [
  {
    id: 22016,
    name: 'NovaONE',
    slug: 'novaone',
    nativeCurrency: { name: 'Nova Token', symbol: 'NOVA', decimals: 18 },
    rpcUrls: [
      'https://anakatech.llc/novaone-rpc/',
      'https://novaone-rpc.anakatech.llc',
    ],
    blockExplorerUrls: ['https://novaone.anakatech.llc'],
    iconColor: BRAND.chainColors.novaone,
    category: 'nova',
    isDefault: true,
    isOptional: false,
    zeroGas: true,
    tokens: [
      { symbol: 'NOVA', name: 'Nova Token', decimals: 18, address: null, standard: 'native', usd: 1 },
      {
        symbol: 'AnA',
        name: 'Anaka',
        decimals: 18,
        address: '0xc05F5B8A193bECA1744E42D4c3c516DBC49f7d8B',
        standard: 'erc20',
        usd: 1,
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0x0000000000000000000000000000000000000001',
        standard: 'erc20',
        usd: 1,
      },
    ],
  },
  {
    id: 33001,
    name: 'NRW World',
    slug: 'nrw',
    nativeCurrency: { name: 'NRW', symbol: 'NRW', decimals: 18 },
    rpcUrls: ['https://nrw-world-chain-production-6029.up.railway.app'],
    blockExplorerUrls: ['https://nrw.anakatech.llc'],
    iconColor: BRAND.chainColors.nrw,
    category: 'nova',
    isDefault: true,
    isOptional: false,
    tokens: [
      { symbol: 'NRW', name: 'NRW', decimals: 18, address: null, standard: 'native', usd: 1 },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        address: '0x0000000000000000000000000000000000000002',
        standard: 'erc20',
        usd: 1,
      },
    ],
  },
  {
    id: 1,
    name: 'Ethereum',
    slug: 'ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://ethereum-rpc.publicnode.com', 'https://cloudflare-eth.com'],
    blockExplorerUrls: ['https://etherscan.io'],
    iconColor: '#627EEA',
    category: 'public',
    isDefault: false,
    isOptional: true,
    tokens: [
      { symbol: 'ETH', name: 'Ether', decimals: 18, address: null, standard: 'native', coingeckoId: 'ethereum' },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        standard: 'erc20',
        usd: 1,
        coingeckoId: 'usd-coin',
      },
    ],
  },
  {
    id: 56,
    name: 'BNB Chain',
    slug: 'bnb',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.bnbchain.org'],
    blockExplorerUrls: ['https://bscscan.com'],
    iconColor: '#F0B90B',
    category: 'public',
    isDefault: false,
    isOptional: true,
    tokens: [
      { symbol: 'BNB', name: 'BNB', decimals: 18, address: null, standard: 'native', coingeckoId: 'binancecoin' },
    ],
  },
]

export function getChain(id: number): ChainDefinition | undefined {
  return CHAINS.find((c) => c.id === id)
}

export function getChainBySlug(slug: string): ChainDefinition | undefined {
  return CHAINS.find((c) => c.slug === slug)
}

export function defaultChainIds(): number[] {
  return CHAINS.filter((c) => c.isDefault).map((c) => c.id)
}

export function optionalChainIds(): number[] {
  return CHAINS.filter((c) => c.isOptional).map((c) => c.id)
}

export function primaryChains(): ChainDefinition[] {
  return CHAINS.filter((c) => c.isDefault)
}

export function explorerTxUrl(chainId: number, hash: string): string | null {
  const chain = getChain(chainId)
  if (!chain?.blockExplorerUrls[0]) return null
  return `${chain.blockExplorerUrls[0].replace(/\/$/, '')}/tx/${hash}`
}

export function chainBadgeStyle(chainId: number): { background: string; color: string } {
  const chain = getChain(chainId)
  const bg = chain?.iconColor ?? BRAND.colors.accent
  return { background: bg, color: '#071422' }
}
