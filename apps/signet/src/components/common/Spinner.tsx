export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-signet-gold/30 border-t-signet-gold ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
