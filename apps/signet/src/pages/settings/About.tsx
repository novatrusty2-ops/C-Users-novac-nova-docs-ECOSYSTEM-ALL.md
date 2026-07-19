import { BRAND } from '@/lib/brand'

export function SettingsAboutPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl text-signet-gold-light">About</h1>
      <p className="mt-4 text-sm text-signet-ink-muted">
        {BRAND.name} v3 · {BRAND.organization}
      </p>
      <p className="mt-2 text-sm text-signet-ink-dim">{BRAND.domain}</p>
    </div>
  )
}
