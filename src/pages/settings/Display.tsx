import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import type { DisplayCurrency } from '@/types'
import { ToggleRow } from '@/components/settings/ToggleRow'

const CURRENCIES: DisplayCurrency[] = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CHF', 'SGD']

export function SettingsDisplayPage() {
  const { settings, update, setCurrency } = useDisplaySettings()

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="font-display text-2xl text-signet-gold-light">Display</h1>
      <div>
        <p className="text-sm text-signet-ink-muted mb-2">Currency</p>
        <select
          className="input-field"
          value={settings.currency}
          onChange={(e) => setCurrency(e.target.value as DisplayCurrency)}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <ToggleRow
        label="Hide balances"
        checked={settings.hideBalances}
        onChange={(v) => update({ hideBalances: v })}
      />
      <ToggleRow
        label="Hide small balances"
        description={`Under $${settings.smallBalanceThresholdUsd}`}
        checked={settings.hideSmallBalances}
        onChange={(v) => update({ hideSmallBalances: v })}
      />
      <ToggleRow
        label="Spam filter"
        checked={settings.spamFilter}
        onChange={(v) => update({ spamFilter: v })}
      />
    </div>
  )
}
