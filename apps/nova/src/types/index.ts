export interface WalletAccount {
  id: string
  name: string
  address: string
  derivationIndex?: number
}

export interface NativeCurrency {
  name: string
  symbol: string
  decimals: number
}

export type ChainCategory = 'nova' | 'partner' | 'public' | 'custom'

export interface ChainToken {
  symbol: string
  name: string
  decimals: number
  address: string | null
  standard: 'native' | 'erc20'
  usd?: number
  coingeckoId?: string
  /** Production ECOSYSTEM / mesh flags */
  tradable?: boolean
  transferable?: boolean
  swappable?: boolean
}

export interface ChainDefinition {
  id: number
  name: string
  slug: string
  nativeCurrency: NativeCurrency
  rpcUrls: string[]
  blockExplorerUrls: string[]
  iconColor: string
  category: ChainCategory
  isDefault: boolean
  isOptional: boolean
  tokens: ChainToken[]
  zeroGas?: boolean
  ecosystemRole?: 'trading' | 'settlement' | 'custody' | 'bridge' | 'external'
  partner?: 'pouchpay'
}

export interface TokenBalanceRow {
  chainId: number
  chainName: string
  symbol: string
  name: string
  decimals: number
  address: string | null
  balance: string
  balanceRaw: bigint
  usdPrice: number | null
  usdValue: number | null
  iconColor: string
  /** Mesh / pool liquidity depth in USD */
  liquidityUsd?: number | null
  /** 24h volume estimate in USD */
  volume24hUsd?: number | null
  /** Trading pair label e.g. NOVA/USDC */
  pair?: string | null
  priceSource?: 'peg' | 'coingecko' | 'oracle' | 'mesh' | null
}

export type DisplayCurrency = 'USD' | 'EUR' | 'GBP'

export interface DisplaySettings {
  currency: DisplayCurrency
  hideBalances: boolean
}

export interface ActivityItem {
  id: string
  chainId: number
  hash: string
  from: string
  to: string
  value: string
  symbol: string
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  kind: 'send' | 'receive' | 'swap' | 'withdraw'
}

export type AutolockMinutes = 1 | 5 | 15 | 30 | 0
