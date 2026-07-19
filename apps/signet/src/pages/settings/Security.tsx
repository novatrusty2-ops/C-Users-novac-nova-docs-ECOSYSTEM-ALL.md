import { useWallet } from '@/context/WalletContext'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import type { AutolockMinutes } from '@/types'
import { ToggleRow } from '@/components/settings/ToggleRow'
import { Button } from '@/components/common/Button'

const AUTOLOCK_OPTIONS: AutolockMinutes[] = [1, 5, 15, 30, 60, 0]

export function SettingsSecurityPage() {
  const { lockWallet, wipeWallet } = useWallet()
  const { autolockMinutes, setAutolock } = useDisplaySettings()

  return (
    <div className="animate-fade-up space-y-6">
      <h1 className="font-display text-2xl text-signet-gold-light">Security</h1>
      <div>
        <p className="text-sm text-signet-ink-muted mb-2">Auto-lock after inactivity</p>
        <div className="flex flex-wrap gap-2">
          {AUTOLOCK_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              className={`btn-ghost text-xs ${autolockMinutes === m ? 'border-signet-gold/50' : ''}`}
              onClick={() => setAutolock(m)}
            >
              {m === 0 ? 'Never' : `${m}m`}
            </button>
          ))}
        </div>
      </div>
      <ToggleRow label="Require password for sensitive actions" checked description="Enabled by default" onChange={() => undefined} />
      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" onClick={lockWallet}>Lock now</Button>
        <Button variant="danger" onClick={wipeWallet}>Remove wallet</Button>
      </div>
    </div>
  )
}
