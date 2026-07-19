import { loadPendingSafeTxs } from '@/lib/safe/pending'
import { MultisigBadge } from '@/components/multisig/MultisigBadge'
import { shortAddress } from '@/lib/tokens'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'
import { Button } from '@/components/common/Button'

export function PendingProposalsPage() {
  const pending = loadPendingSafeTxs().filter((p) => !p.executed)

  return (
    <div className="page-container animate-fade-up">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-signet-gold-light">Pending proposals</h1>
        <Link to={ROUTES.multisigCreate}>
          <Button variant="ghost">New Safe</Button>
        </Link>
      </div>
      {!pending.length ? (
        <p className="text-signet-ink-dim">No pending multisig transactions.</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((tx) => (
            <li key={tx.safeTxHash} className="card-interactive">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs">{shortAddress(tx.safeAddress, 6)}</span>
                <MultisigBadge threshold={tx.threshold} owners={tx.threshold} />
              </div>
              <p className="mt-2 text-sm">
                To {shortAddress(tx.to)} · {tx.confirmations}/{tx.threshold} sigs
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
