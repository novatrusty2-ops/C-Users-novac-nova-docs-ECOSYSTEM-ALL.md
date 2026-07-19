import { useState } from 'react'
import type { BridgeQuote } from '@/lib/bridge/execute'
import { useBridge } from '@/hooks/useBridge'
import { useChainData } from '@/hooks/useChainData'
import { useWallet } from '@/context/WalletContext'
import { Button } from '@/components/common/Button'
import { BridgeReviewModal } from './BridgeReviewModal'

export function BridgePanel() {
  const { routes, getQuote, bridge, loading } = useBridge()
  const { visibleChains } = useChainData()
  const { activeChainId } = useWallet()
  const [toChainId, setToChainId] = useState(routes[0]?.toChainId ?? 33001)
  const [symbol, setSymbol] = useState('NOVA')
  const [amount, setAmount] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [quote, setQuote] = useState<BridgeQuote | null>(null)

  const preview = () => {
    if (!amount) return setQuote(null)
    setQuote(getQuote(toChainId, symbol, amount))
  }
  const dest = visibleChains.find((c) => c.id === toChainId)

  const confirm = async () => {
    await bridge(toChainId, symbol, amount)
    setReviewOpen(false)
    setAmount('')
  }

  return (
    <div className="card-interactive space-y-4 animate-fade-up">
      <h2 className="font-display text-xl text-signet-gold-light">Cross-chain bridge</h2>
      <label className="block text-sm text-signet-ink-muted">
        Destination
        <select
          className="input-field mt-1"
          value={toChainId}
          onChange={(e) => setToChainId(Number(e.target.value))}
        >
          {routes.map((r) => {
            const chain = visibleChains.find((c) => c.id === r.toChainId)
            return (
              <option key={r.id} value={r.toChainId}>
                {chain?.name ?? r.toChainId}
              </option>
            )
          })}
        </select>
      </label>
      {dest ? (
        <div className="flex items-center gap-2 text-xs text-signet-ink-dim">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dest.iconColor }} />
          {dest.name} · from chain {activeChainId}
        </div>
      ) : null}
      <input className="input-field" placeholder="Token symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
      <input className="input-field" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      {quote ? (
        <p className="text-sm text-signet-ink-muted">
          Receive ~{quote.amountOut} {symbol} · fee {quote.fee} ({quote.feeBps} bps)
        </p>
      ) : null}
      <Button
        className="w-full"
        disabled={!amount || loading}
        onClick={() => {
          preview()
          setReviewOpen(true)
        }}
      >
        Review bridge
      </Button>
      <BridgeReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        quote={quote}
        onConfirm={confirm}
        loading={loading}
      />
    </div>
  )
}
