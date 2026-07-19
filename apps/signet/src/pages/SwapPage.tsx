import { useState } from 'react'
import { quoteSwap, type SwapQuote } from '@/lib/swap'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'

export function SwapPage() {
  const [from, setFrom] = useState('USDC')
  const [to, setTo] = useState('NOVA')
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [loading, setLoading] = useState(false)

  const getQuote = async () => {
    setLoading(true)
    try {
      const q = await quoteSwap(from, to, amount)
      setQuote(q)
    } catch {
      setQuote(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container max-w-md animate-fade-up">
      <h1 className="font-display text-3xl text-signet-gold-light">Swap</h1>
      <div className="card-interactive mt-6 space-y-3">
        <input className="input-field" placeholder="From symbol" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="input-field" placeholder="To symbol" value={to} onChange={(e) => setTo(e.target.value)} />
        <input className="input-field" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button className="w-full" disabled={loading || !amount} onClick={() => void getQuote()}>
          {loading ? <Spinner /> : 'Get quote'}
        </Button>
        {quote ? (
          <div className="rounded-lg border border-signet-border bg-signet-bg-alt/50 p-3 text-sm">
            <p>
              {quote.amountIn} {quote.fromSymbol} → {quote.amountOut} {quote.toSymbol}
            </p>
            <p className="text-signet-ink-dim">Fee {quote.feeAmount} · {quote.provider}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
