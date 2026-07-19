export function OfflineBanner() {
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true
  if (online) return null

  return (
    <div className="bg-signet-burgundy-dark px-4 py-2 text-center text-sm text-signet-gold-bright">
      You are offline — read-only mode
    </div>
  )
}
