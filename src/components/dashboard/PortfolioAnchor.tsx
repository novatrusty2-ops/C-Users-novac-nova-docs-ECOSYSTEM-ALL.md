import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { Skeleton } from '@/components/common/Skeleton'
import { useWallet } from '@/context/WalletContext'
import { shortAddress } from '@/lib/tokens'
import { CopyButton } from '@/components/common/CopyButton'

function sparkFromTotal(totalUsd: number) {
  const base = Math.max(totalUsd, 1)
  const factors = [0.88, 0.91, 0.89, 0.94, 0.97, 0.95, 1]
  return factors.map((f, i) => ({ i, v: Number((base * f).toFixed(4)) }))
}

export function PortfolioAnchor() {
  const { totalUsd, loading, refresh } = useTokenBalances()
  const { settings, formatUsd, update } = useDisplaySettings()
  const { activeAccount, activeChain } = useWallet()

  return (
    <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-signet-border bg-signet-bg-alt/80 p-6 shadow-soft">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-30 blur-3xl"
        style={{ background: activeChain?.iconColor ?? '#C9A84C' }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-signet-gold-muted">Portfolio</p>
          {loading ? (
            <Skeleton className="mt-3 h-10 w-44" />
          ) : (
            <p className="mt-2 font-display text-4xl text-signet-gold-bright md:text-5xl">
              {settings.hideBalances ? '••••••' : formatUsd(totalUsd)}
            </p>
          )}
          {activeAccount ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p className="font-mono text-xs text-signet-ink-dim">
                {shortAddress(activeAccount.address, 6)}
              </p>
              <CopyButton text={activeAccount.address} label="Copy" />
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            className="btn-ghost text-xs py-1.5"
            onClick={() => update({ hideBalances: !settings.hideBalances })}
          >
            {settings.hideBalances ? 'Show' : 'Hide'}
          </button>
          <button type="button" className="btn-ghost text-xs py-1.5" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
      </div>
      <div className="relative mt-5 h-20 opacity-90">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkFromTotal(totalUsd)}>
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
              isAnimationActive
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {activeChain ? (
        <p className="relative mt-2 text-xs text-signet-ink-dim">
          Active network:{' '}
          <span className="font-medium" style={{ color: activeChain.iconColor }}>
            {activeChain.name}
          </span>
        </p>
      ) : null}
    </section>
  )
}
