import type { BridgeHistoryEntry } from '@/lib/bridge/history'
import { getChain } from '@/lib/chains'
import { shortAddress } from '@/lib/tokens'

interface BridgeHistoryProps {
  entries: BridgeHistoryEntry[]
}

export function BridgeHistory({ entries }: BridgeHistoryProps) {
  if (!entries.length) {
    return <p className="text-sm text-signet-ink-dim">No bridge history yet.</p>
  }

  return (
    <ul className="space-y-2">
      {entries.map((e) => {
        const from = getChain(e.fromChainId)
        const to = getChain(e.toChainId)
        return (
          <li key={e.id} className="card-interactive text-sm">
            <div className="flex items-center justify-between gap-2">
              <span>
                {e.amount} {e.symbol}
              </span>
              <span className="text-xs uppercase text-signet-success">{e.status}</span>
            </div>
            <p className="mt-1 text-xs text-signet-ink-dim">
              {from?.name ?? e.fromChainId} → {to?.name ?? e.toChainId}
            </p>
            <p className="font-mono text-xs text-signet-ink-dim">{shortAddress(e.txHash, 8)}</p>
          </li>
        )
      })}
    </ul>
  )
}
