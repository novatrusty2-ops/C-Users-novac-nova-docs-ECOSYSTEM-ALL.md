import { useMemo } from 'react'
import { buildPortfolioChart, chartPolyline } from '@/lib/charts'

interface PortfolioChartProps {
  totalUsd: number
  hideBalances?: boolean
}

/** Compact portfolio sparkline under the balance hero */
export function PortfolioChart({ totalUsd, hideBalances }: PortfolioChartProps) {
  const series = useMemo(() => buildPortfolioChart(Math.max(totalUsd, 1)), [totalUsd])
  const paths = useMemo(() => chartPolyline(series.points, 320, 72), [series.points])
  const up = series.changePct >= 0
  const stroke = up ? '#38BDF8' : '#F43F5E'

  if (hideBalances) {
    return (
      <div className="h-16 rounded-xl bg-nova-surface/60 flex items-center justify-center text-xs text-nova-muted">
        Chart hidden
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl bg-nova-surface px-2 py-2 animate-fade-up">
      <div className="mb-1 flex items-center justify-between px-1 text-[11px] text-nova-muted">
        <span>24h portfolio</span>
        <span className={up ? 'text-nova-success' : 'text-nova-danger'}>
          {up ? '+' : ''}
          {series.changePct.toFixed(2)}%
        </span>
      </div>
      <svg viewBox="0 0 320 72" className="h-16 w-full" role="img" aria-label="Portfolio chart">
        <defs>
          <linearGradient id="portfolio-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={paths.area} fill="url(#portfolio-fill)" />
        <path
          d={paths.line}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
