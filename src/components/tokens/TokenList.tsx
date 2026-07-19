import type { TokenBalanceRow } from '@/types'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import { shortAddress } from '@/lib/tokens'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'

interface TokenListProps {
  rows: TokenBalanceRow[]
}

export function TokenList({ rows }: TokenListProps) {
  const { settings, formatUsd } = useDisplaySettings()

  if (!rows.length) {
    return <p className="text-sm text-signet-ink-dim">No tokens on this network.</p>
  }

  return (
    <ul className="divide-y divide-signet-border/50">
      {rows.map((row) => (
        <li key={`${row.chainId}-${row.symbol}-${row.address ?? 'native'}`}>
          <Link
            to={ROUTES.tokenChart.replace(':symbol', row.symbol)}
            className="flex items-center gap-3 py-3 transition hover:bg-signet-surface/40 px-2 -mx-2 rounded-lg"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-signet-bg-deep"
              style={{ backgroundColor: row.iconColor }}
            >
              {row.symbol.slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{row.symbol}</p>
              <p className="truncate text-xs text-signet-ink-dim">
                {row.name}
                {row.address ? ` · ${shortAddress(row.address)}` : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm">
                {settings.hideBalances ? '••••' : row.balance}
              </p>
              {row.usdValue != null ? (
                <p className="text-xs text-signet-ink-dim">
                  {settings.hideBalances ? '••••' : formatUsd(row.usdValue)}
                </p>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
