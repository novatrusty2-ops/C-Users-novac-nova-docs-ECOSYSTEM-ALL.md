import { Link } from 'react-router-dom'
import type { TokenBalanceRow } from '@/types'
import { ROUTES } from '@/lib/routes'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'

interface AssetListProps {
  rows: TokenBalanceRow[]
}

export function AssetList({ rows }: AssetListProps) {
  const { settings, formatUsd } = useDisplaySettings()
  const withBalance = rows.filter((r) => r.balanceRaw > 0n)

  if (!withBalance.length) {
    return <p className="text-sm text-signet-ink-dim">No assets with balance yet.</p>
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {withBalance.map((row) => (
        <li key={`${row.chainId}-${row.symbol}`}>
          <Link
            to={`${ROUTES.assets}/${row.symbol}`}
            className="card-interactive block"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: row.iconColor }}
              />
              <span className="font-medium">{row.symbol}</span>
              <span className="ml-auto font-mono text-sm">
                {settings.hideBalances ? '••••' : row.balance}
              </span>
            </div>
            {row.usdValue != null ? (
              <p className="mt-2 text-xs text-signet-ink-dim">
                {settings.hideBalances ? '••••' : formatUsd(row.usdValue)}
              </p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}
