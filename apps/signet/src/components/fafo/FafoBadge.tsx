import { useFAFO } from '@/hooks/useFAFO'

export function FafoBadge() {
  const { enabled } = useFAFO()
  if (!enabled) return null

  return (
    <span className="inline-flex items-center rounded-full border border-signet-danger/50 bg-signet-burgundy-dark px-2 py-0.5 text-[10px] uppercase tracking-wider text-signet-gold-bright animate-pulse-gold">
      FAFO
    </span>
  )
}
