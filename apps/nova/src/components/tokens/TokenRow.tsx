import { Link } from 'react-router-dom'
import type { TokenBalanceRow } from '@/types'
import { formatCompactUsd, formatTokenPrice } from '@/lib/liquidity'
import { tokenRoute } from '@/lib/routes'

interface TokenRowProps {
  row: TokenBalanceRow
  hideBalances?: boolean
}

/** OKX-style flat asset row — icon · name/price · amount/value */
export function TokenRow({ row, hideBalances }: TokenRowProps) {
  const price = row.usdPrice
  const value = row.usdValue
  const changeHint =
    row.volume24hUsd != null && row.volume24hUsd > 0
      ? row.liquidityUsd && row.liquidityUsd > 0
        ? ((row.volume24hUsd / Math.max(row.liquidityUsd, 1)) * 2 - 1) * 4
        : null
      : null

  return (
    <li>
      <Link
        to={tokenRoute(row.chainId, row.symbol)}
        className="flex items-center gap-3 py-3.5 transition hover:opacity-90"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
          style={{ background: `${row.iconColor}28`, color: row.iconColor }}
        >
          {row.symbol.slice(0, 3)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-nova-ink">{row.symbol}</p>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-nova-muted">
            <span className="font-mono">
              {hideBalances ? '••••' : price != null ? formatTokenPrice(price) : '—'}
            </span>
            {changeHint != null ? (
              <span className={changeHint >= 0 ? 'text-nova-success' : 'text-nova-danger'}>
                {changeHint >= 0 ? '+' : ''}
                {changeHint.toFixed(2)}%
              </span>
            ) : row.chainName ? (
              <span className="truncate">{row.chainName}</span>
            ) : null}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-[15px] font-medium text-nova-ink">
            {hideBalances ? '••••' : row.balance}
          </p>
          <p className="mt-0.5 font-mono text-xs text-nova-muted">
            {hideBalances
              ? '••••'
              : value != null
                ? value >= 1000
                  ? formatCompactUsd(value)
                  : formatTokenPrice(value)
                : '—'}
          </p>
        </div>
      </Link>
    </li>
  )
}
