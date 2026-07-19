import type { BridgeQuote } from '@/lib/bridge/execute'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'

interface BridgeReviewModalProps {
  open: boolean
  onClose: () => void
  quote: BridgeQuote | null
  onConfirm: () => Promise<void>
  loading: boolean
}

export function BridgeReviewModal({
  open,
  onClose,
  quote,
  onConfirm,
  loading,
}: BridgeReviewModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Confirm bridge">
      {quote ? (
        <div className="space-y-3 text-sm">
          <p>
            Send <strong>{quote.amountIn} {quote.symbol}</strong>
          </p>
          <p>
            Receive ~<strong>{quote.amountOut} {quote.symbol}</strong>
          </p>
          <p className="text-signet-ink-dim">Fee: {quote.fee} · Route {quote.routeId}</p>
          <Button className="w-full" disabled={loading} onClick={() => void onConfirm()}>
            {loading ? <Spinner /> : 'Confirm bridge'}
          </Button>
        </div>
      ) : (
        <p className="text-signet-ink-dim">Enter amount for a quote.</p>
      )}
    </Modal>
  )
}
