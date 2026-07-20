import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { IconSwap } from '@/components/layout/icons'
import { useWallet } from '@/context/WalletContext'
import { useWeb3 } from '@/context/Web3Context'
import { quoteSwap, type SwapQuote } from '@/lib/swap'
import { swapableSymbols } from '@/lib/tokens'
import { ECOSYSTEM_LINKS } from '@/lib/partners'
import { isMeshStable } from '@/lib/tokenCapabilities'

export function Swap() {
  const { activeChainId, activeAccount } = useWallet()
  const { connected, ensureActiveChain } = useWeb3()
  const symbols = swapableSymbols(activeChainId)
  const [from, setFrom] = useState(symbols[0] ?? 'USDC')
  const [to, setTo] = useState(symbols[1] ?? 'USDT')
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const s = swapableSymbols(activeChainId)
    setFrom(s[0] ?? 'USDC')
    setTo(s[1] ?? 'USDT')
    setQuote(null)
  }, [activeChainId])

  function flip() {
    setFrom(to)
    setTo(from)
    setQuote(null)
  }

  async function fetchQuote() {
    setError('')
    setLoading(true)
    try {
      if (connected) {
        try {
          await ensureActiveChain(activeChainId)
        } catch {
          /* quote still works off-chain */
        }
      }
      const q = await quoteSwap(from, to, amount)
      setQuote(q)
    } catch (err) {
      setQuote(null)
      setError(err instanceof Error ? err.message : 'Quote failed')
    } finally {
      setLoading(false)
    }
  }

  const stablePair = isMeshStable(from) && isMeshStable(to)

  return (
    <>
      <TopBar title="Trade" />
      <div className="page-container space-y-4">
        <p className="text-xs text-nova-muted">
          Indicative mesh quote · stables tradable on NovaONE / NRW / DeFi Oracle (138)
          {activeAccount ? '' : ' · connect wallet to trade'}
        </p>

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
                    {isMeshStable(s) ? ' · stable' : ''}
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
                    {isMeshStable(s) ? ' · stable' : ''}
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
              <span className="text-nova-muted">Status</span>
              <span className="text-nova-ink">
                {stablePair ? 'Stable pair · tradable' : 'Mesh pair · tradable'}
              </span>
            </div>
            <a
              href={ECOSYSTEM_LINKS.novaSwap}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center rounded-xl bg-nova-accent px-4 py-3 text-sm font-semibold text-nova-bg"
            >
              Execute on Nova Swap →
            </a>
            <p className="text-center text-[11px] text-nova-muted">
              Production settlement runs on Nova Bank Swap (no fake on-wallet confirms).
            </p>
          </div>
        ) : null}
      </div>
    </>
  )
}
