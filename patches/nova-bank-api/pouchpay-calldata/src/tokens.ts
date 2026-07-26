/** Canonical Alltra / PouchPay token registry (chain 651940). */

export const CHAIN_ID = 651940
export const NATIVE = '0x0000000000000000000000000000000000000000'
export const ROUTER = '0xEd04ee8307C0656207af5afe3926Ae2380052940'
export const WALL = '0x2da2b8f961f161ab6320acb3377e2e844a3c3ce4'
export const DEFAULT_RPC = 'https://mainnet-rpc.alltra.global'

export type TokenInfo = {
  symbol: string
  address: string
  decimals: number
  name: string
  native?: boolean
}

export const TOKENS: Record<string, TokenInfo> = {
  ALL: {
    symbol: 'ALL',
    address: NATIVE,
    decimals: 18,
    name: 'ALLTRA Native',
    native: true,
  },
  WALL: {
    symbol: 'WALL',
    address: WALL,
    decimals: 18,
    name: 'Wrapped Alltra',
  },
  AUSDT: {
    symbol: 'AUSDT',
    address: '0x015b1897ed5279930bc2be46f661894d219292a6',
    decimals: 18,
    name: 'Alltra USD Token (USDT)',
  },
  AUSDC: {
    symbol: 'AUSDC',
    address: '0xcf5423f2e06878bb23fe914519339be739e6c6b1',
    decimals: 18,
    name: 'Alltra USD Coin (USDC)',
  },
  USDC: {
    symbol: 'USDC',
    address: '0xa95eed79f84e6a0151eaeb9d441f9ffd50e8e881',
    decimals: 18,
    name: 'AUSDC (alternate)',
  },
  WETH: {
    symbol: 'WETH',
    address: '0x798f6762bb40d6801a593459d08f890603d3979c',
    decimals: 18,
    name: 'Wrapped Ether',
  },
  HYDX: {
    symbol: 'HYDX',
    address: '0x0d9793861aeb9244ad1b34375a83a6730f6add38',
    decimals: 18,
    name: 'Hyper-Dex Exchange',
  },
}

export function resolveToken(symbolOrAddress: unknown): TokenInfo | null {
  if (!symbolOrAddress) return null
  const raw = String(symbolOrAddress).trim()
  if (/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    const lower = raw.toLowerCase()
    if (lower === NATIVE) return TOKENS.ALL
    const hit = Object.values(TOKENS).find((t) => t.address.toLowerCase() === lower)
    return hit || { symbol: raw.slice(0, 8), address: raw, decimals: 18, name: raw }
  }
  return TOKENS[raw.toUpperCase()] || null
}

export function buildSwapPath(fromToken: TokenInfo, toToken: TokenInfo) {
  const fromIsNative =
    Boolean(fromToken.native) || fromToken.address.toLowerCase() === NATIVE
  const toIsNative =
    Boolean(toToken.native) || toToken.address.toLowerCase() === NATIVE
  const fromAddr = fromIsNative ? WALL : fromToken.address
  const toAddr = toIsNative ? WALL : toToken.address
  if (fromAddr.toLowerCase() === toAddr.toLowerCase()) {
    throw new Error('Same token path')
  }
  return { path: [fromAddr, toAddr], fromIsNative, toIsNative }
}

export function parseAmountIn(amount: string | number, decimals: number): bigint {
  const s = String(amount).trim()
  if (!s || Number(s) <= 0) throw new Error('Invalid amount')
  // Match apps/pouchpay-bridge: bare integers look like wei when large enough.
  if (/^\d+$/.test(s) && BigInt(s) >= 10n ** BigInt(Math.max(decimals - 2, 0))) {
    if (BigInt(s) >= 10n ** 15n) return BigInt(s)
  }
  const [whole, frac = ''] = s.split('.')
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  return BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(fracPadded || '0')
}

export function formatUnits(value: bigint, decimals: number): string {
  const base = 10n ** BigInt(decimals)
  const whole = value / base
  const frac = (value % base).toString().padStart(decimals, '0').replace(/0+$/, '')
  return frac ? `${whole}.${frac}` : `${whole}`
}

export function tokenMeta(token: TokenInfo) {
  return {
    address: token.address,
    chainId: CHAIN_ID,
    symbol: token.symbol,
    decimals: token.decimals,
    name: token.name,
    coinKey: token.symbol,
    logoURI: 'https://alltra.global/favicon.ico',
    priceUSD: '0',
  }
}
