import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'
import { AccountSwitcher } from '@/components/wallet/AccountSwitcher'
import { NetworkSwitcher } from '@/components/wallet/NetworkSwitcher'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import { Logo } from './Logo'

export function Header() {
  const { pathname } = useLocation()
  const showNav = pathname !== ROUTES.home

  if (!showNav) return null

  return (
    <header className="sticky top-0 z-40 border-b border-signet-border/60 bg-signet-bg-deep/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Logo compact />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <NetworkSwitcher />
          <AccountSwitcher />
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}

export function MobileNav() {
  const { pathname } = useLocation()
  if (pathname === ROUTES.home || pathname.startsWith('/onboarding') || pathname === ROUTES.unlock) {
    return null
  }

  const links = [
    { to: ROUTES.portfolio, label: 'Home' },
    { to: ROUTES.tokens, label: 'Tokens' },
    { to: ROUTES.send, label: 'Send' },
    { to: ROUTES.more, label: 'More' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-signet-border bg-signet-bg-deep/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-lg justify-around py-2">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className={`block px-3 py-1 text-xs ${
                pathname.startsWith(l.to) ? 'text-signet-gold' : 'text-signet-ink-dim'
              }`}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
