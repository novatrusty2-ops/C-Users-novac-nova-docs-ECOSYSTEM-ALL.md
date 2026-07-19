import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import {
  custodyConfigured,
  fetchCoboWallets,
  fetchCustodyStatus,
  fetchDfnsWallets,
  type CustodyStatus,
  type CustodyWallet,
} from '@/lib/custodyApi'

function ProviderCard({
  title,
  ready,
  detail,
  wallets,
  loading,
  error,
  onRefresh,
}: {
  title: string
  ready: boolean
  detail?: string
  wallets: CustodyWallet[]
  loading: boolean
  error: string
  onRefresh: () => void
}) {
  return (
    <section className="rounded-xl bg-nova-surface px-4 py-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-nova-ink">{title}</h2>
          <p
            className={`mt-1 text-[11px] font-medium ${
              ready ? 'text-nova-accent' : 'text-nova-muted'
            }`}
          >
            {ready ? 'Connected' : 'Not configured'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || !ready}
          className="rounded-lg px-3 py-1.5 text-xs text-nova-muted transition hover:bg-nova-bg hover:text-nova-ink disabled:opacity-40"
        >
          {loading ? '…' : 'Refresh'}
        </button>
      </div>
      {detail ? <p className="font-mono text-[11px] text-nova-muted break-all">{detail}</p> : null}
      {error ? <p className="text-sm text-nova-danger">{error}</p> : null}
      {ready && wallets.length === 0 && !loading && !error ? (
        <p className="text-sm text-nova-muted">No wallets returned yet.</p>
      ) : null}
      <ul className="space-y-2">
        {wallets.map((w, i) => (
          <li
            key={w.id || w.address || `${w.name || 'wallet'}-${i}`}
            className="rounded-lg bg-nova-bg px-3 py-2.5"
          >
            <p className="text-sm font-semibold text-nova-ink">{w.name || w.id}</p>
            {w.address ? (
              <p className="mt-0.5 font-mono text-[11px] text-nova-muted break-all">{w.address}</p>
            ) : null}
            <p className="mt-0.5 text-[11px] text-nova-muted">
              {[w.network, w.type, w.subtype].filter(Boolean).join(' · ')}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Custody() {
  const [status, setStatus] = useState<CustodyStatus | null>(null)
  const [dfns, setDfns] = useState<{ wallets: CustodyWallet[]; loading: boolean; error: string }>({
    wallets: [],
    loading: false,
    error: '',
  })
  const [cobo, setCobo] = useState<{ wallets: CustodyWallet[]; loading: boolean; error: string }>({
    wallets: [],
    loading: false,
    error: '',
  })
  const [bootError, setBootError] = useState('')

  async function loadStatus() {
    if (!custodyConfigured()) {
      setStatus(null)
      setBootError('')
      return
    }
    try {
      setBootError('')
      setStatus(await fetchCustodyStatus())
    } catch (e) {
      setBootError(e instanceof Error ? e.message : String(e))
      setStatus(null)
    }
  }

  async function loadDfns() {
    setDfns((d) => ({ ...d, loading: true, error: '' }))
    try {
      const data = await fetchDfnsWallets()
      setDfns({ wallets: data.items || [], loading: false, error: '' })
    } catch (e) {
      setDfns({ wallets: [], loading: false, error: e instanceof Error ? e.message : String(e) })
    }
  }

  async function loadCobo() {
    setCobo((d) => ({ ...d, loading: true, error: '' }))
    try {
      const data = await fetchCoboWallets()
      setCobo({ wallets: data.items || [], loading: false, error: '' })
    } catch (e) {
      setCobo({ wallets: [], loading: false, error: e instanceof Error ? e.message : String(e) })
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  useEffect(() => {
    if (status?.dfns.ready) void loadDfns()
    if (status?.cobo.ready) void loadCobo()
  }, [status?.dfns.ready, status?.cobo.ready])

  return (
    <>
      <TopBar title="Custody" showNetwork={false} />
      <div className="page-container space-y-4">
        <header>
          <h1 className="font-display text-xl font-bold text-nova-ink">Institutional custody</h1>
          <p className="mt-1 text-sm text-nova-muted">
            DFNS MPC + Cobo WaaS — proxied through the Nova API. Keys never leave the server.
          </p>
        </header>

        {!custodyConfigured() ? (
          <div className="rounded-xl bg-nova-surface px-4 py-5 text-sm text-nova-muted space-y-2">
            <p>
              Set <code className="font-mono text-nova-accent">VITE_CUSTODY_API_URL</code> (e.g.{' '}
              <code className="font-mono text-nova-ink">http://127.0.0.1:8787</code>), then run{' '}
              <code className="font-mono text-nova-ink">npm run api:dev</code>.
            </p>
          </div>
        ) : (
          <>
            {bootError ? <p className="text-sm text-nova-danger">{bootError}</p> : null}
            <div className="space-y-3">
              <ProviderCard
                title="DFNS"
                ready={Boolean(status?.dfns.ready)}
                detail={status?.dfns.baseUrl}
                wallets={dfns.wallets}
                loading={dfns.loading}
                error={dfns.error}
                onRefresh={() => void loadDfns()}
              />
              <ProviderCard
                title="Cobo"
                ready={Boolean(status?.cobo.ready)}
                detail={status?.cobo.baseUrl}
                wallets={cobo.wallets}
                loading={cobo.loading}
                error={cobo.error}
                onRefresh={() => void loadCobo()}
              />
            </div>
          </>
        )}
      </div>
    </>
  )
}
