import { Link } from 'react-router-dom'
import { PortfolioAnchor } from '@/components/dashboard/PortfolioAnchor'
import { ChainStrip } from '@/components/dashboard/ChainStrip'
import { BanksDirectoryButton } from '@/components/banks/BanksDirectoryButton'
import { FafoBadge } from '@/components/fafo/FafoBadge'
import { MultisigBadge } from '@/components/multisig/MultisigBadge'
import { TokenList } from '@/components/tokens/TokenList'
import { buildPortfolioInsights } from '@/lib/insights'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { useVisibleTokenRows } from '@/hooks/useVisibleTokenRows'
import { useWallet } from '@/context/WalletContext'
import { ROUTES } from '@/lib/routes'

const ACTIONS = [
  { to: ROUTES.send, label: 'Send', hint: 'Transfer tokens' },
  { to: ROUTES.receive, label: 'Receive', hint: 'Show address' },
  { to: ROUTES.swap, label: 'Swap', hint: 'Exchange assets' },
  { to: ROUTES.bridge, label: 'Bridge', hint: 'Cross-chain' },
] as const

export function DashboardPage() {
  const { rows, totalUsd, loading } = useTokenBalances()
  const visible = useVisibleTokenRows()
  const insights = buildPortfolioInsights(rows, totalUsd)
  const { activeAccount } = useWallet()

  return (
    <div className="page-container space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3 animate-fade-up">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-signet-gold-muted">Signet</p>
          <h1 className="font-display text-3xl text-signet-gold-light md:text-4xl">Dashboard</h1>
          {activeAccount ? (
            <p className="mt-1 text-sm text-signet-ink-muted">{activeAccount.name}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {activeAccount?.kind === 'multisig' ? (
            <MultisigBadge
              threshold={activeAccount.threshold}
              owners={activeAccount.owners?.length}
            />
          ) : null}
          <FafoBadge />
        </div>
      </header>

      <PortfolioAnchor />

      <nav className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {ACTIONS.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="card-interactive group text-center"
          >
            <span className="block font-medium text-signet-gold-light group-hover:text-signet-gold-bright">
              {a.label}
            </span>
            <span className="mt-1 block text-xs text-signet-ink-dim">{a.hint}</span>
          </Link>
        ))}
      </nav>

      <ChainStrip />

      <section className="animate-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl text-signet-gold-muted">Assets</h2>
          <Link to={ROUTES.tokens} className="text-xs text-signet-gold-muted hover:text-signet-gold">
            Manage tokens
          </Link>
        </div>
        <div className="rounded-xl border border-signet-border bg-signet-surface/50 px-3 py-1">
          {loading ? (
            <p className="py-6 text-center text-sm text-signet-ink-dim">Loading balances…</p>
          ) : (
            <TokenList rows={visible.slice(0, 8)} />
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link to={ROUTES.assets} className="btn-ghost text-sm">
            View all assets
          </Link>
          <Link to={ROUTES.bridge} className="btn-ghost text-sm">
            NovaOne ↔ NRW bridge
          </Link>
        </div>
      </section>

      <BanksDirectoryButton />

      <section className="animate-fade-up" style={{ animationDelay: '160ms' }}>
        <h2 className="mb-3 font-display text-xl text-signet-gold-muted">Insights</h2>
        <ul className="space-y-2">
          {insights.map((i) => (
            <li
              key={i.id}
              className="border-l-2 border-signet-gold/30 pl-3 text-sm text-signet-ink-muted"
            >
              {i.message}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
