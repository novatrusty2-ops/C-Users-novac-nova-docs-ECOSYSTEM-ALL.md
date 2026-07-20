import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { IconEye } from '@/components/layout/icons'
import { TopBar } from '@/components/layout/TopBar'
import { TokenRow } from '@/components/tokens/TokenRow'
import { QuickActions } from '@/components/wallet/QuickActions'
import { useWallet } from '@/context/WalletContext'
import { useToast } from '@/context/ToastContext'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import { ROUTES } from '@/lib/routes'
import { ECOSYSTEM_LINKS } from '@/lib/partners'
import { importEcosystemTokensFromMesh, loadUserTokens } from '@/lib/usertokens'
import { formatCompactUsd } from '@/lib/liquidity'

type AssetTab = 'crypto' | 'mesh'

export function Portfolio() {
  const { activeAccount, refreshBalances } = useWallet()
  const { push } = useToast()
  const { rows, loading, formattedTotal, totalUsd } = useTokenBalances()
  const { hideBalances, toggleHideBalances } = useDisplaySettings()
  const [imported, setImported] = useState(() => loadUserTokens().length)
  const [tab, setTab] = useState<AssetTab>('crypto')

  const meshRows = useMemo(() => {
    const ids = new Set([22016, 33001, 9001, 138, 11013, 651940])
    return [...rows]
      .filter((r) => ids.has(r.chainId))
      .sort((a, b) => {
        const meshFirst = (id: number) => (id === 22016 || id === 33001 ? 0 : 1)
        const mf = meshFirst(a.chainId) - meshFirst(b.chainId)
        if (mf !== 0) return mf
        return (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0) || (b.usdValue ?? 0) - (a.usdValue ?? 0)
      })
  }, [rows])

  // Mesh tab: NovaONE + NRW + DeFi Oracle (138) — keep custody liquidity/value in totals
  const focusRows = meshRows.filter(
    (r) => r.chainId === 22016 || r.chainId === 33001 || r.chainId === 138,
  )
  const totalLiq = focusRows.reduce((s, r) => s + (r.liquidityUsd ?? 0), 0)
  const listRows = tab === 'mesh' ? focusRows : meshRows

  async function handleImport() {
    const r = importEcosystemTokensFromMesh('ecosystem')
    setImported(r.total)
    push(
      r.added
        ? `Imported ${r.added} tokens with prices & liquidity`
        : `Refreshed ${r.total} priced tokens`,
      'success',
    )
    await refreshBalances()
  }

  return (
    <>
      <TopBar variant="assets" />
      <div className="page-container space-y-5">
        {/* Nova Bank–style balance hero */}
        <section className="animate-fade-up pt-1">
          <div className="flex items-center gap-2">
            <p className="text-sm text-nova-muted">Total assets</p>
            <button
              type="button"
              onClick={toggleHideBalances}
              className="text-nova-muted hover:text-nova-ink"
              aria-label={hideBalances ? 'Show balances' : 'Hide balances'}
            >
              <IconEye className="h-4 w-4" off={hideBalances} />
            </button>
          </div>
          <p className="mt-1 font-display text-[2.35rem] font-bold leading-none tracking-tight text-nova-ink">
            {hideBalances ? '••••••' : formattedTotal}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-nova-muted">
            <span>
              Mesh liq{' '}
              <span className="font-mono text-nova-accent">
                {hideBalances ? '••••' : formatCompactUsd(totalLiq)}
              </span>
            </span>
            <span>
              {listRows.length} assets
              {!hideBalances && totalUsd > 0 ? ' · spot' : ''}
            </span>
          </div>
          {activeAccount ? (
            <p className="mt-2 truncate font-mono text-[11px] text-nova-muted/80">
              {activeAccount.address}
            </p>
          ) : null}
        </section>

        <QuickActions />

        {/* Markets strip — Nova Bank dashboard cue */}
        <a
          href={ECOSYSTEM_LINKS.novaBank}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-xl bg-nova-surface px-4 py-3 transition hover:bg-nova-surface-raised"
        >
          <div>
            <p className="text-sm font-semibold text-nova-ink">Nova Bank</p>
            <p className="text-xs text-nova-muted">Dashboard · networks · settlement</p>
          </div>
          <span className="text-xs font-medium text-nova-accent">Open →</span>
        </a>

        <section>
          <div className="okx-segment mb-1">
            <button
              type="button"
              className="okx-segment-btn"
              data-active={tab === 'crypto'}
              onClick={() => setTab('crypto')}
            >
              Crypto
            </button>
            <button
              type="button"
              className="okx-segment-btn"
              data-active={tab === 'mesh'}
              onClick={() => setTab('mesh')}
            >
              NovaONE · NRW
            </button>
          </div>

          <div className="mb-1 flex items-center justify-between px-0.5 pt-3">
            <p className="text-xs text-nova-muted">
              {imported > 0 ? `${imported} listed` : 'Assets'}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-xs text-nova-accent"
                onClick={() => void handleImport()}
              >
                Import
              </button>
              <button
                type="button"
                className="text-xs text-nova-muted hover:text-nova-ink"
                onClick={() => void refreshBalances()}
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : listRows.length === 0 ? (
            <div className="rounded-xl bg-nova-surface px-4 py-8 text-center">
              <p className="text-sm text-nova-muted">No assets yet. Import the mesh catalog.</p>
              <Button className="mt-4" onClick={() => void handleImport()}>
                Import tokens
              </Button>
              <Link
                to={ROUTES.ecosystem}
                className="mt-3 block text-xs text-nova-accent hover:underline"
              >
                Ecosystem hub
              </Link>
            </div>
          ) : (
            <ul className="token-list">
              {listRows.map((row) => (
                <TokenRow
                  key={`${row.chainId}-${row.symbol}-${row.address ?? 'native'}`}
                  row={row}
                  hideBalances={hideBalances}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
