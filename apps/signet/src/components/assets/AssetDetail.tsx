import type { TokenBalanceRow } from '@/types'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import { CopyButton } from '@/components/common/CopyButton'

interface AssetDetailProps {
  row: TokenBalanceRow | undefined
  address?: string
}

export function AssetDetail({ row, address }: AssetDetailProps) {
  const { settings, formatUsd } = useDisplaySettings()

  if (!row) {
    return <p className="text-signet-ink-dim">Asset not found.</p>
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center gap-3">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-signet-bg-deep"
          style={{ backgroundColor: row.iconColor }}
        >
          {row.symbol.slice(0, 2)}
        </span>
        <div>
          <h1 className="font-display text-3xl text-signet-gold-light">{row.symbol}</h1>
          <p className="text-sm text-signet-ink-muted">{row.name} · {row.chainName}</p>
        </div>
      </div>
      <p className="font-display text-4xl">
        {settings.hideBalances ? '••••••' : row.balance} {row.symbol}
      </p>
      {row.usdValue != null ? (
        <p className="text-signet-ink-dim">{settings.hideBalances ? '••••' : formatUsd(row.usdValue)}</p>
      ) : null}
      {address ? (
        <div className="card-interactive font-mono text-xs break-all">
          {address}
          <CopyButton text={address} className="mt-2" />
        </div>
      ) : null}
    </div>
  )
}
