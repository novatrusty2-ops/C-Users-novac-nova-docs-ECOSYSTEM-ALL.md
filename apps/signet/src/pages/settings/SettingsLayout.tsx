import { NavLink, Outlet } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'

const NAV = [
  { to: ROUTES.settings, end: true, label: 'Overview' },
  { to: ROUTES.settingsAccounts, label: 'Accounts' },
  { to: ROUTES.settingsGeneral, label: 'General' },
  { to: ROUTES.settingsSecurity, label: 'Security' },
  { to: ROUTES.settingsBackup, label: 'Backup' },
  { to: ROUTES.settingsNetwork, label: 'Network' },
  { to: ROUTES.settingsDisplay, label: 'Display' },
  { to: ROUTES.settingsNotifications, label: 'Notifications' },
  { to: ROUTES.settingsConnections, label: 'Connections' },
  { to: ROUTES.settingsAdvanced, label: 'Advanced' },
  { to: ROUTES.settingsFafo, label: 'FAFO' },
  { to: ROUTES.settingsAbout, label: 'About' },
]

export function SettingsLayout() {
  return (
    <div className="page-container grid gap-8 md:grid-cols-[200px_1fr]">
      <nav className="space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `settings-nav-link block ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
