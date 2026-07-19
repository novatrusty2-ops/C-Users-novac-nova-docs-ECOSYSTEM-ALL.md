import type { TokenBalanceRow } from '@/types'
import { formatCompactUsd, formatTokenPrice } from '@/lib/liquidity'

interface TokenRowProps {
  row: TokenBalanceRow
  hideBalances?: boolean
}

export function TokenRow({ row, hideBalances }: TokenRowProps) {
  const price = row.usdPrice
  const value = row.usdValue
  const liq = row.liquidityUsd

  return (
    <li className="card-surface space-y-2">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: `${row.iconColor}22`, color: row.iconColor }}
        >
          {row.symbol.slice(0, 3)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-nova-ink">{row.symbol}</p>
          <p className="text-xs text-nova-muted truncate">
            {row.chainName}
            {row.pair ? ` · ${row.pair}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm text-nova-ink">
            {hideBalances ? '••••' : row.balance}
          </p>
          <p className="text-xs font-mono text-nova-highlight">
            {hideBalances
              ? '••••'
              : value != null
                ? value >= 1000
                  ? formatCompactUsd(value)
                  : formatTokenPrice(value)
                : '—'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-nova-border/40 pt-2 text-[11px] text-nova-muted">
        <span>
          Price{' '}
          <span className="text-nova-ink font-mono">
            {hideBalances ? '••••' : price != null ? formatTokenPrice(price) : '—'}
          </span>
        </span>
        <span>
          Liq{' '}
          <span className="text-nova-accent font-mono">
            {liq != null ? formatCompactUsd(liq) : '—'}
          </span>
        </span>
        {row.volume24hUsd != null ? (
          <span>
            Vol 24h{' '}
            <span className="font-mono text-nova-ink">{formatCompactUsd(row.volume24hUsd)}</span>
          </span>
        ) : null}
        {row.priceSource ? (
          <span className="ml-auto uppercase tracking-wide text-[10px] text-nova-muted/80">
            {row.priceSource}
          </span>
        ) : null}
      </div>
    </li>
  )
}
