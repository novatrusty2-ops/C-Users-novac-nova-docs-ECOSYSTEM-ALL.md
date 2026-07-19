import { useMemo } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { useWallet } from '@/context/WalletContext'
import { loadActivity } from '@/lib/activity'
import { explorerTxUrl, getChain } from '@/lib/chains'

export function Activity() {
  const { activeAccount } = useWallet()

  const items = useMemo(
    () => (activeAccount ? loadActivity(activeAccount.address) : []),
    [activeAccount],
  )

  return (
    <>
      <TopBar title="History" />
      <div className="page-container">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-nova-muted">
            No history yet. Trades and sends appear here.
          </p>
        ) : (
          <ul className="token-list">
            {items.map((item) => {
              const chain = getChain(item.chainId)
              const txUrl = explorerTxUrl(item.chainId, item.hash)
              const isOut = item.kind === 'send' || item.kind === 'swap'
              return (
                <li key={item.id} className="flex items-center gap-3 py-3.5">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      item.status === 'failed'
                        ? 'bg-nova-danger/15 text-nova-danger'
                        : 'bg-nova-surface-raised text-nova-accent'
                    }`}
                  >
                    {item.kind === 'swap' ? '⇄' : isOut ? '↑' : '↓'}
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
