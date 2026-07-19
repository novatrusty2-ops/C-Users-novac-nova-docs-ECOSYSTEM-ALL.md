export type AccountKind = 'eoa' | 'multisig'

export interface WalletAccount {
  id: string
  name: string
  address: string
  kind: AccountKind
  derivationIndex?: number
  /** Safe owners when kind === multisig */
  owners?: string[]
  threshold?: number
  safeAddress?: string
  chainId?: number
}

export interface NativeCurrency {
  name: string
  symbol: string
  decimals: number
}

export type ChainCategory = 'anaka' | 'partner' | 'public' | 'custom'
export type ChainTier = 'public' | 'partner' | 'private-banking' | 'internal' | 'custom'

export interface ChainToken {
  symbol: string
  name: string
  decimals: number
  address: string | null
  standard: 'native' | 'erc20'
  usd?: number
  coingeckoId?: string
  hidden?: boolean
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
  tier: ChainTier
  isDefault: boolean
  isInternal: boolean
  tokens: ChainToken[]
  zeroGas?: boolean
  bridge?: { address: string }
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
}

export type DisplayCurrency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CHF' | 'SGD'

export interface DisplaySettings {
  currency: DisplayCurrency
  hideBalances: boolean
  hideSmallBalances: boolean
  smallBalanceThresholdUsd: number
  spamFilter: boolean
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
  kind: 'send' | 'receive' | 'swap' | 'bridge' | 'multisig'
}

export interface BridgeRoute {
  id: string
  fromChainId: number
  toChainId: number
  kind: 'hub' | 'spoke' | 'vault'
  feeBps: number
}

export interface PendingSafeTx {
  safeTxHash: string
  safeAddress: string
  to: string
  value: string
  data: string
  confirmations: number
  threshold: number
  executed: boolean
}

export type AutolockMinutes = 1 | 5 | 15 | 30 | 60 | 0
