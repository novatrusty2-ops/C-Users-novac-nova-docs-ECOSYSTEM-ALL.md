/**
 * Transfer the full Nova Plus production catalog into Nova Wallet
 * with oracle/CoinGecko prices and mesh liquidity books.
 */
import { fetchNovaPlusCatalog } from './novaBankSync'
import { NOVA_PLUS_CHAIN_IDS } from './novaPlus'
import type { NovaPlusTokenSnap } from './novaPlusSnapshot'
import { MESH_CONTRACTS } from './ecosystemTokens'
import { bridgeCurrencyTokenDefs, BRIDGE_CURRENCY_CHAIN_IDS } from './bridgeCurrencies'
import { oracleUsdPrice } from './oracle'
import { quoteLiquidity } from './liquidity'
import { mergeUserTokens, type UserTokenRecord } from './usertokens'
import { getEnabledChainIds, setEnabledChainIds } from './networks'
import type { ChainToken } from '@/types'

const CATALOG_META_KEY = 'nova.usertokens.catalog.v1'

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

function snapToRecords(snap: NovaPlusTokenSnap, source: UserTokenRecord['source']): UserTokenRecord[] {
  const now = Date.now()
  return snap.chainIds
    .filter((id) => (NOVA_PLUS_CHAIN_IDS as readonly number[]).includes(id))
    .map((chainId) => {
      const isNative =
        (snap.symbol === 'NOVA' && (chainId === 22016 || chainId === 9001)) ||
        (snap.symbol === 'NRW' && chainId === 33001)

      let address: string | null = null
      if (chainId === 22016 && snap.symbol === 'AnA') address = MESH_CONTRACTS.AnA_22016
      if (chainId === 22016 && snap.symbol === 'WAGAS') address = MESH_CONTRACTS.WAGAS_22016

      const hinted = oracleUsdPrice(snap.symbol) ?? snap.usd
      const token: ChainToken = {
        symbol: snap.symbol,
        name: snap.name,
        decimals: snap.decimals,
        address,
        standard: isNative && !address ? 'native' : 'erc20',
        usd: hinted,
        coingeckoId: snap.coingeckoId ?? undefined,
      }
      return { chainId, token, source, importedAt: now }
    })
}

export interface NovaPlusTransferResult {
  added: number
  total: number
  count: number
  chains: number[]
  source: 'live' | 'snapshot'
  priced: number
  withLiquidity: number
}

/**
 * Enable Nova Plus chains and transfer every production token into the wallet
 * with USD price + liquidity depth attached.
 */
export async function transferNovaPlusToWallet(
  source: UserTokenRecord['source'] = 'ecosystem',
): Promise<NovaPlusTransferResult> {
  setEnabledChainIds([
    ...new Set([...getEnabledChainIds(), ...BRIDGE_CURRENCY_CHAIN_IDS, ...NOVA_PLUS_CHAIN_IDS]),
  ])

  const { tokens, source: catalogSource } = await fetchNovaPlusCatalog(true)
  const records = tokens.flatMap((t) => snapToRecords(t, source))

  // 7 production bridge currencies on Nova Plus + Anaka Bridge
  const bridgeRecords: UserTokenRecord[] = bridgeCurrencyTokenDefs().map((d) => ({
    chainId: d.chainIds[0]!,
    token: {
      symbol: d.symbol,
      name: d.name,
      decimals: d.decimals,
      address: d.address,
      standard: d.standard,
      usd: d.usd,
    },
    source,
    importedAt: Date.now(),
  }))

  // Also ensure verified contracts exist even if live API omits them
  const extras: UserTokenRecord[] = [
    {
      chainId: 22016,
      token: {
        symbol: 'AnA',
        name: 'Anaka',
        decimals: 18,
        address: MESH_CONTRACTS.AnA_22016,
        standard: 'erc20',
        usd: oracleUsdPrice('AnA') ?? 1,
      },
      source,
      importedAt: Date.now(),
    },
    {
      chainId: 22016,
      token: {
        symbol: 'WAGAS',
        name: 'Wrapped AGAS',
        decimals: 18,
        address: MESH_CONTRACTS.WAGAS_22016,
        standard: 'erc20',
        usd: oracleUsdPrice('WAGAS') ?? 0.01,
      },
      source,
      importedAt: Date.now(),
    },
  ]

  const merged = mergeUserTokens([...records, ...bridgeRecords, ...extras], {
    refreshPrices: true,
  })

  let priced = 0
  let withLiquidity = 0
  await Promise.all(
    merged.records.slice(0, 400).map(async (r) => {
      const q = await quoteLiquidity(r.chainId, r.token.symbol, r.token.coingeckoId)
      if (q?.priceUsd != null) {
        priced++
        r.token.usd = q.priceUsd
      }
      if (q && q.liquidityUsd > 0) withLiquidity++
    }),
  )
  // Persist refreshed USD hints
  mergeUserTokens(merged.records, { refreshPrices: true })

  try {
    storage()?.setItem(
      CATALOG_META_KEY,
      `nova-plus-live:${merged.total}:${NOVA_PLUS_CHAIN_IDS.join(',')}`,
    )
  } catch {
    /* ignore */
  }

  return {
    added: merged.added,
    total: merged.total,
    count: records.length + extras.length,
    chains: [...NOVA_PLUS_CHAIN_IDS],
    source: catalogSource,
    priced,
    withLiquidity,
  }
}
