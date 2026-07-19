import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { TopBar } from '@/components/layout/TopBar'
import { useWallet } from '@/context/WalletContext'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import { primaryChains } from '@/lib/chains'
import { ROUTES } from '@/lib/routes'

export function Portfolio() {
  const { activeAccount, refreshBalances } = useWallet()
  const { rows, loading, formattedTotal } = useTokenBalances()
  const { hideBalances } = useDisplaySettings()

  const meshRows = rows.filter((r) => primaryChains().some((c) => c.id === r.chainId))

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

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-nova-ink">NovaONE · NRW</h2>
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
                <li key={`${row.chainId}-${row.symbol}`} className="card-surface flex items-center gap-3">
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
