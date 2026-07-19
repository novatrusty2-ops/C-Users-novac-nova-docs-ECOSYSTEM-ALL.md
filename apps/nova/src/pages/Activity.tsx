import { useMemo } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { useWallet } from '@/context/WalletContext'
import { loadActivity } from '@/lib/activity'
import { explorerTxUrl } from '@/lib/chains'
import { getChain } from '@/lib/chains'

export function Activity() {
  const { activeAccount } = useWallet()

  const items = useMemo(
    () => (activeAccount ? loadActivity(activeAccount.address) : []),
    [activeAccount],
  )

  return (
    <>
      <TopBar title="Activity" />
      <div className="page-container">
        {items.length === 0 ? (
          <p className="text-sm text-nova-muted py-8 text-center">No activity yet. Swaps and sends appear here.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => {
              const chain = getChain(item.chainId)
              const txUrl = explorerTxUrl(item.chainId, item.hash)
              return (
                <li key={item.id} className="card-surface">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-nova-ink capitalize">
                        {item.kind} · {item.symbol}
                      </p>
                      <p className="text-xs text-nova-muted">{chain?.name ?? item.chainId}</p>
                    </div>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${
                        item.status === 'confirmed'
                          ? 'bg-nova-accent/20 text-nova-accent'
                          : item.status === 'pending'
                            ? 'bg-nova-highlight/20 text-nova-highlight'
                            : 'bg-nova-danger/20 text-nova-danger'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-sm text-nova-ink">{item.value}</p>
                  {txUrl ? (
                    <a
                      href={txUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs text-nova-highlight hover:underline"
                    >
                      View tx
                    </a>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
