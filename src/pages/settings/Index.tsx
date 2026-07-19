import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'

export function SettingsIndexPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl text-signet-gold-light">Settings</h1>
      <p className="mt-2 text-sm text-signet-ink-muted">Manage accounts, security, and preferences.</p>
      <ul className="mt-6 space-y-2 text-sm">
        <li><Link to={ROUTES.settingsSecurity} className="text-signet-gold-light underline">Security & autolock</Link></li>
        <li><Link to={ROUTES.settingsNetwork} className="text-signet-gold-light underline">Enabled networks</Link></li>
        <li><Link to={ROUTES.settingsBackup} className="text-signet-gold-light underline">Backup recovery phrase</Link></li>
      </ul>
    </div>
  )
}
