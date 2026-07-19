import type { ChainDefinition, ChainToken } from '@/types'
import { BRAND } from './brand'
import { tokensForChain, toChainToken } from './ecosystemTokens'
import { userTokensForChain } from './usertokens'

const C = BRAND.chainColors

function meshTokens(chainId: number, base: ChainToken[]): ChainToken[] {
  const fromCatalog = tokensForChain(chainId)
    .filter((t) => t.standard === 'native' || t.address)
    .map(toChainToken)
  const map = new Map<string, ChainToken>()
  for (const t of [...base, ...fromCatalog]) {
    map.set(`${t.symbol}:${t.address ?? 'native'}`, t)
  }
  return [...map.values()]
}

/** Full Nova ecosystem EVM chains — synced with wallet/networks API + ECOSYSTEM.json */
export const CHAINS: ChainDefinition[] = [
  {
    id: 22016,
    name: 'NovaONE',
    slug: 'novaone',
    nativeCurrency: { name: 'Nova Token', symbol: 'NOVA', decimals: 18 },
    rpcUrls: [
      'https://anakatech.llc/novaone-rpc/',
      'https://novaone-rpc.anakatech.llc',
      'https://rpc.novablockchainsystem.com',
    ],
    blockExplorerUrls: ['https://novaone.anakatech.llc', 'https://novaone.novablockchainsystem.com'],
    iconColor: C.novaone,
    category: 'nova',
    isDefault: true,
    isOptional: false,
    zeroGas: true,
    ecosystemRole: 'trading',
    tokens: meshTokens(22016, [
      { symbol: 'NOVA', name: 'Nova Token', decimals: 18, address: null, standard: 'native', usd: 1 },
    ]),
  },
  {
    id: 33001,
    name: 'NRW World',
    slug: 'nrw',
    nativeCurrency: { name: 'NRW', symbol: 'NRW', decimals: 18 },
    rpcUrls: [
      'https://nrw-world-chain-production-6029.up.railway.app',
      'https://novablockchainsystem.com/nrw-rpc/',
    ],
    blockExplorerUrls: ['https://nrw.anakatech.llc', 'https://novablockchainsystem.com'],
    iconColor: C.nrw,
    category: 'nova',
    isDefault: true,
    isOptional: false,
    ecosystemRole: 'settlement',
    tokens: meshTokens(33001, [
      { symbol: 'NRW', name: 'NRW', decimals: 18, address: null, standard: 'native', usd: 1 },
    ]),
  },
  {
    id: 9001,
    name: 'Nova Production',
    slug: 'nova-production',
    nativeCurrency: { name: 'Nova Token', symbol: 'NOVA', decimals: 18 },
    rpcUrls: ['https://novablockchainsystem.com/rpc', 'http://51.75.64.28:28545/rpc'],
    blockExplorerUrls: ['http://51.75.64.28:28545/explorer/'],
    iconColor: C.novaProduction ?? '#38BDF8',
    category: 'nova',
    isDefault: true,
    isOptional: false,
    ecosystemRole: 'custody',
    tokens: [
      { symbol: 'NOVA', name: 'Nova Token', decimals: 18, address: null, standard: 'native', usd: 1 },
    ],
  },
  {
    id: 138,
    name: 'DeFi Oracle',
    slug: 'defi-oracle',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.defi-oracle.io', 'https://rpc.public-0138.defi-oracle.io'],
    blockExplorerUrls: ['https://explorer.defi-oracle.io'],
    iconColor: C.defiOracle ?? '#2DD4BF',
    category: 'nova',
    isDefault: true,
    isOptional: false,
    ecosystemRole: 'custody',
    tokens: [
      { symbol: 'ETH', name: 'Ether', decimals: 18, address: null, standard: 'native', coingeckoId: 'ethereum' },
    ],
  },
  {
    id: 11013,
    name: 'AnakaChain Bridge',
    slug: 'anaka-bridge',
    nativeCurrency: { name: 'ANKA', symbol: 'ANKA', decimals: 18 },
    rpcUrls: ['https://bridge.anakachain.com'],
    blockExplorerUrls: ['https://anakachain.com'],
    iconColor: C.anaka ?? '#F59E0B',
    category: 'nova',
    isDefault: true,
    isOptional: false,
    ecosystemRole: 'bridge',
    tokens: [
      { symbol: 'ANKA', name: 'AnakaChain', decimals: 18, address: null, standard: 'native' },
    ],
  },
  {
    id: 651940,
    name: 'Alltra Global World',
    slug: 'alltra',
    nativeCurrency: { name: 'ALL', symbol: 'ALL', decimals: 18 },
    rpcUrls: [
      'https://alltra-rpc.novablockchainsystem.com/',
      'https://mainnet-rpc.alltra.global',
    ],
    blockExplorerUrls: ['https://alltra.global/'],
    iconColor: C.alltra ?? '#E8D48B',
    category: 'partner',
    isDefault: true,
    isOptional: false,
    ecosystemRole: 'trading',
    partner: 'pouchpay',
    tokens: [
      { symbol: 'ALL', name: 'ALLTRA', decimals: 18, address: null, standard: 'native' },
    ],
  },
  {
    id: 1,
    name: 'Ethereum',
    slug: 'ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://ethereum-rpc.publicnode.com', 'https://eth.llamarpc.com'],
    blockExplorerUrls: ['https://etherscan.io'],
    iconColor: '#627EEA',
    category: 'public',
    isDefault: false,
    isOptional: true,
    ecosystemRole: 'external',
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
    name: 'BNB Smart Chain',
    slug: 'bnb',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
    iconColor: '#F0B90B',
    category: 'public',
    isDefault: false,
    isOptional: true,
    ecosystemRole: 'external',
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
  return CHAINS.filter((c) => c.category === 'nova' || c.slug === 'nrw' || c.slug === 'alltra')
}

export function ecosystemEvmChains(): ChainDefinition[] {
  return CHAINS.filter((c) => typeof c.id === 'number')
}

/** Chain token list merged with user-imported catalog tokens */
export function tokensOnChain(chainId: number): ChainToken[] {
  const chain = getChain(chainId)
  const base = chain?.tokens ?? []
  const user = userTokensForChain(chainId)
  const map = new Map<string, ChainToken>()
  for (const t of [...base, ...user]) {
    map.set(`${t.symbol.toUpperCase()}:${(t.address ?? 'native').toLowerCase()}`, t)
  }
  return [...map.values()]
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
