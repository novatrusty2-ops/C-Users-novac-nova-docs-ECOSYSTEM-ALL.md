import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'

const TABS = [
  { to: ROUTES.portfolio, label: 'Portfolio', icon: '◉' },
  { to: ROUTES.swap, label: 'Swap', icon: '⇄' },
  { to: ROUTES.activity, label: 'Activity', icon: '≡' },
  { to: ROUTES.settings, label: 'Settings', icon: '⚙' },
] as const

interface MobileShellProps {
  children: React.ReactNode
  showTabs?: boolean
}

export function MobileShell({ children, showTabs = false }: MobileShellProps) {
  const { pathname } = useLocation()

  return (
    <div className="relative min-h-[100dvh]">
      {children}
      {showTabs ? (
        <nav className="tab-bar" aria-label="Main">
          <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
            {TABS.map((tab) => {
              const active = pathname === tab.to || pathname.startsWith(`${tab.to}/`)
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-medium transition ${
                    active
                      ? 'text-nova-highlight bg-nova-surface/80'
                      : 'text-nova-muted hover:text-nova-ink'
                  }`}
                >
                  <span className="text-base leading-none">{tab.icon}</span>
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
