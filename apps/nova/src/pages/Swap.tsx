import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { useWallet } from '@/context/WalletContext'
import { quoteSwap, type SwapQuote } from '@/lib/swap'
import { swapableSymbols } from '@/lib/tokens'
import { appendActivity, createActivityId } from '@/lib/activity'

export function Swap() {
  const { activeChainId, activeAccount } = useWallet()
  const symbols = swapableSymbols(activeChainId)
  const [from, setFrom] = useState(symbols[0] ?? 'USDC')
  const [to, setTo] = useState(symbols[1] ?? 'USDT')
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const s = swapableSymbols(activeChainId)
    setFrom(s[0] ?? 'USDC')
    setTo(s[1] ?? 'USDT')
    setQuote(null)
    setDone(false)
  }, [activeChainId])

  async function fetchQuote() {
    setError('')
    setLoading(true)
    setDone(false)
    try {
      const q = await quoteSwap(from, to, amount)
      setQuote(q)
    } catch (err) {
      setQuote(null)
      setError(err instanceof Error ? err.message : 'Quote failed')
    } finally {
      setLoading(false)
    }
  }

  function confirmSwap() {
    if (!quote || !activeAccount) return
    appendActivity(activeAccount.address, {
      id: createActivityId(),
      chainId: activeChainId,
      hash: `0x${createActivityId().replace(/-/g, '')}`,
      from: activeAccount.address,
      to: activeAccount.address,
      value: quote.amountOut,
      symbol: quote.toSymbol,
      timestamp: Date.now(),
      status: 'confirmed',
      kind: 'swap',
    })
    setDone(true)
    setAmount('')
    setQuote(null)
  }

  return (
    <>
      <TopBar title="Swap" />
      <div className="page-container space-y-4">
        <p className="text-sm text-nova-muted">
          1:1 stable swaps with 0.3% fee — trading surface for Nova mesh assets.
        </p>

        <div className="card-surface space-y-3">
          <label className="block text-xs text-nova-muted">From</label>
          <div className="flex gap-2">
            <select
              className="input-field flex-1"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            >
              {symbols.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              className="input-field flex-1"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <label className="block text-xs text-nova-muted">To</label>
          <select
            className="input-field w-full"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            {symbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <Button
            className="w-full"
            disabled={!amount || loading}
            onClick={() => void fetchQuote()}
          >
            {loading ? <Spinner /> : 'Get quote'}
          </Button>
        </div>

        {error ? <p className="text-sm text-nova-danger">{error}</p> : null}

        {quote ? (
          <div className="card-surface space-y-2 animate-fade-up">
            <p className="text-xs text-nova-muted">Quote · {quote.provider}</p>
            <p className="font-display text-2xl font-semibold text-nova-ink">
              {quote.amountIn} {quote.fromSymbol} → {quote.amountOut} {quote.toSymbol}
            </p>
            <p className="text-xs text-nova-muted">
              Fee {quote.feeBps / 100}% ({quote.feeAmount} {quote.fromSymbol})
            </p>
            <Button className="w-full" onClick={confirmSwap}>
              Confirm swap
            </Button>
          </div>
        ) : null}

        {done ? (
          <p className="text-sm text-nova-accent animate-fade-up">Swap recorded in activity.</p>
        ) : null}
      </div>
    </>
  )
}
