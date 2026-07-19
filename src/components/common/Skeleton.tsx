export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-signet-surface-raised/60 ${className}`}
      aria-hidden
    />
  )
}
