import { useState } from 'react'
import { privateBankingChains } from '@/lib/chains'
import { canViewPrivateBankingChains } from '@/lib/privateAccess'
import { InstitutionalGate } from '@/components/security/InstitutionalGate'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'

export function BanksDirectoryPage() {
  const [gateOpen, setGateOpen] = useState(false)
  const hasAccess = canViewPrivateBankingChains()
  const banks = privateBankingChains()

  if (!hasAccess) {
    return (
      <div className="page-container">
        <EmptyState
          title="Institutional access required"
          description="Private banking networks are visible only after verification."
          action={
            <Button onClick={() => setGateOpen(true)} shimmer>
              Verify access
            </Button>
          }
        />
        <InstitutionalGate open={gateOpen} onClose={() => setGateOpen(false)} />
      </div>
    )
  }

  return (
    <div className="page-container animate-fade-up">
      <h1 className="font-display text-3xl text-signet-gold-light">Banks directory</h1>
      <p className="mt-2 text-sm text-signet-ink-muted">Partner and private banking networks on the Anaka mesh.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {banks.map((chain) => (
          <li key={chain.id} className="card-interactive">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-signet-bg-deep"
                style={{ backgroundColor: chain.iconColor }}
              >
                {chain.nativeCurrency.symbol.slice(0, 2)}
              </span>
              <div>
                <p className="font-display text-lg text-signet-gold-light">{chain.name}</p>
                <p className="text-xs text-signet-ink-dim">Chain {chain.id} · {chain.tier}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
