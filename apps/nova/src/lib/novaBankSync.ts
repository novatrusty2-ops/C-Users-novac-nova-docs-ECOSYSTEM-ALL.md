import { ECOSYSTEM_LINKS } from './partners'
import { NOVA_PLUS_CHAIN_IDS, NOVA_PLUS_SNAPSHOT, type NovaPlusTokenSnap } from './novaPlusSnapshot'
import { NOVA_PLUS_CHAINS } from './novaPlus'

interface BankTokenRaw {
  symbol: string
  name: string
  decimals: number
  assetClass?: string
  chains?: string[]
  networks?: string[]
  tradable?: boolean
  swappable?: boolean
  transferable?: boolean
  decentralized?: boolean
}

const SLUG_TO_CHAIN: Record<string, number> = {
  'nova-one': NOVA_PLUS_CHAINS.novaOne,
  'nrw-world': NOVA_PLUS_CHAINS.nrwWorld,
  'nova-production': NOVA_PLUS_CHAINS.novaProduction,
}

function mapChains(raw: BankTokenRaw): number[] {
  const ids = new Set<number>()
  for (const c of raw.chains || []) {
    if (SLUG_TO_CHAIN[c]) ids.add(SLUG_TO_CHAIN[c]!)
  }
  if ((raw.chains || []).some((c) => c === 'nova-one' || c === 'nrw-world' || c === 'alltra-mainnet')) {
    for (const id of NOVA_PLUS_CHAIN_IDS) ids.add(id)
  }
  if (raw.symbol === 'NOVA') return [22016, 9001]
  if (raw.symbol === 'NRW') return [33001]
  if (ids.size === 0) return [...NOVA_PLUS_CHAIN_IDS]
  return [...ids]
}

function fromSnapHint(symbol: string): NovaPlusTokenSnap | undefined {
  return NOVA_PLUS_SNAPSHOT.find((t) => t.symbol === symbol)
}

function normalize(raw: BankTokenRaw): NovaPlusTokenSnap {
  const hint = fromSnapHint(raw.symbol)
  return {
    symbol: raw.symbol,
    name: raw.name || hint?.name || raw.symbol,
    decimals: raw.decimals ?? hint?.decimals ?? 18,
    assetClass: raw.assetClass || hint?.assetClass || 'crypto',
    chainIds: mapChains(raw),
    tradable: raw.tradable ?? hint?.tradable ?? true,
    swappable: raw.swappable ?? hint?.swappable ?? true,
    transferable: raw.transferable ?? hint?.transferable ?? true,
    decentralized: raw.decentralized ?? hint?.decentralized ?? true,
    usd: hint?.usd ?? (raw.assetClass === 'fiat' ? 1 : 0.05),
    coingeckoId: hint?.coingeckoId ?? null,
  }
}

let cache: NovaPlusTokenSnap[] | null = null
let cacheAt = 0
const TTL_MS = 5 * 60_000

/** Local production snapshot (always available). */
export function localNovaPlusCatalog(): NovaPlusTokenSnap[] {
  return NOVA_PLUS_SNAPSHOT
}

/** Fetch live Nova Bank ecosystem tokens; fall back to snapshot. */
export async function fetchNovaPlusCatalog(force = false): Promise<{
  tokens: NovaPlusTokenSnap[]
  source: 'live' | 'snapshot'
}> {
  if (!force && cache && Date.now() - cacheAt < TTL_MS) {
    return { tokens: cache, source: 'live' }
  }
  try {
    const res = await fetch(ECOSYSTEM_LINKS.ecosystemTokensApi, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`Nova Bank ${res.status}`)
    const data = (await res.json()) as { tokens?: BankTokenRaw[] }
    const list = Array.isArray(data.tokens) ? data.tokens : []
    if (list.length === 0) throw new Error('empty catalog')
    const mapped = list.map(normalize)
    // de-dupe by symbol keeping richest chain set
    const map = new Map<string, NovaPlusTokenSnap>()
    for (const t of [...NOVA_PLUS_SNAPSHOT, ...mapped]) {
      const prev = map.get(t.symbol)
      if (!prev) {
        map.set(t.symbol, t)
        continue
      }
      map.set(t.symbol, {
        ...prev,
        ...t,
        chainIds: [...new Set([...prev.chainIds, ...t.chainIds])],
        usd: t.usd || prev.usd,
        coingeckoId: t.coingeckoId || prev.coingeckoId,
      })
    }
    cache = [...map.values()]
    cacheAt = Date.now()
    return { tokens: cache, source: 'live' }
  } catch {
    return { tokens: localNovaPlusCatalog(), source: 'snapshot' }
  }
}

export function findNovaPlusToken(symbol: string): NovaPlusTokenSnap | undefined {
  const upper = symbol.trim()
  return (
    (cache || NOVA_PLUS_SNAPSHOT).find((t) => t.symbol === upper) ||
    NOVA_PLUS_SNAPSHOT.find((t) => t.symbol.toUpperCase() === upper.toUpperCase())
  )
}
