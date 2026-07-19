import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { TopBar } from '@/components/layout/TopBar'
import { TokenRow } from '@/components/tokens/TokenRow'
import { useWallet } from '@/context/WalletContext'
import { useToast } from '@/context/ToastContext'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import { ROUTES } from '@/lib/routes'
import { importEcosystemTokensFromMesh, loadUserTokens } from '@/lib/usertokens'
import { formatCompactUsd } from '@/lib/liquidity'

export function Portfolio() {
  const { activeAccount, refreshBalances } = useWallet()
  const { push } = useToast()
  const { rows, loading, formattedTotal, totalUsd } = useTokenBalances()
  const { hideBalances } = useDisplaySettings()
  const [imported, setImported] = useState(() => loadUserTokens().length)

  const meshRows = useMemo(() => {
    const ids = new Set([22016, 33001, 9001, 138, 11013, 651940])
    return [...rows]
      .filter((r) => ids.has(r.chainId))
      .sort((a, b) => {
        // NovaONE + NRW first, then by liquidity, then value
        const meshFirst = (id: number) => (id === 22016 || id === 33001 ? 0 : 1)
        const mf = meshFirst(a.chainId) - meshFirst(b.chainId)
        if (mf !== 0) return mf
        return (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0) || (b.usdValue ?? 0) - (a.usdValue ?? 0)
      })
  }, [rows])

  const focusRows = meshRows.filter((r) => r.chainId === 22016 || r.chainId === 33001)
  const totalLiq = focusRows.reduce((s, r) => s + (r.liquidityUsd ?? 0), 0)

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
      <TopBar />
      <div className="page-container space-y-6">
        <section className="animate-fade-up">
          <p className="text-xs uppercase tracking-wider text-nova-muted">Portfolio value</p>
          <p className="font-display text-4xl font-bold text-nova-ink mt-1">
            {hideBalances ? '••••••' : formattedTotal}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-nova-muted">
            <span>
              Mesh liq{' '}
              <span className="text-nova-accent font-mono">
                {hideBalances ? '••••' : formatCompactUsd(totalLiq)}
              </span>
            </span>
            <span>
              Assets{' '}
              <span className="text-nova-ink font-mono">{focusRows.length || meshRows.length}</span>
            </span>
            {!hideBalances && totalUsd > 0 ? (
              <span className="text-nova-muted">incl. spot value</span>
            ) : null}
          </div>
          {activeAccount ? (
            <p className="mt-2 font-mono text-xs text-nova-muted truncate">{activeAccount.address}</p>
          ) : null}
        </section>

        <div className="flex gap-2">
          <Link to={ROUTES.send} className="flex-1">
            <Button variant="ghost" className="w-full">
              Send
            </Button>
          </Link>
          <Link to={ROUTES.receive} className="flex-1">
            <Button variant="ghost" className="w-full">
              Receive
            </Button>
          </Link>
          <Link to={ROUTES.swap} className="flex-1">
            <Button className="w-full">
              Swap
            </Button>
          </Link>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1 text-xs" onClick={() => void handleImport()}>
            Import tokens + prices
          </Button>
          <Link to={ROUTES.ecosystem} className="flex-1">
            <Button variant="ghost" className="w-full text-xs">
              Ecosystem
            </Button>
          </Link>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-nova-ink">
              NovaONE · NRW liquidity
              {imported > 0 ? ` · ${imported}` : ''}
            </h2>
            <button
              type="button"
              className="text-xs text-nova-highlight"
              onClick={() => void refreshBalances()}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : meshRows.length === 0 ? (
            <div className="card-surface text-center space-y-3 py-6">
              <p className="text-sm text-nova-muted">No tokens yet. Import the mesh catalog with live prices.</p>
              <Button onClick={() => void handleImport()}>Import NovaONE + NRW tokens</Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {meshRows.map((row) => (
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
