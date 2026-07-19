import { Link, useParams } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { TokenChart } from '@/components/tokens/TokenChart'
import { TokenSkills } from '@/components/tokens/TokenSkills'
import { Button } from '@/components/common/Button'
import { findEcosystemToken } from '@/lib/ecosystemTokens'
import { formatCompactUsd, formatTokenPrice, meshLiquidity } from '@/lib/liquidity'
import { novaPlusChainLabel } from '@/lib/novaPlus'
import { findNovaPlusToken } from '@/lib/novaBankSync'
import { ROUTES } from '@/lib/routes'
import { buildTokenSkills } from '@/lib/tokenSkills'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import { useTokenBalances } from '@/hooks/useTokenBalances'

export function TokenDetail() {
  const { chainId: chainParam, symbol: symbolParam } = useParams()
  const chainId = Number(chainParam)
  const symbol = decodeURIComponent(symbolParam || '')
  const { rows } = useTokenBalances()
  const { hideBalances } = useDisplaySettings()

  const row = rows.find(
    (r) => r.chainId === chainId && r.symbol.toUpperCase() === symbol.toUpperCase(),
  )
  const eco = findEcosystemToken(chainId, symbol)
  const snap = findNovaPlusToken(symbol)
  const book = meshLiquidity(chainId, symbol)
  const mid = row?.usdPrice ?? eco?.usd ?? snap?.usd ?? null

  const profile = buildTokenSkills(
    {
      symbol,
      assetClass: eco?.assetClass || snap?.assetClass || 'crypto',
      tradable: eco?.tradable ?? snap?.tradable ?? true,
      swappable: eco?.swappable ?? snap?.swappable ?? true,
      transferable: eco?.transferable ?? snap?.transferable ?? true,
      decentralized: eco?.decentralized ?? snap?.decentralized ?? true,
    },
    chainId,
  )

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
      <TopBar
        title={`${symbol}`}
        backTo={ROUTES.portfolio}
        showNetwork={false}
      />
      <div className="page-container space-y-6">
        <header className="animate-fade-up">
          <p className="text-xs text-nova-muted">{novaPlusChainLabel(chainId)} · {chainId}</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-nova-ink">
            {eco?.name || snap?.name || symbol}
          </h1>
          <p className="mt-2 font-mono text-sm text-nova-muted">
            Bal{' '}
            {hideBalances
              ? '••••'
              : row?.balance ?? '0'}
            {row?.usdValue != null && !hideBalances
              ? ` · ${formatCompactUsd(row.usdValue)}`
              : ''}
          </p>
        </header>

        <TokenChart chainId={chainId} symbol={symbol} midPrice={mid} />

        <section className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-nova-surface px-3 py-3">
            <p className="text-[11px] text-nova-muted">Liquidity</p>
            <p className="mt-1 font-mono text-sm font-semibold text-nova-ink">
              {formatCompactUsd(row?.liquidityUsd ?? book?.liquidityUsd ?? 0)}
            </p>
          </div>
          <div className="rounded-xl bg-nova-surface px-3 py-3">
            <p className="text-[11px] text-nova-muted">24h volume</p>
            <p className="mt-1 font-mono text-sm font-semibold text-nova-ink">
              {formatCompactUsd(row?.volume24hUsd ?? book?.volume24hUsd ?? 0)}
            </p>
          </div>
          <div className="rounded-xl bg-nova-surface px-3 py-3">
            <p className="text-[11px] text-nova-muted">Price</p>
            <p className="mt-1 font-mono text-sm font-semibold text-nova-ink">
              {mid != null ? formatTokenPrice(mid) : '—'}
            </p>
          </div>
          <div className="rounded-xl bg-nova-surface px-3 py-3">
            <p className="text-[11px] text-nova-muted">Pair</p>
            <p className="mt-1 font-mono text-sm font-semibold text-nova-ink">
              {row?.pair ?? book?.pair ?? `${symbol}/USD`}
            </p>
          </div>
        </section>

        <TokenSkills profile={profile} />

        <div className="grid grid-cols-2 gap-3 pb-4">
          <Link to={ROUTES.send}>
            <Button className="w-full">Send</Button>
          </Link>
          <Link to={ROUTES.swap}>
            <Button variant="ghost" className="w-full">
              Trade
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
