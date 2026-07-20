import { useMemo, useState } from 'react'
import {
  buildTokenChart,
  chartPolyline,
  type ChartRange,
  type TokenChartSeries,
} from '@/lib/charts'
import { formatCompactUsd, formatTokenPrice } from '@/lib/liquidity'

const RANGES: ChartRange[] = ['1H', '1D', '1W', '1M', 'ALL']

interface TokenChartProps {
  chainId: number
  symbol: string
  midPrice?: number | null
  width?: number
  height?: number
}

export function TokenChart({
  chainId,
  symbol,
  midPrice,
  width = 360,
  height = 180,
}: TokenChartProps) {
  const [range, setRange] = useState<ChartRange>('1D')
  const series: TokenChartSeries = useMemo(
    () => buildTokenChart(chainId, symbol, range, midPrice),
    [chainId, symbol, range, midPrice],
  )
  const paths = useMemo(
    () => chartPolyline(series.points, width, height),
    [series.points, width, height],
  )
  const up = series.changePct >= 0
  const stroke = up ? '#14B8A6' : '#F43F5E'
  const fill = up ? 'rgba(20,184,166,0.18)' : 'rgba(244,63,94,0.16)'

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-2xl font-bold text-nova-ink">
            {formatTokenPrice(series.last)}
          </p>
          <p className={`mt-1 text-sm font-medium ${up ? 'text-nova-success' : 'text-nova-danger'}`}>
            {up ? '+' : ''}
            {series.changePct.toFixed(2)}% · {series.pair}
          </p>
        </div>
        <div className="text-right text-[11px] text-nova-muted">
          <p>
            H {formatTokenPrice(series.high)} · L {formatTokenPrice(series.low)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-nova-surface px-2 pt-3 pb-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-44 w-full animate-fade-up"
          role="img"
          aria-label={`${symbol} price chart`}
        >
          <defs>
            <linearGradient id={`fill-${symbol}-${chainId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={paths.area} fill={`url(#fill-${symbol}-${chainId})`} />
          <path
            d={paths.line}
            fill="none"
            stroke={stroke}
            strokeWidth="2.25"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${fill})` }}
          />
        </svg>
      </div>

      <div className="okx-segment">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            className="okx-segment-btn"
            data-active={range === r}
            onClick={() => setRange(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-nova-muted">
        Mesh chart · vol{' '}
        {formatCompactUsd(series.points.reduce((s, p) => s + p.volume, 0))} ({range})
      </p>
    </section>
  )
}
