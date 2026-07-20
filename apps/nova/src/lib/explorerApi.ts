/**
 * Blockscout Etherscan-compatible explorer client for DeFi Oracle (chain 138).
 * Uses /api?module=... (Etherscan shape) with /api/v2 fallbacks.
 * Never points chain 138 at etherscan.io — that indexes Ethereum mainnet only.
 */

export const DBIS_CHAIN_ID = 138

/** Primary + companion Blockscout hosts for eip155:138 */
export const DBIS_EXPLORER_BASES = [
  'https://explorer.defi-oracle.io',
  'https://explorer.d-bis.org',
  'https://blockscout.defi-oracle.io',
] as const

export interface ExplorerTokenBalance {
  contractAddress: string | null
  symbol: string
  name: string
  decimals: number
  balanceRaw: bigint
  type: 'native' | 'erc20'
}

export interface ExplorerTx {
  hash: string
  from: string
  to: string
  value: string
  symbol: string
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  chainId: number
}

type JsonRecord = Record<string, unknown>

function normalizeBase(url: string): string {
  return url.replace(/\/$/, '')
}

function explorerBasesForChain(chainId: number, preferred?: string[]): string[] {
  if (chainId !== DBIS_CHAIN_ID) return preferred?.length ? preferred.map(normalizeBase) : []
  const ordered = [...(preferred ?? []), ...DBIS_EXPLORER_BASES].map(normalizeBase)
  return [...new Set(ordered)]
}

async function fetchJson(url: string, timeoutMs = 8_000): Promise<unknown | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'nova-wallet-explorer' },
    })
    if (!res.ok) return null
    return (await res.json()) as unknown
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

function asRecord(v: unknown): JsonRecord | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as JsonRecord) : null
}

function parseAmount(raw: unknown): bigint {
  if (typeof raw === 'bigint') return raw
  if (typeof raw === 'number' && Number.isFinite(raw)) return BigInt(Math.trunc(raw))
  if (typeof raw === 'string' && /^-?\d+$/.test(raw.trim())) return BigInt(raw.trim())
  return 0n
}

function parseDecimals(raw: unknown, fallback = 18): number {
  const n = typeof raw === 'string' ? Number(raw) : typeof raw === 'number' ? raw : fallback
  return Number.isFinite(n) && n >= 0 && n <= 36 ? Math.trunc(n) : fallback
}

function addressField(raw: unknown): string {
  if (typeof raw === 'string') return raw
  const rec = asRecord(raw)
  if (rec && typeof rec.hash === 'string') return rec.hash
  if (rec && typeof rec.address === 'string') return rec.address
  return ''
}

/** Etherscan-compatible GET against the first healthy Blockscout host */
export async function etherscanCompatGet(
  chainId: number,
  query: Record<string, string>,
  preferredExplorers?: string[],
): Promise<unknown | null> {
  const bases = explorerBasesForChain(chainId, preferredExplorers)
  const qs = new URLSearchParams(query).toString()
  for (const base of bases) {
    const data = await fetchJson(`${base}/api?${qs}`)
    const rec = asRecord(data)
    if (!rec) continue
    // Etherscan shape: { status, message, result }
    if ('result' in rec) return rec
    // Some Blockscout builds return the payload directly
    return rec
  }
  return null
}

export async function fetchNativeBalanceExplorer(
  chainId: number,
  address: string,
  preferredExplorers?: string[],
): Promise<bigint | null> {
  const data = await etherscanCompatGet(
    chainId,
    { module: 'account', action: 'balance', address, tag: 'latest' },
    preferredExplorers,
  )
  const rec = asRecord(data)
  if (!rec) return null
  const result = rec.result
  if (typeof result === 'string' || typeof result === 'number') return parseAmount(result)
  return null
}

function mapTokenListEntry(entry: JsonRecord): ExplorerTokenBalance | null {
  const symbol = String(entry.symbol ?? entry.tokenSymbol ?? '').trim()
  if (!symbol) return null
  const contract =
    (entry.contractAddress as string | undefined) ||
    (entry.tokenAddress as string | undefined) ||
    (entry.address as string | undefined) ||
    null
  const balanceRaw = parseAmount(
    entry.balance ?? entry.value ?? entry.quantity ?? entry.tokenQuantity ?? '0',
  )
  return {
    contractAddress: contract,
    symbol,
    name: String(entry.name ?? entry.tokenName ?? symbol),
    decimals: parseDecimals(entry.decimals ?? entry.tokenDecimal, 18),
    balanceRaw,
    type: contract ? 'erc20' : 'native',
  }
}

/** Account token list via Blockscout tokenlist / v2 tokens */
export async function fetchAccountTokenBalances(
  chainId: number,
  address: string,
  preferredExplorers?: string[],
): Promise<ExplorerTokenBalance[]> {
  const bases = explorerBasesForChain(chainId, preferredExplorers)
  const out: ExplorerTokenBalance[] = []
  const seen = new Set<string>()

  const push = (row: ExplorerTokenBalance | null) => {
    if (!row) return
    const key = `${row.symbol.toUpperCase()}:${(row.contractAddress ?? 'native').toLowerCase()}`
    if (seen.has(key)) return
    seen.add(key)
    out.push(row)
  }

  // 1) Etherscan-compatible tokenlist (Blockscout)
  const list = await etherscanCompatGet(
    chainId,
    { module: 'account', action: 'tokenlist', address },
    preferredExplorers,
  )
  const listRec = asRecord(list)
  const listResult = listRec?.result
  if (Array.isArray(listResult)) {
    for (const item of listResult) {
      const rec = asRecord(item)
      if (rec) push(mapTokenListEntry(rec))
    }
  }

  // 2) Blockscout v2 address tokens
  if (out.length === 0) {
    for (const base of bases) {
      const data = await fetchJson(`${base}/api/v2/addresses/${address}/tokens?type=ERC-20`)
      const rec = asRecord(data)
      const items = (rec?.items as unknown[]) ?? (Array.isArray(data) ? data : null)
      if (!items) continue
      for (const item of items) {
        const row = asRecord(item)
        if (!row) continue
        const token = asRecord(row.token) ?? row
        push(
          mapTokenListEntry({
            ...token,
            balance: row.value ?? row.balance,
            contractAddress: (token.address as string) ?? (row.token_address as string),
          }),
        )
      }
      if (out.length) break
    }
  }

  // Always include native if explorer balance works
  const native = await fetchNativeBalanceExplorer(chainId, address, preferredExplorers)
  if (native != null) {
    push({
      contractAddress: null,
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
      balanceRaw: native,
      type: 'native',
    })
  }

  return out
}

export async function fetchAccountTxs(
  chainId: number,
  address: string,
  preferredExplorers?: string[],
  pageSize = 25,
): Promise<ExplorerTx[]> {
  const data = await etherscanCompatGet(
    chainId,
    {
      module: 'account',
      action: 'txlist',
      address,
      startblock: '0',
      endblock: '99999999',
      page: '1',
      offset: String(pageSize),
      sort: 'desc',
    },
    preferredExplorers,
  )
  const rec = asRecord(data)
  const result = rec?.result
  if (!Array.isArray(result)) {
    // Blockscout v2 fallback
    const bases = explorerBasesForChain(chainId, preferredExplorers)
    for (const base of bases) {
      const v2 = await fetchJson(`${base}/api/v2/addresses/${address}/transactions`)
      const v2rec = asRecord(v2)
      const items = (v2rec?.items as unknown[]) ?? null
      if (!items?.length) continue
      return items.slice(0, pageSize).map((item) => {
        const row = asRecord(item) ?? {}
        const statusRaw = String(row.status ?? row.result ?? 'ok').toLowerCase()
        const failed = statusRaw.includes('fail') || statusRaw === 'error'
        const ts = Number(row.timestamp ?? row.timeStamp ?? Date.now() / 1000)
        return {
          hash: String(row.hash ?? ''),
          from: addressField(row.from),
          to: addressField(row.to),
          value: String(row.value ?? '0'),
          symbol: 'ETH',
          timestamp: Number.isFinite(ts) ? (ts > 1e12 ? ts : ts * 1000) : Date.now(),
          status: failed ? 'failed' : 'confirmed',
          chainId,
        } satisfies ExplorerTx
      })
    }
    return []
  }

  return result.slice(0, pageSize).map((item) => {
    const row = asRecord(item) ?? {}
    const isError = String(row.isError ?? '0') === '1' || String(row.txreceipt_status ?? '1') === '0'
    const ts = Number(row.timeStamp ?? row.timestamp ?? 0)
    return {
      hash: String(row.hash ?? ''),
      from: String(row.from ?? ''),
      to: String(row.to ?? ''),
      value: String(row.value ?? '0'),
      symbol: 'ETH',
      timestamp: Number.isFinite(ts) && ts > 0 ? ts * 1000 : Date.now(),
      status: isError ? 'failed' : 'confirmed',
      chainId,
    } satisfies ExplorerTx
  })
}

/** Merge explorer token rows into catalog symbols without dropping zero-balance catalog assets */
export function mergeCatalogWithExplorerBalances<T extends { symbol: string; address: string | null }>(
  catalog: T[],
  explorer: ExplorerTokenBalance[],
): Array<T & { explorerBalanceRaw?: bigint }> {
  const byKey = new Map<string, T & { explorerBalanceRaw?: bigint }>()
  for (const t of catalog) {
    byKey.set(`${t.symbol.toUpperCase()}:${(t.address ?? 'native').toLowerCase()}`, { ...t })
  }
  for (const e of explorer) {
    const key = `${e.symbol.toUpperCase()}:${(e.contractAddress ?? 'native').toLowerCase()}`
    const existing = byKey.get(key)
    if (existing) {
      existing.explorerBalanceRaw = e.balanceRaw
      if (!existing.address && e.contractAddress) {
        ;(existing as { address: string | null }).address = e.contractAddress
      }
    } else {
      byKey.set(key, {
        ...(catalog[0]
          ? {
              ...catalog[0],
              symbol: e.symbol,
              name: e.name,
              decimals: e.decimals,
              address: e.contractAddress,
              standard: e.type,
            }
          : ({
              symbol: e.symbol,
              name: e.name,
              decimals: e.decimals,
              address: e.contractAddress,
              standard: e.type,
            } as unknown as T)),
        explorerBalanceRaw: e.balanceRaw,
      })
    }
  }
  return [...byKey.values()]
}
