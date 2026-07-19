import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'

export function SettingsConnectionsPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl text-signet-gold-light">Connections</h1>
      <p className="mt-2 text-sm text-signet-ink-muted">WalletConnect sessions and dApp permissions.</p>
      <Link to={ROUTES.walletConnect} className="card-interactive mt-4 inline-block">
        Open WalletConnect
      </Link>
    </div>
  )
}
