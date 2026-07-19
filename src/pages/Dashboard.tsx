import { Link } from 'react-router-dom'
import { PortfolioAnchor } from '@/components/dashboard/PortfolioAnchor'
import { BanksDirectoryButton } from '@/components/banks/BanksDirectoryButton'
import { FafoBadge } from '@/components/fafo/FafoBadge'
import { buildPortfolioInsights } from '@/lib/insights'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { ROUTES } from '@/lib/routes'

export function DashboardPage() {
  const { rows, totalUsd } = useTokenBalances()
  const insights = buildPortfolioInsights(rows, totalUsd)

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-3xl text-signet-gold-light">Dashboard</h1>
        <FafoBadge />
      </div>
      <PortfolioAnchor />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { to: ROUTES.send, label: 'Send' },
          { to: ROUTES.receive, label: 'Receive' },
          { to: ROUTES.swap, label: 'Swap' },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="card-interactive text-center font-medium">
            {a.label}
          </Link>
        ))}
      </div>
      <BanksDirectoryButton />
      <section>
        <h2 className="mb-3 font-display text-xl text-signet-gold-muted">Insights</h2>
        <ul className="space-y-2">
          {insights.map((i) => (
            <li key={i.id} className="text-sm text-signet-ink-muted border-l-2 border-signet-gold/30 pl-3">
              {i.message}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
