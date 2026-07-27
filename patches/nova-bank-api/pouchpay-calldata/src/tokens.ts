/** Canonical Alltra / PouchPay token registry (chain 651940) — full production set. */

export const CHAIN_ID = 651940
export const NATIVE = '0x0000000000000000000000000000000000000000'
export const ROUTER = '0xEd04ee8307C0656207af5afe3926Ae2380052940'
export const WALL = '0x2da2b8f961f161ab6320acb3377e2e844a3c3ce4'
export const DEFAULT_RPC = 'https://mainnet-rpc.alltra.global'
/** Blockscout eth-rpc proxy on the Alltra explorer (works when official RPC 502s). */
export const EXPLORER_ETH_RPC = 'https://alltra.global/api/eth-rpc'
/** Secondary Alltra RPC from ECOSYSTEM / Nova chains catalog. */
export const FALLBACK_RPC = 'https://alltra-rpc.novablockchainsystem.com'

/** Deduped Alltra RPC list: env preferred, then catalog fallbacks. */
export function alltraRpcEndpoints(preferred?: string): string[] {
  const out: string[] = []
  const push = (raw: string | undefined) => {
    if (!raw) return
    const n = raw.replace(/\/$/, '')
    if (n && !out.includes(n)) out.push(n)
  }
  push(preferred)
  push(process.env.ALLTRA_RPC)
  push(DEFAULT_RPC)
  push(EXPLORER_ETH_RPC)
  push(FALLBACK_RPC)
  return out
}

/** Trim only fractional trailing zeros; never chop integer zeros (`110` stays `110`). */
export function trimHumanAmount(value: string): string {
  if (!value.includes('.')) return value
  return value.replace(/\.?0+$/, '')
}

export const WETH = '0x798f6762bb40d6801a593459d08f890603d3979c'
export const WBNB = '0xfE6E0aEd4Ca571BFbF3C3ae7Bf01fcA40B4716d3'
export const WTRX = '0xaA7d8C0B6119148DE1456EC0025f9A7b2Dd41A4F'

export type TokenInfo = {
  symbol: string
  address: string
  decimals: number
  name: string
  native?: boolean
  external?: boolean
  web3External?: boolean
  protected?: boolean
  aliasOf?: string
}

export const TOKENS: Record<string, TokenInfo> = {
  ALL: {
    symbol: 'ALL',
    address: NATIVE,
    decimals: 18,
    name: 'ALLTRA Native',
    native: true,
  },
  '$BUCKS': {
    symbol: '$BUCKS',
    address: '0x90a72d1cC06434938671e3e10c8774870bd40e41',
    decimals: 18,
    name: 'DOLLAR BUCKS',
  },
  '11::11': {
    symbol: '11::11',
    address: '0x535cA3048871dc5A6466A6b07559c0D08f773D95',
    decimals: 18,
    name: '11:11',
    protected: true,
  },
  ACX: {
    symbol: 'ACX',
    address: '0xe86714a357e20bb7af375f2bb18601f5caaedac9',
    decimals: 18,
    name: 'ACX',
  },
  AUDA: {
    symbol: 'AUDA',
    address: '0x690740f055a41fa7669f5a379bf71b0cdf353073',
    decimals: 18,
    name: 'MOOLA',
  },
  AUSDC: {
    symbol: 'AUSDC',
    address: '0xcf5423f2e06878bb23fe914519339be739e6c6b1',
    decimals: 18,
    name: 'Alltra USD Coin (USDC)',
  },
  AUSDT: {
    symbol: 'AUSDT',
    address: '0x015b1897ed5279930bc2be46f661894d219292a6',
    decimals: 18,
    name: 'Alltra USD Token (USDT)',
  },
  BRK: {
    symbol: 'BRK',
    address: '0x53C135B2581974D441C2CF200585dB5d2F450d72',
    decimals: 18,
    name: 'Break',
  },
  CHT: {
    symbol: 'CHT',
    address: '0xe59bb804f4884fcea183a4a67b1bb04f4a4567bc',
    decimals: 8,
    name: 'ChatCoin',
  },
  FIRE: {
    symbol: 'FIRE',
    address: '0x923fB4A1E4cB4450a2EAe0075c30Ce22aBA781c4',
    decimals: 18,
    name: 'Ignition',
  },
  FLKR: {
    symbol: 'FLKR',
    address: '0xbeAF04696Ab28466a2F8762d4E175aaBE32D58d5',
    decimals: 18,
    name: 'Fliker',
  },
  FSH: {
    symbol: 'FSH',
    address: '0xC77d4787eE65236Fa81d2bE77a4c205B3e1883d2',
    decimals: 18,
    name: 'Fresh',
  },
  GLD1111: {
    symbol: 'GLD1111',
    address: '0xD1FF8EaA1EA78A4d5213D6685a7fFe91D54AF621',
    decimals: 18,
    name: '11::11 1/1000 1 Oz Gold',
  },
  HYBX: {
    symbol: 'HYBX',
    address: '0x1839f77ebed7f388c7035f7061b4b8ef0e72317a',
    decimals: 8,
    name: 'HYBX',
  },
  HYDX: {
    symbol: 'HYDX',
    address: '0x0d9793861aeb9244ad1b34375a83a6730f6add38',
    decimals: 18,
    name: 'Hyper-Dex Exchange',
  },
  ICX: {
    symbol: 'ICX',
    address: '0x8AEF3c48Fa393f5a52cdb2dAea2F84e141ECA2F0',
    decimals: 18,
    name: 'ICX',
  },
  MONEEZ: {
    symbol: 'MONEEZ',
    address: '0x990F219011fc7C643465988665a98698bB7Cc142',
    decimals: 18,
    name: 'ReelMoneez',
  },
  'NSB-AUSDT': {
    symbol: 'NSB-AUSDT',
    address: '0x66d8efa0af63b0e84eb1dd72bf00f00cd1e2234e',
    decimals: 18,
    name: 'NSB AUSDT (SP Monza Reserve)',
  },
  PAYINQ: {
    symbol: 'PAYINQ',
    address: '0xbA5d382D85aD9C1b6109b838928Df9898BbC2BDa',
    decimals: 18,
    name: 'Payinq',
  },
  PSS: {
    symbol: 'PSS',
    address: '0xF7339552D4272e3A75E4A27Fe451013e94A64B55',
    decimals: 18,
    name: 'PASS',
  },
  SFY: {
    symbol: 'SFY',
    address: '0x2b6c609938303559f4d8a62986473a11fb21075E',
    decimals: 18,
    name: 'Staffy',
  },
  SHIVA: {
    symbol: 'SHIVA',
    address: '0x9E514a353Be010F45eec93d9AcEb01b28986b1D7',
    decimals: 18,
    name: 'SHIVA',
  },
  SKSH: {
    symbol: 'SKSH',
    address: '0xAFa5eC4D4A3fbe80714d0b5f5020c6F2eDA2A7E7',
    decimals: 18,
    name: 'Skosh',
  },
  SON: {
    symbol: 'SON',
    address: '0x4aaA6FeA3B49A1f9b4cdB3d0a33F4A0a471aF8f5',
    decimals: 18,
    name: 'Odin',
  },
  TN8: {
    symbol: 'TN8',
    address: '0x761D9b7D56B5D4B975231DE6Da2f324E600fa73C',
    decimals: 18,
    name: 'TorN8ion',
  },
  USDC: {
    symbol: 'USDC',
    address: '0xa95eed79f84e6a0151eaeb9d441f9ffd50e8e881',
    decimals: 18,
    name: 'AUSDC (alternate)',
  },
  'USDT-LEGACY': {
    symbol: 'USDT-LEGACY',
    address: '0xB5A55d36cF82Ec4Eea9813a82e81a631610459c8',
    decimals: 18,
    name: 'USD Token (Legacy)',
  },
  VCE: {
    symbol: 'VCE',
    address: '0x5FE130Bec080BdDCcc1f42B6C611E99b0FB2cBaf',
    decimals: 18,
    name: 'VOICE',
  },
  WALL: {
    symbol: 'WALL',
    address: WALL,
    decimals: 18,
    name: 'Wrapped Alltra',
  },
  WBTC: {
    symbol: 'WBTC',
    address: '0x66971b907dfcc6325124af427fc7f97656a68e9c',
    decimals: 8,
    name: 'Alltra Wrapped BTC Token',
  },
  WETH: {
    symbol: 'WETH',
    address: WETH,
    decimals: 18,
    name: 'Wrapped Ether',
  },
  ETH: {
    symbol: 'ETH',
    address: WETH,
    decimals: 18,
    name: 'Ether (via WETH)',
    aliasOf: 'WETH',
  },
  WBNB: {
    symbol: 'WBNB',
    address: WBNB,
    decimals: 18,
    name: 'Wrapped BNB (ALLTRA)',
    external: true,
    web3External: true,
  },
  BNB: {
    symbol: 'BNB',
    address: WBNB,
    decimals: 18,
    name: 'BNB (via WBNB)',
    aliasOf: 'WBNB',
    external: true,
    web3External: true,
  },
  WTRX: {
    symbol: 'WTRX',
    address: WTRX,
    decimals: 18,
    name: 'Wrapped TRX (ALLTRA)',
    external: true,
    web3External: true,
  },
  TRX: {
    symbol: 'TRX',
    address: WTRX,
    decimals: 18,
    name: 'TRX (via WTRX)',
    aliasOf: 'WTRX',
    external: true,
    web3External: true,
  },
  ZRG: {
    symbol: 'ZRG',
    address: '0x04382FAbed4e66Cb66711357E32e1E03078D9a70',
    decimals: 18,
    name: 'Zaragoza',
    external: true,
    web3External: true,
  },
  ZARA: {
    symbol: 'ZARA',
    address: '0xb91b4F8D9913cf90b55E34e192a89bad346E3Eb3',
    decimals: 18,
    name: 'Zaragoza USD Peg',
    external: true,
    web3External: true,
  },
  'USDT-TRC20': {
    symbol: 'USDT-TRC20',
    address: '0x1B71cA166C7B32561C483F35A73316B88cdC5027',
    decimals: 18,
    name: 'Tether USD (TRC20)',
    external: true,
    web3External: true,
  },
  'USDT-BNB': {
    symbol: 'USDT-BNB',
    address: '0xdaC78a6054C4255AD72B65a87eea2E0c865697Fa',
    decimals: 18,
    name: 'Tether USD (BNB / BEP20)',
    external: true,
    web3External: true,
  },
}

export function resolveToken(symbolOrAddress: unknown): TokenInfo | null {
  if (!symbolOrAddress) return null
  const raw = String(symbolOrAddress).trim()
  if (/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    const lower = raw.toLowerCase()
    if (lower === NATIVE) return TOKENS.ALL
    const preferred = Object.values(TOKENS).find(
      (t) => t.address.toLowerCase() === lower && !t.aliasOf,
    )
    if (preferred) return preferred
    const hit = Object.values(TOKENS).find((t) => t.address.toLowerCase() === lower)
    return hit || { symbol: raw.slice(0, 8), address: raw, decimals: 18, name: raw }
  }
  const sym = raw.toUpperCase()
  if (TOKENS[sym]) return TOKENS[sym]
  if (sym === '11:11' || sym === '11;11') return TOKENS['11::11']
  if (raw === '$BUCKS' || sym === '$BUCKS' || sym === 'BUCKS') return TOKENS['$BUCKS']
  return null
}

export function buildSwapPath(
  fromToken: TokenInfo,
  toToken: TokenInfo,
  { viaWall = false }: { viaWall?: boolean } = {},
) {
  const fromIsNative =
    Boolean(fromToken.native) || fromToken.address.toLowerCase() === NATIVE
  const toIsNative =
    Boolean(toToken.native) || toToken.address.toLowerCase() === NATIVE
  const fromAddr = fromIsNative ? WALL : fromToken.address
  const toAddr = toIsNative ? WALL : toToken.address
  if (fromAddr.toLowerCase() === toAddr.toLowerCase()) {
    throw new Error('Same token path')
  }
  const wall = WALL.toLowerCase()
  const touchesWall = fromAddr.toLowerCase() === wall || toAddr.toLowerCase() === wall
  const path = touchesWall || !viaWall ? [fromAddr, toAddr] : [fromAddr, WALL, toAddr]
  return { path, fromIsNative, toIsNative }
}

/** Candidate paths: direct first, then WALL hop when neither side is WALL. */
export function buildSwapPathCandidates(fromToken: TokenInfo, toToken: TokenInfo) {
  const direct = buildSwapPath(fromToken, toToken, { viaWall: false })
  const wall = WALL.toLowerCase()
  const needsHop =
    direct.path[0].toLowerCase() !== wall &&
    direct.path[direct.path.length - 1].toLowerCase() !== wall
  if (!needsHop) return [direct]
  return [direct, buildSwapPath(fromToken, toToken, { viaWall: true })]
}

export function parseAmountIn(amount: string | number, decimals: number): bigint {
  const s = String(amount).trim()
  if (!s || Number(s) <= 0) throw new Error('Invalid amount')
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
    external: Boolean(token.external),
    web3External: Boolean(token.web3External),
    aliasOf: token.aliasOf || null,
  }
}
