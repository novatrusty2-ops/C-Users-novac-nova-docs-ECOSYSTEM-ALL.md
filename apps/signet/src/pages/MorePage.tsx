import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'
import { FafoBadge } from '@/components/fafo/FafoBadge'

const LINKS = [
  { to: ROUTES.bridge, label: 'Bridge' },
  { to: ROUTES.assets, label: 'Assets' },
  { to: ROUTES.banks, label: 'Banks directory' },
  { to: ROUTES.multisigCreate, label: 'Create Safe' },
  { to: ROUTES.multisigPending, label: 'Pending proposals' },
  { to: ROUTES.settings, label: 'Settings' },
  { to: ROUTES.institutional, label: 'Institutional' },
]

export function MorePage() {
  return (
    <div className="page-container">
      <div className="mb-6 flex items-center gap-2">
        <h1 className="font-display text-3xl text-signet-gold-light">More</h1>
        <FafoBadge />
      </div>
      <ul className="space-y-2">
        {LINKS.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="card-interactive block font-medium">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
