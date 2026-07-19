import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { TopBar } from '@/components/layout/TopBar'
import { useWallet } from '@/context/WalletContext'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import { CHAINS } from '@/lib/chains'
import { getEnabledChainIds, toggleChain } from '@/lib/networks'
import { getAutolockMinutes, setAutolockMinutes } from '@/lib/settings'
import type { AutolockMinutes, DisplayCurrency } from '@/types'
import { ROUTES } from '@/lib/routes'
import { BRAND } from '@/lib/brand'
import { PARTNERS } from '@/lib/partners'
import { importEcosystemTokensFromMesh, loadUserTokens } from '@/lib/usertokens'
import { useToast } from '@/context/ToastContext'

export function Settings() {
  const navigate = useNavigate()
  const { push } = useToast()
  const { lockWallet, wipeWallet, switchChain, activeChainId, refreshBalances } = useWallet()
  const { currency, hideBalances, updateCurrency, updateHideBalances } = useDisplaySettings()
  const [enabled, setEnabled] = useState(() => getEnabledChainIds())
  const [autolock, setAutolock] = useState<AutolockMinutes>(() => getAutolockMinutes())
  const [confirmWipe, setConfirmWipe] = useState(false)
  const [imported, setImported] = useState(() => loadUserTokens().length)

  function handleToggleChain(id: number) {
    const next = toggleChain(id)
    setEnabled(next)
    if (next.includes(id)) switchChain(id)
  }

  function handleAutolock(m: AutolockMinutes) {
    setAutolockMinutes(m)
    setAutolock(m)
  }

  function handleWipe() {
    wipeWallet()
    setConfirmWipe(false)
    navigate(ROUTES.home)
  }

  function handleImportTokens() {
    const r = importEcosystemTokensFromMesh('ecosystem')
    setImported(r.total)
    push(r.added ? `Imported ${r.added} mesh tokens` : 'Mesh tokens already present', 'success')
    void refreshBalances()
  }

  const mesh = CHAINS.filter((c) => !c.isOptional)
  const optional = CHAINS.filter((c) => c.isOptional)

  return (
    <>
      <TopBar title="Settings" showNetwork={false} />
      <div className="page-container space-y-6">
        <section className="card-surface space-y-3">
          <h2 className="font-display text-sm font-semibold text-nova-ink">Ecosystem</h2>
          <Link to={ROUTES.ecosystem} className="btn-primary w-full text-center block py-2.5 rounded-lg">
            Open ecosystem hub
          </Link>
          <Button variant="ghost" className="w-full" onClick={handleImportTokens}>
            Import NovaONE + NRW tokens ({imported})
          </Button>
          <div className="flex flex-wrap gap-2">
            {PARTNERS.map((p) => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost text-xs py-1.5 px-3"
                style={{ borderColor: `${p.accent}55` }}
              >
                {p.name}
              </a>
            ))}
          </div>
        </section>

        <section className="card-surface space-y-3">
          <h2 className="font-display text-sm font-semibold text-nova-ink">Display</h2>
          <label className="flex items-center justify-between text-sm">
            <span className="text-nova-muted">Currency</span>
            <select
              className="input-field w-auto"
              value={currency}
              onChange={(e) => updateCurrency(e.target.value as DisplayCurrency)}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="text-nova-muted">Hide balances</span>
            <input
              type="checkbox"
              checked={hideBalances}
              onChange={(e) => updateHideBalances(e.target.checked)}
            />
          </label>
        </section>

        <section className="card-surface space-y-3">
          <h2 className="font-display text-sm font-semibold text-nova-ink">Networks</h2>
          <p className="text-xs text-nova-muted">Nova ecosystem (always available):</p>
          {mesh.map((chain) => (
            <label key={chain.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: chain.iconColor }} />
                {chain.name}
                {chain.partner === 'pouchpay' ? (
                  <span className="text-[10px] text-nova-muted">PouchPay</span>
                ) : null}
              </span>
              <input
                type="checkbox"
                checked={enabled.includes(chain.id)}
                onChange={() => handleToggleChain(chain.id)}
              />
            </label>
          ))}
          <p className="text-xs text-nova-muted pt-2">Optional public chains:</p>
          {optional.map((chain) => (
            <label key={chain.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: chain.iconColor }} />
                {chain.name}
              </span>
              <input
                type="checkbox"
                checked={enabled.includes(chain.id)}
                onChange={() => handleToggleChain(chain.id)}
              />
            </label>
          ))}
          <p className="text-xs text-nova-muted">Active chain: {activeChainId}</p>
        </section>

        <section className="card-surface space-y-3">
          <h2 className="font-display text-sm font-semibold text-nova-ink">Security</h2>
          <label className="flex items-center justify-between text-sm">
            <span className="text-nova-muted">Auto-lock (minutes)</span>
            <select
              className="input-field w-auto"
              value={autolock}
              onChange={(e) => handleAutolock(Number(e.target.value) as AutolockMinutes)}
            >
              <option value={0}>Off</option>
              <option value={1}>1</option>
              <option value={5}>5</option>
              <option value={15}>15</option>
              <option value={30}>30</option>
            </select>
          </label>
          <Button variant="ghost" className="w-full" onClick={lockWallet}>
            Lock wallet
          </Button>
          <Button variant="danger" className="w-full" onClick={() => setConfirmWipe(true)}>
            Remove wallet
          </Button>
        </section>

        <section className="text-center text-xs text-nova-muted pb-4">
          <p>{BRAND.name}</p>
          <p>{BRAND.bundleId}</p>
        </section>
      </div>

      <Modal open={confirmWipe} title="Remove wallet?" onClose={() => setConfirmWipe(false)}>
        <p className="text-sm text-nova-muted mb-4">
          This deletes the encrypted keystore from this device. Back up your recovery phrase first.
        </p>
        <Button variant="danger" className="w-full" onClick={handleWipe}>
          Remove permanently
        </Button>
      </Modal>
    </>
  )
}
