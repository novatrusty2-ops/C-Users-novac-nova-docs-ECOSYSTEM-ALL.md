import { useEffect, useMemo, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { useWallet } from '@/context/WalletContext'
import { loadActivity } from '@/lib/activity'
import { explorerTxUrl, getChain } from '@/lib/chains'
import { DBIS_CHAIN_ID, fetchAccountTxs, type ExplorerTx } from '@/lib/explorerApi'
import { formatUnits } from 'ethers'
import type { ActivityItem } from '@/types'

function explorerToActivity(tx: ExplorerTx, accountAddress: string): ActivityItem {
  let display = tx.value
  try {
    const n = Number(formatUnits(BigInt(tx.value || '0'), 18))
    display = Number.isFinite(n)
      ? n.toLocaleString(undefined, { maximumFractionDigits: 6 })
      : tx.value
  } catch {
    /* keep raw */
  }
  const fromMe = tx.from.toLowerCase() === accountAddress.toLowerCase()
  return {
    id: `explorer:${tx.chainId}:${tx.hash}`,
    chainId: tx.chainId,
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: display,
    symbol: tx.symbol,
    timestamp: tx.timestamp,
    status: tx.status,
    kind: fromMe ? 'send' : 'receive',
  }
}

export function Activity() {
  const { activeAccount, activeChainId } = useWallet()
  const [explorerItems, setExplorerItems] = useState<ActivityItem[]>([])

  const localItems = useMemo(
    () => (activeAccount ? loadActivity(activeAccount.address) : []),
    [activeAccount],
  )

  useEffect(() => {
    let cancelled = false
    async function loadExplorer() {
      if (!activeAccount) {
        setExplorerItems([])
        return
      }
      // Prefer chain 138 Blockscout history when active, always attempt for custody mesh
      const chain = getChain(DBIS_CHAIN_ID)
      if (!chain) return
      const txs = await fetchAccountTxs(
        DBIS_CHAIN_ID,
        activeAccount.address,
        chain.blockExplorerUrls,
      )
      if (cancelled) return
      setExplorerItems(
        txs.filter((t) => t.hash).map((t) => explorerToActivity(t, activeAccount.address)),
      )
    }
    void loadExplorer()
    return () => {
      cancelled = true
    }
  }, [activeAccount, activeChainId])

  const items = useMemo(() => {
    const map = new Map<string, ActivityItem>()
    for (const item of [...explorerItems, ...localItems]) {
      const key = item.hash ? `${item.chainId}:${item.hash.toLowerCase()}` : item.id
      if (!map.has(key)) map.set(key, item)
    }
    return [...map.values()].sort((a, b) => b.timestamp - a.timestamp)
  }, [localItems, explorerItems])

  return (
    <>
      <TopBar title="History" />
      <div className="page-container">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-nova-muted">
            No history yet. Trades, sends, and chain-138 explorer txs appear here.
          </p>
        ) : (
          <ul className="token-list">
            {items.map((item) => {
              const chain = getChain(item.chainId)
              const txUrl = explorerTxUrl(item.chainId, item.hash)
              const isOut = item.kind === 'send' || item.kind === 'swap' || item.kind === 'withdraw'
              return (
                <li key={item.id} className="flex items-center gap-3 py-3.5">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      item.status === 'failed'
                        ? 'bg-nova-danger/15 text-nova-danger'
                        : 'bg-nova-surface-raised text-nova-accent'
                    }`}
                  >
                    {item.kind === 'swap' ? '⇄' : item.kind === 'withdraw' ? '↗' : isOut ? '↑' : '↓'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold capitalize text-nova-ink">
                      {item.kind} · {item.symbol}
                    </p>
                    <p className="mt-0.5 text-xs text-nova-muted">
                      {chain?.name ?? item.chainId} · {item.status}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-[15px] text-nova-ink">{item.value}</p>
                    {txUrl ? (
                      <a
                        href={txUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 block text-[11px] text-nova-accent"
                      >
                        Explorer
                      </a>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
