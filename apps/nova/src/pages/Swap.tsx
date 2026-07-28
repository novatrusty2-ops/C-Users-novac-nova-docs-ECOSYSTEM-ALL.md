import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { IconSwap } from '@/components/layout/icons'
import { TokenPicker } from '@/components/swap/TokenPicker'
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
import {
  ALLTRA_CHAIN_ID,
  MissingCallDataError,
  quotePouchpayRoute,
  type PouchpayRouteQuote,
} from '@/lib/pouchpay/routes'
import { LIVE_BUILD } from '@/lib/version'

type PickerSide = 'from' | 'to' | null

export function Swap() {
  const { activeChainId, activeAccount } = useWallet()
  const { connected, ensureActiveChain } = useWeb3()
  const symbols = swapableSymbols(activeChainId)
  const isAlltra = activeChainId === ALLTRA_CHAIN_ID
  const [from, setFrom] = useState(symbols[0] ?? 'USDC')
  const [to, setTo] = useState(symbols[1] ?? 'USDT')
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [pouchQuote, setPouchQuote] = useState<PouchpayRouteQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [liqNote, setLiqNote] = useState('')
  const [sentimentLine, setSentimentLine] = useState('')
  const [sentimentClass, setSentimentClass] = useState('text-nova-muted')
  const [workable, setWorkable] = useState(true)
  const [queued, setQueued] = useState(false)
  const [picker, setPicker] = useState<PickerSide>(null)

  useEffect(() => {
    const s = swapableSymbols(activeChainId)
    setFrom(s[0] ?? 'USDC')
    setTo(s[1] ?? 'USDT')
    setQuote(null)
    setPouchQuote(null)
    setQueued(false)
  }, [activeChainId])

  const stablePair = useMemo(() => isMeshStable(from) && isMeshStable(to), [from, to])

  function flip() {
    setFrom(to)
    setTo(from)
    setQuote(null)
    setPouchQuote(null)
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

      if (isAlltra) {
        const recipient = activeAccount?.address
        const pq = await quotePouchpayRoute(from, to, amount, {
          recipient,
          requireCallData: true,
        })
        setPouchQuote(pq)
        setQuote({
          fromSymbol: pq.fromSymbol,
          toSymbol: pq.toSymbol,
          amountIn: pq.amountIn,
          amountOut: pq.amountOut,
          feeBps: 30,
          feeAmount: '0',
          provider: 'internal',
          rate: Number(pq.amountOut) / Math.max(Number(pq.amountIn), 1e-12),
        })
        setWorkable(Boolean(pq.callData && pq.path.length >= 2))
        setSentimentClass('text-nova-success')
        setSentimentLine(
          pq.onChainLiquidity
            ? `Global Swap · callData ready · ${pq.method ?? 'router'}`
            : 'Global Swap · quote ok',
        )
        setLiqNote(`path ${pq.path.map((a) => a.slice(0, 6)).join(' → ')} · live ${LIVE_BUILD}`)
        return
      }

      setPouchQuote(null)
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
      setPouchQuote(null)
      if (err instanceof MissingCallDataError) {
        setError(
          'Global Swap missing callData — set VITE_POUCHPAY_API_BASE to pouchpay-bridge (31.195 / 31195)',
        )
      } else {
        setError(err instanceof Error ? err.message : 'Quote failed')
      }
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
      hash: pouchQuote
        ? `pouchpay:${pouchQuote.callData.slice(0, 18)}:${Date.now()}`
        : `sentiment:${activeChainId}:${quote.fromSymbol}-${quote.toSymbol}:${Date.now()}`,
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
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-nova-muted">
            {isAlltra
              ? 'ALLTRA Global Swap · inter-token routes with on-chain callData'
              : 'Stables swappable · liquidity + sentiment on NovaONE / NRW / DeFi Oracle (138)'}
            {activeAccount ? '' : ' · connect wallet to trade'}
          </p>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className={error ? 'text-[11px] text-nova-muted' : 'status-green-pill'}>
              live {LIVE_BUILD}
            </span>
            {error ? (
              <span className="text-[11px] font-semibold text-nova-danger">quote failed</span>
            ) : quote ? (
              <span className="status-http-200">HTTP 200</span>
            ) : (
              <span className="text-[11px] text-nova-muted">awaiting quote</span>
            )}
          </div>
        </div>

        <div className="relative space-y-2">
          <div className="rounded-xl bg-nova-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-nova-muted">From</span>
              <button
                type="button"
                className="token-picker-trigger"
                onClick={() => setPicker('from')}
              >
                {from}
                <span aria-hidden>▾</span>
              </button>
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
              <button type="button" className="token-picker-trigger" onClick={() => setPicker('to')}>
                {to}
                <span aria-hidden>▾</span>
              </button>
            </div>
            <p className="font-display text-3xl font-semibold text-nova-muted/70">
              {quote ? quote.amountOut : '0.00'}
            </p>
          </div>
        </div>

        <Button className="w-full" disabled={!amount || loading} onClick={() => void fetchQuote()}>
          {loading ? <Spinner /> : isAlltra ? 'Get Global Swap quote' : 'Get quote + liquidity'}
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
            {!isAlltra ? (
              <div className="flex justify-between text-sm">
                <span className="text-nova-muted">Fee</span>
                <span className="font-mono text-nova-ink">
                  {quote.feeAmount} {quote.fromSymbol} ({quote.feeBps / 100}%)
                </span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm gap-3">
              <span className="text-nova-muted shrink-0">{isAlltra ? 'Route' : 'Liquidity'}</span>
              <span className="font-mono text-right text-nova-ink text-xs">{liqNote}</span>
            </div>
            <div className="flex justify-between text-sm gap-3">
              <span className="text-nova-muted shrink-0">Sentiment</span>
              <span className={`text-right text-xs font-medium ${sentimentClass}`}>
                {sentimentLine}
              </span>
            </div>
            {pouchQuote ? (
              <div className="rounded-lg border border-nova-border bg-nova-bg px-3 py-2 text-[11px] font-mono text-nova-muted break-all">
                callData {pouchQuote.callData.slice(0, 42)}…
              </div>
            ) : null}
            <div className="flex justify-between text-sm items-center gap-3">
              <span className="text-nova-muted">Status</span>
              <span className={workable ? 'status-green-pill' : 'text-nova-danger text-xs'}>
                {isAlltra
                  ? workable
                    ? 'green · callData · HTTP 200'
                    : 'Global Swap · missing callData'
                  : stablePair
                    ? workable
                      ? 'green · stable · HTTP 200'
                      : 'Stable · thin — use Withdraw'
                    : workable
                      ? 'green · mesh · HTTP 200'
                      : 'Thin liquidity'}
              </span>
            </div>
            {workable ? (
              <div className="flex justify-between text-sm items-center">
                <span className="text-nova-muted">HTTP</span>
                <span className="status-http-200">200 OK</span>
              </div>
            ) : null}

            <a
              href={isAlltra ? ECOSYSTEM_LINKS.novaSwap : ECOSYSTEM_LINKS.novaSwap}
              target="_blank"
              rel="noreferrer"
              className={`flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold ${
                workable
                  ? 'bg-nova-accent text-nova-bg'
                  : 'bg-nova-surface-raised text-nova-muted pointer-events-none'
              }`}
            >
              {workable
                ? isAlltra
                  ? 'Open ALLTRA Global Swap →'
                  : 'Execute on Nova Swap →'
                : 'Swap paused · thin sentiment'}
            </a>

            {(stablePair || isAlltra) && workable && activeAccount ? (
              <Button className="w-full" variant="ghost" onClick={queueStableSwap}>
                {queued
                  ? 'Queued in History ✓'
                  : isAlltra
                    ? 'Queue Global Swap intent'
                    : 'Queue stable swap intent'}
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

      <TokenPicker
        open={picker === 'from'}
        title="Select from token"
        symbols={symbols}
        value={from}
        onClose={() => setPicker(null)}
        onSelect={(s) => {
          setFrom(s)
          setQuote(null)
          setPouchQuote(null)
        }}
      />
      <TokenPicker
        open={picker === 'to'}
        title="Select to token"
        symbols={symbols}
        value={to}
        onClose={() => setPicker(null)}
        onSelect={(s) => {
          setTo(s)
          setQuote(null)
          setPouchQuote(null)
        }}
      />
    </>
  )
}
