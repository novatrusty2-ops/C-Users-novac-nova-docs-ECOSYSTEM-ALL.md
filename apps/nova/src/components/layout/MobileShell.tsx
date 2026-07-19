import { Link, useLocation } from 'react-router-dom'
import { IconHistory, IconSwap, IconUser, IconWallet } from '@/components/layout/icons'
import { ROUTES } from '@/lib/routes'

const TABS = [
  { to: ROUTES.portfolio, label: 'Assets', Icon: IconWallet },
  { to: ROUTES.swap, label: 'Trade', Icon: IconSwap },
  { to: ROUTES.activity, label: 'History', Icon: IconHistory },
  { to: ROUTES.settings, label: 'Me', Icon: IconUser },
] as const

interface MobileShellProps {
  children: React.ReactNode
  showTabs?: boolean
}

export function MobileShell({ children, showTabs = false }: MobileShellProps) {
  const { pathname } = useLocation()

  return (
    <div className="relative min-h-[100dvh] bg-nova-bg">
      {children}
      {showTabs ? (
        <nav className="tab-bar" aria-label="Main">
          <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-2 pb-1">
            {TABS.map((tab) => {
              const active = pathname === tab.to || pathname.startsWith(`${tab.to}/`)
              const Icon = tab.Icon
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`flex flex-1 flex-col items-center gap-1 px-2 py-1.5 text-[11px] font-medium transition ${
                    active ? 'text-nova-accent' : 'text-nova-muted hover:text-nova-ink'
                  }`}
                >
                  <Icon className={`h-[22px] w-[22px] ${active ? 'scale-105' : ''}`} />
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </nav>
      ) : null}
    </div>
  )
}
