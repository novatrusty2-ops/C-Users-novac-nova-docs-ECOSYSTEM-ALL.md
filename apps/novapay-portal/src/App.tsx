import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  getEvents,
  getManifest,
  getStatus,
  normalizeEvents,
  NovaPayEvent,
  NovaPayManifest,
  NovaPayStatus,
  postReceive,
  postSend,
  sandboxBase,
} from './api'

function stamp() {
  return Date.now().toString(36)
}

export default function App() {
  const [status, setStatus] = useState<NovaPayStatus | null>(null)
  const [manifest, setManifest] = useState<NovaPayManifest | null>(null)
  const [events, setEvents] = useState<NovaPayEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'receive' | 'send' | null>(null)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  const [receiveAmount, setReceiveAmount] = useState('10000.00')
  const [receiveCurrency, setReceiveCurrency] = useState('EUR')
  const [receiveRef, setReceiveRef] = useState(`NOVA-NOVAPAY-PORTAL-${stamp()}`)
  const [beneficiaryName, setBeneficiaryName] = useState('TOTAL DESIGN S.R.L.')
  const [beneficiaryIban, setBeneficiaryIban] = useState('LT163250079884101461')
  const [beneficiarySwift, setBeneficiarySwift] = useState('REVOLT21')
  const [intermediaryBic] = useState('CHASGB2L')

  const [sendAmount, setSendAmount] = useState('1000.00')
  const [sendCurrency, setSendCurrency] = useState('EUR')
  const [sendRef, setSendRef] = useState(`NOVA-TO-NOVAPAY-${stamp()}`)

  const refresh = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [st, mf, ev] = await Promise.all([getStatus(), getManifest(), getEvents()])
      if (!st.ok) throw new Error(`status HTTP ${st.status}`)
      setStatus(st.data)
      if (mf.ok) {
        setManifest(mf.data)
        // Keep TOTAL DESIGN S.R.L. settlement defaults; do not overwrite from API sample IBAN.
      }
      if (ev.ok) setEvents(normalizeEvents(ev.data).slice(0, 25))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function onReceive(e: FormEvent) {
    e.preventDefault()
    setBusy('receive')
    setMessage('')
    setError('')
    try {
      const body = {
        transactionType: 'payout',
        amount: String(receiveAmount),
        currency: receiveCurrency.toUpperCase(),
        reference: receiveRef,
        beneficiaryName,
        beneficiaryIban,
        beneficiarySwift,
      }
      const res = await postReceive(body)
      if (!res.ok) throw new Error(`receive HTTP ${res.status}: ${JSON.stringify(res.data)}`)
      setMessage(
        `Receive OK (${res.status}) · ${String(res.data.transactionId || res.data.reference || 'accepted')}`,
      )
      setReceiveRef(`NOVA-NOVAPAY-PORTAL-${stamp()}`)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault()
    setBusy('send')
    setMessage('')
    setError('')
    try {
      const body = {
        transactionType: 'payout',
        amount: String(sendAmount),
        currency: sendCurrency.toUpperCase(),
        reference: sendRef,
      }
      const res = await postSend(body)
      if (!res.ok) throw new Error(`send HTTP ${res.status}: ${JSON.stringify(res.data)}`)
      setMessage(
        `Send OK (${res.status}) · ${String(res.data.transactionId || res.data.status || 'completed')}`,
      )
      setSendRef(`NOVA-TO-NOVAPAY-${stamp()}`)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="shell">
      <header className="hero">
        <p className="banner">Sandbox · no live funds</p>
        <h1 className="brand">NovaPay</h1>
        <p className="tagline">
          Own portal for the Nova Bank partner sandbox — status, payout receive/send, and event
          stream on Railway.
        </p>
      </header>

      <div className="layout">
        <section className="surface">
          <h2>Live status</h2>
          {loading && !status ? <p className="msg">Loading…</p> : null}
          {status ? (
            <dl className="status-grid">
              <div className="stat">
                <dt>Partner</dt>
                <dd>{status.partner || '—'}</dd>
              </div>
              <div className="stat">
                <dt>Enabled</dt>
                <dd className={status.enabled ? 'ok' : 'bad'}>{String(status.enabled)}</dd>
              </div>
              <div className="stat">
                <dt>Mode</dt>
                <dd>{status.mode || '—'}</dd>
              </div>
              <div className="stat">
                <dt>Configured</dt>
                <dd className={status.configured ? 'ok' : 'bad'}>{String(status.configured)}</dd>
              </div>
              <div className="stat">
                <dt>Auth</dt>
                <dd>{status.authMethod || '—'}</dd>
              </div>
              <div className="stat">
                <dt>Institution</dt>
                <dd>{manifest?.institution || 'Nova Bank Online'}</dd>
              </div>
            </dl>
          ) : null}
          <div className="actions">
            <button type="button" className="secondary" onClick={() => void refresh()} disabled={!!busy}>
              Refresh
            </button>
          </div>
          {message ? <p className="msg ok">{message}</p> : null}
          {error ? <p className="msg bad">{error}</p> : null}
        </section>

        <section className="surface">
          <h2>Receive payout</h2>
          <form className="form-grid" onSubmit={onReceive}>
            <label>
              Amount
              <input value={receiveAmount} onChange={(e) => setReceiveAmount(e.target.value)} required />
            </label>
            <label>
              Currency
              <input value={receiveCurrency} onChange={(e) => setReceiveCurrency(e.target.value)} required />
            </label>
            <label>
              Reference
              <input value={receiveRef} onChange={(e) => setReceiveRef(e.target.value)} required />
            </label>
            <label>
              Beneficiary name
              <input value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} required />
            </label>
            <label>
              Beneficiary IBAN
              <input value={beneficiaryIban} onChange={(e) => setBeneficiaryIban(e.target.value)} required />
            </label>
            <label>
              Beneficiary SWIFT
              <input value={beneficiarySwift} onChange={(e) => setBeneficiarySwift(e.target.value)} required />
            </label>
            <label>
              Intermediary BIC
              <input value={intermediaryBic} readOnly />
            </label>
            <div className="actions">
              <button type="submit" disabled={busy !== null}>
                {busy === 'receive' ? 'Sending…' : 'POST /receive'}
              </button>
            </div>
          </form>
        </section>

        <section className="surface">
          <h2>Send (loopback)</h2>
          <form className="form-grid" onSubmit={onSend}>
            <label>
              Amount
              <input value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} required />
            </label>
            <label>
              Currency
              <input value={sendCurrency} onChange={(e) => setSendCurrency(e.target.value)} required />
            </label>
            <label>
              Reference
              <input value={sendRef} onChange={(e) => setSendRef(e.target.value)} required />
            </label>
            <p className="msg" style={{ marginTop: 0 }}>
              Send body excludes beneficiary fields (API rejects them on /send).
            </p>
            <div className="actions">
              <button type="submit" disabled={busy !== null}>
                {busy === 'send' ? 'Sending…' : 'POST /send'}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="surface events">
        <h2>Recent events</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Direction</th>
                <th>Status</th>
                <th>Reference</th>
                <th>Txn</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={4}>No events yet</td>
                </tr>
              ) : (
                events.map((ev, i) => (
                  <tr key={String(ev.transactionId || ev.reference || i)}>
                    <td>{String(ev.direction || '—')}</td>
                    <td>{String(ev.status || '—')}</td>
                    <td className="mono">
                      {String(ev.reference || ev.body?.reference || ev.payload?.reference || '—')}
                    </td>
                    <td className="mono">{String(ev.transactionId || '—')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="footer">
        API base: <code>{sandboxBase()}</code>
      </p>
    </div>
  )
}
