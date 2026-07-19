import type { ChainToken } from '@/types'
import { NOVA_PLUS_SNAPSHOT, type NovaPlusTokenSnap } from './novaPlusSnapshot'
import { NOVA_PLUS_CHAIN_IDS } from './novaPlus'

/**
 * Nova Plus token catalogs — NovaONE (22016) + NRW (33001) + Nova Production (9001).
 * Production snapshot from Nova Bank ecosystem API + verified mesh ERC-20 contracts.
 */
export interface EcosystemTokenDef extends ChainToken {
  chainIds: number[]
  assetClass: 'native' | 'erc20' | 'crypto' | 'fiat'
  importable: boolean
  tradable?: boolean
  swappable?: boolean
  transferable?: boolean
  decentralized?: boolean
}

const NOVAONE = 22016
const NRW = 33001
const NOVA_PROD = 9001

/** Known mesh ERC-20 contracts (from Anaka mesh registry) */
export const MESH_CONTRACTS = {
  AnA_22016: '0xc05F5B8A193bECA1744E42D4c3c516DBC49f7d8B',
  WAGAS_22016: '0x01396c382FeCb30548FFa3f9D9da2252C3C94748',
  WRAPPED_BRIDGE_22016: '0x227a6f3EEF2df576bc127dF0326D1F4B6f0ce9Cb',
} as const

function snapToDefs(snap: NovaPlusTokenSnap): EcosystemTokenDef[] {
  const assetClass =
    snap.assetClass === 'native' ||
    snap.assetClass === 'erc20' ||
    snap.assetClass === 'crypto' ||
    snap.assetClass === 'fiat'
      ? snap.assetClass
      : 'crypto'

  return snap.chainIds
    .filter((id) => (NOVA_PLUS_CHAIN_IDS as readonly number[]).includes(id))
    .map((chainId) => {
      const isNative =
        (snap.symbol === 'NOVA' && (chainId === NOVAONE || chainId === NOVA_PROD)) ||
        (snap.symbol === 'NRW' && chainId === NRW)

      return {
        symbol: snap.symbol,
        name: snap.name,
        decimals: snap.decimals,
        address: null as string | null,
        standard: (isNative ? 'native' : 'erc20') as 'native' | 'erc20',
        usd: snap.usd,
        coingeckoId: snap.coingeckoId ?? undefined,
        chainIds: [chainId],
        assetClass,
        importable: true,
        tradable: snap.tradable,
        swappable: snap.swappable,
        transferable: snap.transferable,
        decentralized: snap.decentralized,
      }
    })
}

const CONTRACT_TOKENS: EcosystemTokenDef[] = [
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
    tradable: true,
    swappable: true,
    transferable: true,
    decentralized: true,
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
    tradable: true,
    swappable: true,
    transferable: true,
    decentralized: true,
  },
]

function buildCatalog(): EcosystemTokenDef[] {
  const fromSnap = NOVA_PLUS_SNAPSHOT.flatMap(snapToDefs)
  const map = new Map<string, EcosystemTokenDef>()
  for (const t of fromSnap) {
    map.set(`${t.chainIds[0]}:${t.symbol.toUpperCase()}:${t.address ?? 'native'}`, t)
  }
  // Prefer verified contracts over address-less watchlist twins
  for (const t of CONTRACT_TOKENS) {
    const watchKey = `${t.chainIds[0]}:${t.symbol.toUpperCase()}:native`
    const ercKey = `${t.chainIds[0]}:${t.symbol.toUpperCase()}:null`
    map.delete(watchKey)
    map.delete(ercKey)
    map.delete(`${t.chainIds[0]}:${t.symbol.toUpperCase()}:`)
    // remove address-null same symbol on same chain
    for (const k of [...map.keys()]) {
      if (k.startsWith(`${t.chainIds[0]}:${t.symbol.toUpperCase()}:`) && !k.endsWith(t.address!)) {
        const existing = map.get(k)
        if (existing && !existing.address) map.delete(k)
      }
    }
    map.set(`${t.chainIds[0]}:${t.symbol.toUpperCase()}:${t.address}`, t)
  }
  return [...map.values()]
}

export const ECOSYSTEM_TOKENS: EcosystemTokenDef[] = buildCatalog()

/** Ensure every importable token has a resolvable USD hint from oracle when missing */
export function withPricedHints(defs: EcosystemTokenDef[]): EcosystemTokenDef[] {
  return defs.map((d) => ({
    ...d,
    usd: d.usd ?? undefined,
    coingeckoId:
      d.coingeckoId ??
      ({
        ETH: 'ethereum',
        WETH: 'weth',
        BTC: 'bitcoin',
        WBTC: 'wrapped-bitcoin',
        BNB: 'binancecoin',
        SOL: 'solana',
        TRX: 'tron',
        XRP: 'ripple',
        USDC: 'usd-coin',
        USDT: 'tether',
        MATIC: 'matic-network',
      } as Record<string, string>)[d.symbol.toUpperCase()],
  }))
}

export function tokensForChain(chainId: number): EcosystemTokenDef[] {
  return ECOSYSTEM_TOKENS.filter((t) => t.chainIds.includes(chainId) && t.importable)
}

export function tokensForNovaPlus(): EcosystemTokenDef[] {
  return ECOSYSTEM_TOKENS.filter(
    (t) =>
      t.importable &&
      t.chainIds.some((id) => (NOVA_PLUS_CHAIN_IDS as readonly number[]).includes(id)),
  )
}

/** @deprecated use tokensForNovaPlus */
export function tokensForNovaOneAndNrw(): EcosystemTokenDef[] {
  return tokensForNovaPlus()
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

export function findEcosystemToken(
  chainId: number,
  symbol: string,
): EcosystemTokenDef | undefined {
  const upper = symbol.toUpperCase()
  return ECOSYSTEM_TOKENS.find(
    (t) => t.chainIds.includes(chainId) && t.symbol.toUpperCase() === upper,
  )
}
