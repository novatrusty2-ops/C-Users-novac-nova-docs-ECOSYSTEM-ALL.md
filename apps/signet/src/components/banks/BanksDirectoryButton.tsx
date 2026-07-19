import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'
import { privateBankingChains } from '@/lib/chains'
import { canViewPrivateBankingChains } from '@/lib/privateAccess'

export function BanksDirectoryButton() {
  const locked = !canViewPrivateBankingChains()
  const count = privateBankingChains().length

  return (
    <Link
      to={ROUTES.banks}
      className="card-interactive flex items-center justify-between gap-3"
    >
      <div>
        <p className="font-display text-lg text-signet-gold-light">Private banking directory</p>
        <p className="text-xs text-signet-ink-dim">
          {locked ? 'Institutional access required' : `${count} partner networks`}
        </p>
      </div>
      <span className="text-signet-gold">→</span>
    </Link>
  )
}
