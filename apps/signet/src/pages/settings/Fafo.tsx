import { useFAFO } from '@/hooks/useFAFO'
import { ToggleRow } from '@/components/settings/ToggleRow'
import { FafoBadge } from '@/components/fafo/FafoBadge'

export function SettingsFafoPage() {
  const { enabled, set } = useFAFO()

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl text-signet-gold-light">FAFO mode</h1>
        <FafoBadge />
      </div>
      <p className="mt-2 text-sm text-signet-ink-muted">Fuck Around and Find Out — experimental UI flag.</p>
      <ToggleRow label="Enable FAFO" checked={enabled} onChange={set} />
    </div>
  )
}
