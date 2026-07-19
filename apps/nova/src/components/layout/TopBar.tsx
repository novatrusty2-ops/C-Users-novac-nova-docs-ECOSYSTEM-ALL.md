import { Link } from 'react-router-dom'
import { IconChevronDown, IconHistory } from '@/components/layout/icons'
import { NetworkPill } from '@/components/wallet/NetworkPill'
import { useWallet } from '@/context/WalletContext'
import { ROUTES } from '@/lib/routes'

interface TopBarProps {
  title?: string
  showNetwork?: boolean
  backTo?: string
  /** OKX-style assets header with account chip */
  variant?: 'default' | 'assets'
}

export function TopBar({ title, showNetwork = true, backTo, variant = 'default' }: TopBarProps) {
  const { activeAccount } = useWallet()

  if (variant === 'assets') {
    return (
      <header className="sticky top-0 z-30 bg-nova-bg/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link
            to={ROUTES.settings}
            className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-nova-surface px-3 py-1.5 text-sm font-semibold text-nova-ink"
          >
            <span className="truncate max-w-[10rem]">
              {activeAccount?.name ?? 'Nova'}
            </span>
            <IconChevronDown className="h-3.5 w-3.5 shrink-0 text-nova-muted" />
          </Link>
          <div className="flex items-center gap-2">
            {showNetwork ? <NetworkPill /> : null}
            <Link
              to={ROUTES.activity}
              className="flex h-9 w-9 items-center justify-center rounded-full text-nova-muted hover:bg-nova-surface hover:text-nova-ink"
              aria-label="History"
            >
              <IconHistory className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 border-b border-nova-border bg-nova-bg/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {backTo ? (
            <Link to={backTo} className="shrink-0 text-sm text-nova-muted hover:text-nova-accent">
              ← Back
            </Link>
          ) : (
            <Link
              to={ROUTES.portfolio}
              className="shrink-0 font-display text-sm font-bold tracking-[0.2em] text-nova-accent"
            >
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
