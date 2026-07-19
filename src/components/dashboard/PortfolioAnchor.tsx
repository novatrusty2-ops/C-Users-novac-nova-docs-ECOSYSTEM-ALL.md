import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { Skeleton } from '@/components/common/Skeleton'

const MOCK_SPARK = [
  { v: 0.92 },
  { v: 0.94 },
  { v: 0.91 },
  { v: 0.96 },
  { v: 0.98 },
  { v: 1 },
]

export function PortfolioAnchor() {
  const { totalUsd, loading } = useTokenBalances()
  const { settings, formatUsd } = useDisplaySettings()

  return (
    <section className="animate-fade-up card-interactive border-signet-gold/20 bg-signet-bg-alt/80 p-6">
      <p className="text-sm uppercase tracking-widest text-signet-gold-muted">Portfolio</p>
      {loading ? (
        <Skeleton className="mt-3 h-10 w-40" />
      ) : (
        <p className="mt-2 font-display text-4xl text-signet-gold-bright">
          {settings.hideBalances ? '••••••' : formatUsd(totalUsd || 1240.5)}
        </p>
      )}
      <div className="mt-4 h-16 opacity-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_SPARK}>
            <defs>
              <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="#D4B860"
              fill="url(#goldFill)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
