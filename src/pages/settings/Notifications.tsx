import { ToggleRow } from '@/components/settings/ToggleRow'
import { getPref, setPref } from '@/lib/prefs'

export function SettingsNotificationsPage() {
  const tx = getPref('notifyTx', true)
  const price = getPref('notifyPrice', false)

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl text-signet-gold-light">Notifications</h1>
      <ToggleRow label="Transaction alerts" checked={tx} onChange={(v) => setPref('notifyTx', v)} />
      <ToggleRow label="Price movement" checked={price} onChange={(v) => setPref('notifyPrice', v)} />
    </div>
  )
}
