import { useState } from 'react'
import { canViewPrivateBankingChains, revokePrivateAccess } from '@/lib/privateAccess'
import { InstitutionalGate } from './InstitutionalGate'

export function PrivateAccessBanner() {
  const [open, setOpen] = useState(false)
  const hasAccess = canViewPrivateBankingChains()

  if (hasAccess) {
    return (
      <div className="border-b border-signet-gold/20 bg-signet-surface/60 px-4 py-2 text-center text-xs text-signet-gold-muted">
        Private banking networks visible ·{' '}
        <button type="button" className="underline" onClick={() => revokePrivateAccess()}>
          Revoke access
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="border-b border-signet-border/40 px-4 py-2 text-center text-xs text-signet-ink-dim">
        <button type="button" className="text-signet-gold-light underline" onClick={() => setOpen(true)}>
          Unlock institutional networks
        </button>
      </div>
      <InstitutionalGate open={open} onClose={() => setOpen(false)} />
    </>
  )
}
