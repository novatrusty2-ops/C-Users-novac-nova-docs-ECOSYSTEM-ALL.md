import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { IconSwap } from '@/components/layout/icons'
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

  function flip() {
    setFrom(to)
    setTo(from)
    setQuote(null)
    setDone(false)
  }

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
      <TopBar title="Trade" />
      <div className="page-container space-y-4">
        <p className="text-xs text-nova-muted">Convert · 0.3% fee · Nova mesh stables</p>

        {/* OKX-style stacked trade panels */}
        <div className="relative space-y-2">
          <div className="rounded-xl bg-nova-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-nova-muted">From</span>
              <select
                className="rounded-full bg-nova-surface-raised px-3 py-1 text-sm font-semibold text-nova-ink outline-none"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              >
                {symbols.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="w-full bg-transparent font-display text-3xl font-semibold text-nova-ink outline-none placeholder:text-nova-muted/40"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={flip}
            className="absolute left-1/2 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-nova-border bg-nova-bg text-nova-accent"
            aria-label="Flip pair"
          >
            <IconSwap className="h-4 w-4" />
          </button>

          <div className="rounded-xl bg-nova-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-nova-muted">To</span>
              <select
                className="rounded-full bg-nova-surface-raised px-3 py-1 text-sm font-semibold text-nova-ink outline-none"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              >
                {symbols.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <p className="font-display text-3xl font-semibold text-nova-muted/70">
              {quote ? quote.amountOut : '0.00'}
            </p>
          </div>
        </div>

        <Button className="w-full" disabled={!amount || loading} onClick={() => void fetchQuote()}>
          {loading ? <Spinner /> : 'Get quote'}
        </Button>

        {error ? <p className="text-sm text-nova-danger">{error}</p> : null}

        {quote ? (
          <div className="animate-fade-up space-y-3 rounded-xl bg-nova-surface p-4">
            <div className="flex justify-between text-sm">
              <span className="text-nova-muted">Rate</span>
              <span className="font-mono text-nova-ink">
                1 {quote.fromSymbol} ≈{' '}
                {(Number(quote.amountOut) / Math.max(Number(quote.amountIn), 1e-12)).toFixed(6)}{' '}
                {quote.toSymbol}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-nova-muted">Fee</span>
              <span className="font-mono text-nova-ink">
                {quote.feeAmount} {quote.fromSymbol} ({quote.feeBps / 100}%)
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-nova-muted">Provider</span>
              <span className="text-nova-ink">{quote.provider}</span>
            </div>
            <Button className="w-full" onClick={confirmSwap}>
              Confirm trade
            </Button>
          </div>
        ) : null}

        {done ? (
          <p className="animate-fade-up text-center text-sm text-nova-success">
            Trade recorded in History.
          </p>
        ) : null}
      </div>
    </>
  )
}
