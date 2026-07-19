interface MultisigBadgeProps {
  threshold?: number
  owners?: number
}

export function MultisigBadge({ threshold, owners }: MultisigBadgeProps) {
  if (!threshold) return null
  return (
    <span className="inline-flex rounded-md border border-signet-gold/30 bg-signet-surface px-2 py-0.5 text-[10px] uppercase tracking-wide text-signet-gold-muted">
      {threshold}/{owners ?? '?'} Safe
    </span>
  )
}
