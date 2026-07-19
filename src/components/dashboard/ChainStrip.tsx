import { getChain } from '@/lib/chains'
import { useEnabledChains } from '@/hooks/useEnabledChains'
import { useWallet } from '@/context/WalletContext'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'

const FEATURED = [22016, 33001, 11011, 1] as const

export function ChainStrip() {
  const { enabledIds } = useEnabledChains()
  const { activeChainId, switchChain } = useWallet()
  const { rows } = useTokenBalances()
  const { settings, formatUsd } = useDisplaySettings()

  const ids = FEATURED.filter((id) => enabledIds.includes(id))

  return (
    <section className="animate-fade-up" style={{ animationDelay: '80ms' }}>
      <h2 className="mb-3 font-display text-xl text-signet-gold-muted">Networks</h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ids.map((id) => {
          const chain = getChain(id)
          if (!chain) return null
          const chainUsd = rows
            .filter((r) => r.chainId === id)
            .reduce((s, r) => s + (r.usdValue ?? 0), 0)
          const active = activeChainId === id
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => switchChain(id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  active
                    ? 'border-signet-gold/50 bg-signet-surface-raised'
                    : 'border-signet-border bg-signet-surface/60 hover:border-signet-gold/30'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-signet-bg-deep"
                    style={{ backgroundColor: chain.iconColor }}
                  >
                    {chain.nativeCurrency.symbol.slice(0, 2)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-signet-ink">
                      {chain.name}
                    </span>
                    <span className="block text-xs text-signet-ink-dim">
                      {settings.hideBalances ? '••••' : formatUsd(chainUsd)}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
