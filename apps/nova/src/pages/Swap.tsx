import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { formatCompactUsd, quoteLiquidity } from '@/lib/liquidity'
import { pairSentiment, sentimentTone } from '@/lib/sentiment'
import { ROUTES } from '@/lib/routes'
import { appendActivity, createActivityId } from '@/lib/activity'

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
  const [liqNote, setLiqNote] = useState('')
  const [sentimentLine, setSentimentLine] = useState('')
  const [sentimentClass, setSentimentClass] = useState('text-nova-muted')
  const [workable, setWorkable] = useState(true)
  const [queued, setQueued] = useState(false)

  useEffect(() => {
    const s = swapableSymbols(activeChainId)
    setFrom(s[0] ?? 'USDC')
    setTo(s[1] ?? 'USDT')
    setQuote(null)
    setQueued(false)
  }, [activeChainId])

  const stablePair = useMemo(() => isMeshStable(from) && isMeshStable(to), [from, to])

  function flip() {
    setFrom(to)
    setTo(from)
    setQuote(null)
    setQueued(false)
  }

  async function fetchQuote() {
    setError('')
    setLoading(true)
    setQueued(false)
    try {
      if (connected) {
        try {
          await ensureActiveChain(activeChainId)
        } catch {
          /* quote still works off-chain */
        }
      }
      const [q, fromLiq, toLiq] = await Promise.all([
        quoteSwap(from, to, amount),
        quoteLiquidity(activeChainId, from),
        quoteLiquidity(activeChainId, to),
      ])
      if (!fromLiq || !toLiq) throw new Error('Liquidity unavailable for this pair')

      const sentiment = pairSentiment(
        fromLiq.liquidityUsd,
        toLiq.liquidityUsd,
        fromLiq.volume24hUsd,
        toLiq.volume24hUsd,
        stablePair,
        fromLiq.mode === 'mesh' && toLiq.mode === 'mesh',
      )

      setQuote(q)
      setWorkable(sentiment.workable && fromLiq.swappable && toLiq.swappable)
      setSentimentClass(sentimentTone(sentiment.label))
      setSentimentLine(
        `${sentiment.label} · score ${sentiment.score} · ${sentiment.mode} · ${sentiment.headline}`,
      )
      setLiqNote(
        `${fromLiq.pair} ${formatCompactUsd(fromLiq.liquidityUsd)} · ${toLiq.pair} ${formatCompactUsd(toLiq.liquidityUsd)}`,
      )
      if (!sentiment.workable) {
        setError('Thin sentiment — prefer smaller size or use Withdraw / transfer')
      }
    } catch (err) {
      setQuote(null)
      setError(err instanceof Error ? err.message : 'Quote failed')
    } finally {
      setLoading(false)
    }
  }

  /** Workable stable path: queue mesh settlement intent (Nova Swap executes on-chain) */
  function queueStableSwap() {
    if (!quote || !activeAccount || !workable) return
    appendActivity(activeAccount.address, {
      id: createActivityId(),
      chainId: activeChainId,
      hash: `sentiment:${activeChainId}:${quote.fromSymbol}-${quote.toSymbol}:${Date.now()}`,
      from: activeAccount.address,
      to: activeAccount.address,
      value: quote.amountOut,
      symbol: quote.toSymbol,
      timestamp: Date.now(),
      status: 'pending',
      kind: 'swap',
    })
    setQueued(true)
  }

  return (
    <>
      <TopBar title="Trade" />
      <div className="page-container space-y-4">
        <p className="text-xs text-nova-muted">
          Stables swappable · liquidity + sentiment on NovaONE / NRW / DeFi Oracle (138)
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
          {loading ? <Spinner /> : 'Get quote + liquidity'}
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
            <div className="flex justify-between text-sm gap-3">
              <span className="text-nova-muted shrink-0">Liquidity</span>
              <span className="font-mono text-right text-nova-ink text-xs">{liqNote}</span>
            </div>
            <div className="flex justify-between text-sm gap-3">
              <span className="text-nova-muted shrink-0">Sentiment</span>
              <span className={`text-right text-xs font-medium ${sentimentClass}`}>
                {sentimentLine}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-nova-muted">Status</span>
              <span className="text-nova-ink">
                {stablePair
                  ? workable
                    ? 'Stable · swappable · transferable'
                    : 'Stable · thin — use Withdraw'
                  : workable
                    ? 'Mesh · swappable'
                    : 'Thin liquidity'}
              </span>
            </div>

            <a
              href={ECOSYSTEM_LINKS.novaSwap}
              target="_blank"
              rel="noreferrer"
              className={`flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold ${
                workable
                  ? 'bg-nova-accent text-nova-bg'
                  : 'bg-nova-surface-raised text-nova-muted pointer-events-none'
              }`}
            >
              {workable ? 'Execute on Nova Swap →' : 'Swap paused · thin sentiment'}
            </a>

            {stablePair && workable && activeAccount ? (
              <Button className="w-full" variant="ghost" onClick={queueStableSwap}>
                {queued ? 'Queued in History ✓' : 'Queue stable swap intent'}
              </Button>
            ) : null}

            <Link
              to={`${ROUTES.withdraw}?symbol=${encodeURIComponent(from)}&chainId=${activeChainId}`}
              className="block text-center text-[11px] text-nova-accent"
            >
              Or withdraw / transfer stable externally →
            </Link>
          </div>
        ) : null}
      </div>
    </>
  )
}
