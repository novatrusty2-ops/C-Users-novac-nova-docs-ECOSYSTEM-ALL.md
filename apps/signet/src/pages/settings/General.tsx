import { BRAND } from '@/lib/brand'

export function SettingsGeneralPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl text-signet-gold-light">General</h1>
      <p className="mt-2 text-sm text-signet-ink-muted">{BRAND.name} · {BRAND.domain}</p>
    </div>
  )
}
