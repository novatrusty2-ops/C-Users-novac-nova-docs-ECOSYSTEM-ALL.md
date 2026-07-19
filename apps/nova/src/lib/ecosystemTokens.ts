import type { ChainToken } from '@/types'

/**
 * Curated NovaONE (22016) + NRW World (33001) token catalogs for import into Nova Wallet.
 * Native tokens use address:null; known ERC-20s use verified mesh contracts where available.
 */
export interface EcosystemTokenDef extends ChainToken {
  chainIds: number[]
  assetClass: 'native' | 'erc20' | 'crypto' | 'fiat'
  importable: boolean
}

const NOVAONE = 22016
const NRW = 33001

/** Known mesh ERC-20 contracts (from Signet / Anaka mesh registry) */
export const MESH_CONTRACTS = {
  AnA_22016: '0xc05F5B8A193bECA1744E42D4c3c516DBC49f7d8B',
  WAGAS_22016: '0x01396c382FeCb30548FFa3f9D9da2252C3C94748',
  /** Wrapped bridge on NovaONE (deployed bridge — used as ecosystem anchor) */
  WRAPPED_BRIDGE_22016: '0x227a6f3EEF2df576bc127dF0326D1F4B6f0ce9Cb',
} as const

export const ECOSYSTEM_TOKENS: EcosystemTokenDef[] = [
  // Natives
  {
    symbol: 'NOVA',
    name: 'NovaONE Native',
    decimals: 18,
    address: null,
    standard: 'native',
    usd: 1,
    chainIds: [NOVAONE],
    assetClass: 'native',
    importable: true,
  },
  {
    symbol: 'NRW',
    name: 'NRW World Native',
    decimals: 18,
    address: null,
    standard: 'native',
    usd: 1,
    chainIds: [NRW],
    assetClass: 'native',
    importable: true,
  },
  // Known ERC-20s on NovaONE
  {
    symbol: 'AnA',
    name: 'Anaka',
    decimals: 18,
    address: MESH_CONTRACTS.AnA_22016,
    standard: 'erc20',
    usd: 1,
    chainIds: [NOVAONE],
    assetClass: 'erc20',
    importable: true,
  },
  {
    symbol: 'WAGAS',
    name: 'Wrapped AGAS',
    decimals: 18,
    address: MESH_CONTRACTS.WAGAS_22016,
    standard: 'erc20',
    usd: 0.01,
    chainIds: [NOVAONE],
    assetClass: 'erc20',
    importable: true,
  },
  // Ecosystem crypto catalog (watchlist — same HD address across mesh)
  ...makeMeshCrypto('USDC', 'USD Coin', 6, 1),
  ...makeMeshCrypto('USDT', 'Tether USD', 6, 1),
  ...makeMeshCrypto('ETH', 'Ether', 18, undefined, 'ethereum'),
  ...makeMeshCrypto('BTC', 'Bitcoin', 8, undefined, 'bitcoin'),
  ...makeMeshCrypto('SHIVA', 'Shiva Coin', 6, 0.1),
  ...makeMeshCrypto('ACX', 'ACX', 6, 0.1),
  ...makeMeshCrypto('ICX', 'ICX', 6, 0.1),
  ...makeMeshCrypto('XRP', 'XRP', 6, 0.5),
  ...makeMeshCrypto('E1111', '11:11 Coin', 6, 0.05),
  ...makeMeshCrypto('AUSDT', 'Australian USDT', 6, 1),
  ...makeMeshCrypto('VICTORYA', 'Victoria Coin', 6, 0.05),
  ...makeMeshCrypto('KUSD', 'K USD', 6, 1),
  ...makeMeshCrypto('ANAKA', 'Anaka Coin', 6, 0.1),
  ...makeMeshCrypto('CUSDT', 'Custodial USDT', 6, 1),
  ...makeMeshCrypto('CUSDC', 'Custodial USDC', 6, 1),
]

function makeMeshCrypto(
  symbol: string,
  name: string,
  decimals: number,
  usd?: number,
  coingeckoId?: string,
): EcosystemTokenDef[] {
  // Catalog entries — shown with live/oracle price + mesh liquidity even at zero balance
  return [NOVAONE, NRW].map((chainId) => ({
    symbol,
    name,
    decimals,
    address: null as string | null,
    standard: 'erc20' as const,
    usd,
    coingeckoId,
    chainIds: [chainId],
    assetClass: 'crypto' as const,
    importable: true,
  }))
}

/** Ensure every importable token has a resolvable USD hint from oracle when missing */
export function withPricedHints(defs: EcosystemTokenDef[]): EcosystemTokenDef[] {
  return defs.map((d) => ({
    ...d,
    usd: d.usd ?? undefined,
    coingeckoId:
      d.coingeckoId ??
      ({
        ETH: 'ethereum',
        BTC: 'bitcoin',
        XRP: 'ripple',
        USDC: 'usd-coin',
        USDT: 'tether',
      } as Record<string, string>)[d.symbol.toUpperCase()],
  }))
}

export function tokensForChain(chainId: number): EcosystemTokenDef[] {
  return ECOSYSTEM_TOKENS.filter((t) => t.chainIds.includes(chainId) && t.importable)
}

export function tokensForNovaOneAndNrw(): EcosystemTokenDef[] {
  return ECOSYSTEM_TOKENS.filter(
    (t) => t.importable && (t.chainIds.includes(NOVAONE) || t.chainIds.includes(NRW)),
  )
}

export function toChainToken(def: EcosystemTokenDef): ChainToken {
  return {
    symbol: def.symbol,
    name: def.name,
    decimals: def.decimals,
    address: def.address,
    standard: def.address ? 'erc20' : def.standard === 'native' ? 'native' : 'erc20',
    usd: def.usd,
    coingeckoId: def.coingeckoId,
  }
}
