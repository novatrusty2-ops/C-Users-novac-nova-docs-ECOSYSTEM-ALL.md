import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { TopBar } from '@/components/layout/TopBar'
import { useWallet } from '@/context/WalletContext'
import { useToast } from '@/context/ToastContext'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import { ROUTES } from '@/lib/routes'
import { importEcosystemTokensFromMesh, loadUserTokens } from '@/lib/usertokens'
import { useState } from 'react'

export function Portfolio() {
  const { activeAccount, refreshBalances } = useWallet()
  const { push } = useToast()
  const { rows, loading, formattedTotal } = useTokenBalances()
  const { hideBalances } = useDisplaySettings()
  const [imported, setImported] = useState(() => loadUserTokens().length)

  const meshRows = rows.filter((r) => [22016, 33001, 9001, 138, 11013, 651940].includes(r.chainId))

  function handleImport() {
    const r = importEcosystemTokensFromMesh('ecosystem')
    setImported(r.total)
    push(r.added ? `Imported ${r.added} tokens (22016 + 33001)` : 'Tokens already imported', 'success')
    void refreshBalances()
  }

  return (
    <>
      <TopBar />
      <div className="page-container space-y-6">
        <section className="animate-fade-up">
          <p className="text-xs uppercase tracking-wider text-nova-muted">Total balance</p>
          <p className="font-display text-4xl font-bold text-nova-ink mt-1">
            {hideBalances ? '••••••' : formattedTotal}
          </p>
          {activeAccount ? (
            <p className="mt-2 font-mono text-xs text-nova-muted truncate">{activeAccount.address}</p>
          ) : null}
        </section>

        <div className="flex gap-2">
          <Link to={ROUTES.send} className="flex-1">
            <Button variant="ghost" className="w-full">Send</Button>
          </Link>
          <Link to={ROUTES.receive} className="flex-1">
            <Button variant="ghost" className="w-full">Receive</Button>
          </Link>
          <Link to={ROUTES.swap} className="flex-1">
            <Button className="w-full">Swap</Button>
          </Link>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1 text-xs" onClick={handleImport}>
            Import 22016/33001 tokens
          </Button>
          <Link to={ROUTES.ecosystem} className="flex-1">
            <Button variant="ghost" className="w-full text-xs">
              Ecosystem · Signet · PouchPay
            </Button>
          </Link>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-nova-ink">
              NovaONE · NRW {imported > 0 ? `· ${imported} imported` : ''}
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
            <p className="text-sm text-nova-muted py-4">No balances yet.</p>
          ) : (
            <ul className="space-y-2">
              {meshRows.map((row) => (
                <li
                  key={`${row.chainId}-${row.symbol}-${row.address ?? 'native'}`}
                  className="card-surface flex items-center gap-3"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: `${row.iconColor}22`, color: row.iconColor }}
                  >
                    {row.symbol.slice(0, 3)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-nova-ink">{row.symbol}</p>
                    <p className="text-xs text-nova-muted truncate">{row.chainName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-nova-ink">
                      {hideBalances ? '••••' : row.balance}
                    </p>
                    {!hideBalances && row.usdValue != null ? (
                      <p className="text-xs text-nova-muted">${row.usdValue.toFixed(2)}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
