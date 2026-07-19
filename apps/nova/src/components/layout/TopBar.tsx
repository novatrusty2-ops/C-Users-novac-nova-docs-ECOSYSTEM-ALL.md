import { Link } from 'react-router-dom'
import { NetworkPill } from '@/components/wallet/NetworkPill'
import { ROUTES } from '@/lib/routes'

interface TopBarProps {
  title?: string
  showNetwork?: boolean
  backTo?: string
}

export function TopBar({ title, showNetwork = true, backTo }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-nova-border/60 bg-nova-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {backTo ? (
            <Link to={backTo} className="text-nova-muted hover:text-nova-highlight text-sm shrink-0">
              ← Back
            </Link>
          ) : (
            <Link to={ROUTES.portfolio} className="font-display text-sm font-bold tracking-widest text-nova-accent shrink-0">
              NOVA
            </Link>
          )}
          {title ? (
            <h1 className="truncate font-display text-base font-semibold text-nova-ink">{title}</h1>
          ) : null}
        </div>
        {showNetwork ? <NetworkPill /> : null}
      </div>
    </header>
  )
}
