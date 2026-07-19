/** EIP-1193 provider (MetaMask, Trust, SafePal, Gate, etc.) */
export interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
  isMetaMask?: boolean
  isTrust?: boolean
  isTrustWallet?: boolean
  isSafePal?: boolean
  isGateWallet?: boolean
  isCoinbaseWallet?: boolean
  isRabby?: boolean
  isBraveWallet?: boolean
  providers?: Eip1193Provider[]
}

export interface Eip6963ProviderInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
}

export interface Eip6963ProviderDetail {
  info: Eip6963ProviderInfo
  provider: Eip1193Provider
}

export type KnownWalletId =
  | 'metamask'
  | 'trust'
  | 'safepal'
  | 'gate'
  | 'coinbase'
  | 'rabby'
  | 'brave'
  | 'okx'
  | 'bitget'
  | 'injected'
  | 'walletconnect'

export interface WalletOption {
  id: KnownWalletId
  name: string
  subtitle: string
  /** Brand accent for icon chip */
  accent: string
  /** EIP-6963 rdns matchers */
  rdns?: string[]
  /** Legacy flag detectors on provider */
  flags?: (p: Eip1193Provider) => boolean
  /** Install / open URL when not detected */
  installUrl?: string
  /** Deep link template for mobile (optional) */
  deepLink?: (dappUrl: string) => string
}
