import { Link, useParams } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { TokenChart } from '@/components/tokens/TokenChart'
import { Button } from '@/components/common/Button'
import { formatCompactUsd, formatTokenPrice, meshLiquidity, resolveLiquidityBook } from '@/lib/liquidity'
import { ROUTES } from '@/lib/routes'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { getChain } from '@/lib/chains'
import { defaultTokenFlags, isMeshStable } from '@/lib/tokenCapabilities'
import { scoreSentiment, sentimentTone } from '@/lib/sentiment'

export function TokenDetail() {
  const { chainId: chainParam, symbol: symbolParam } = useParams()
  const chainId = Number(chainParam)
  const symbol = decodeURIComponent(symbolParam || '')
  const { rows } = useTokenBalances()
  const { hideBalances } = useDisplaySettings()

  const row = rows.find(
    (r) => r.chainId === chainId && r.symbol.toUpperCase() === symbol.toUpperCase(),
  )
  const chain = getChain(chainId)
  const mid = row?.usdPrice ?? (isMeshStable(symbol) ? 1 : null)
  const { book, mode } = resolveLiquidityBook(chainId, symbol, mid ?? 1)
  const curated = meshLiquidity(chainId, symbol)
  const sentiment = scoreSentiment({
    liquidityUsd: row?.liquidityUsd ?? book.liquidityUsd,
    volume24hUsd: row?.volume24hUsd ?? book.volume24hUsd,
    isStable: isMeshStable(symbol),
    fromBook: mode === 'mesh',
  })
  const flags = defaultTokenFlags(chainId, {
    symbol,
    standard: row?.address ? 'erc20' : 'native',
    address: row?.address ?? null,
  })

  if (!Number.isFinite(chainId) || !symbol) {
    return (
      <>
        <TopBar title="Token" backTo={ROUTES.portfolio} showNetwork={false} />
        <div className="page-container">
          <p className="text-sm text-nova-muted">Token not found.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title={symbol} backTo={ROUTES.portfolio} showNetwork={false} />
      <div className="page-container space-y-6">
        <div>
          <p className="text-xs text-nova-muted">
            {chain?.name ?? `Chain ${chainId}`} ·{' '}
            {flags.tradable ? 'tradable' : 'view'} ·{' '}
            {flags.transferable ? 'transferable' : 'locked'}
            {isMeshStable(symbol) ? ' · stable' : ''}
          </p>
          <p className="mt-2 font-mono text-sm text-nova-ink">
            Balance{' '}
            {hideBalances ? '••••' : row?.balance ?? '0'}
            {!hideBalances && row?.usdValue != null ? (
              <span className="text-nova-muted">
                {' '}
                ·{' '}
                {row.usdValue >= 1000
                  ? formatCompactUsd(row.usdValue)
                  : formatTokenPrice(row.usdValue)}
              </span>
            ) : null}
          </p>
        </div>

        <TokenChart chainId={chainId} symbol={symbol} midPrice={mid} />

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-nova-surface px-4 py-3 text-xs">
          <div>
            <p className="text-nova-muted">
              {mode === 'mesh' ? 'Mesh liquidity' : 'Sentiment liquidity'}
            </p>
            <p className="mt-1 font-mono text-nova-accent">
              {formatCompactUsd(row?.liquidityUsd ?? book.liquidityUsd)}
            </p>
          </div>
          <div>
            <p className="text-nova-muted">24h volume</p>
            <p className="mt-1 font-mono text-nova-ink">
              {formatCompactUsd(row?.volume24hUsd ?? book.volume24hUsd)}
            </p>
          </div>
          <div>
            <p className="text-nova-muted">Sentiment</p>
            <p className={`mt-1 font-medium ${sentimentTone(sentiment.label)}`}>
              {sentiment.label} · {sentiment.score}
            </p>
          </div>
          <div>
            <p className="text-nova-muted">Rails</p>
            <p className="mt-1 font-mono text-nova-ink">
              {flags.swappable ? 'swap' : '—'} · {flags.transferable ? 'transfer' : 'locked'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-nova-muted">Pair · {mode}{curated ? '' : ' fallback'}</p>
            <p className="mt-1 font-mono text-nova-ink">{book.pair}</p>
            <p className="mt-1 text-nova-muted">{sentiment.headline}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link to={`${ROUTES.withdraw}?symbol=${encodeURIComponent(symbol)}&chainId=${chainId}`}>
            <Button className="w-full" variant="primary">
              Withdraw
            </Button>
          </Link>
          <Link to={ROUTES.swap}>
            <Button className="w-full" variant="ghost">
              Trade
            </Button>
          </Link>
        </div>
        <Link
          to={ROUTES.send}
          className="block text-center text-xs text-nova-accent hover:underline"
        >
          Or send on-chain →
        </Link>
      </div>
    </>
  )
}
