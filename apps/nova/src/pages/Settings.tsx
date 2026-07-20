import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { TopBar } from '@/components/layout/TopBar'
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton'
import { useWallet } from '@/context/WalletContext'
import { useWeb3 } from '@/context/Web3Context'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import { CHAINS } from '@/lib/chains'
import { getEnabledChainIds, toggleChain } from '@/lib/networks'
import { getAutolockMinutes, setAutolockMinutes } from '@/lib/settings'
import type { AutolockMinutes, DisplayCurrency } from '@/types'
import { ROUTES } from '@/lib/routes'
import { BRAND } from '@/lib/brand'
import { ECOSYSTEM_LINKS, PARTNERS } from '@/lib/partners'
import { importEcosystemTokensFromMesh, loadUserTokens } from '@/lib/usertokens'
import { useToast } from '@/context/ToastContext'

function Row({
  label,
  children,
  href,
  to,
}: {
  label: string
  children?: React.ReactNode
  href?: string
  to?: string
}) {
  const inner = (
    <div className="flex items-center justify-between gap-3 border-b border-nova-border px-4 py-3.5 last:border-0">
      <span className="text-sm text-nova-ink">{label}</span>
      <div className="flex items-center gap-2 text-sm text-nova-muted">{children ?? '›'}</div>
    </div>
  )
  if (to) return <Link to={to}>{inner}</Link>
  if (href)
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {inner}
      </a>
    )
  return inner
}

export function Settings() {
  const navigate = useNavigate()
  const { push } = useToast()
  const { lockWallet, wipeWallet, switchChain, activeChainId, refreshBalances, activeAccount } =
    useWallet()
  const { connected, session, shortAddress, switchWalletChain } = useWeb3()
  const { currency, hideBalances, updateCurrency, updateHideBalances } = useDisplaySettings()

  const [enabled, setEnabled] = useState(() => getEnabledChainIds())
  const [autolock, setAutolock] = useState<AutolockMinutes>(() => getAutolockMinutes())
  const [confirmWipe, setConfirmWipe] = useState(false)
  const [imported, setImported] = useState(() => loadUserTokens().length)

  async function handleToggleChain(id: number) {
    const next = toggleChain(id)
    setEnabled(next)
    if (!next.includes(id)) return
    if (connected) {
      try {
        await switchWalletChain(id)
      } catch {
        switchChain(id)
      }
    } else {
      switchChain(id)
    }
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
      <TopBar title="Me" showNetwork={false} />
      <div className="page-container space-y-4">
        {/* Profile header — OKX Me tab */}
        <section className="rounded-xl bg-nova-surface px-4 py-4 space-y-3">
          <div>
            <p className="font-display text-lg font-bold text-nova-ink">{BRAND.name}</p>
            <p className="mt-1 truncate font-mono text-xs text-nova-muted">
              {activeAccount?.address ?? 'No account'}
            </p>
            {connected && session ? (
              <p className="mt-1 text-xs text-nova-accent">
                Web3 · {session.walletName} · {shortAddress(session.address)}
              </p>
            ) : null}
          </div>
          <ConnectWalletButton
            className="w-full"
            variant={connected ? 'ghost' : 'primary'}
            label={connected ? 'Switch Web3 wallet' : 'Connect Web3 wallet'}
          />
        </section>

        <section className="overflow-hidden rounded-xl bg-nova-surface">
          <p className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-wider text-nova-muted">
            Nova Bank
          </p>
          <Row label="Ecosystem hub" to={ROUTES.ecosystem} />
          <Row label="Nova Bank dashboard" href={ECOSYSTEM_LINKS.novaBank} />
          <Row label="Nova Swap" href={ECOSYSTEM_LINKS.novaSwap} />
          <button type="button" className="w-full text-left" onClick={handleImportTokens}>
            <Row label={`Import mesh tokens (${imported})`} />
          </button>
        </section>

        <section className="overflow-hidden rounded-xl bg-nova-surface">
          <p className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-wider text-nova-muted">
            Partners
          </p>
          {PARTNERS.map((p) => (
            <Row key={p.id} label={p.name} href={p.url} />
          ))}
        </section>

        <section className="overflow-hidden rounded-xl bg-nova-surface">
          <p className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-wider text-nova-muted">
            Display
          </p>
          <Row label="Currency">
            <select
              className="bg-transparent text-right text-nova-ink outline-none"
              value={currency}
              onChange={(e) => updateCurrency(e.target.value as DisplayCurrency)}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </Row>
          <Row label="Hide balances">
            <input
              type="checkbox"
              checked={hideBalances}
              onChange={(e) => updateHideBalances(e.target.checked)}
            />
          </Row>
        </section>

        <section className="overflow-hidden rounded-xl bg-nova-surface">
          <p className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-wider text-nova-muted">
            Networks
          </p>
          {mesh.map((chain) => (
            <Row key={chain.id} label={chain.name}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`text-xs ${activeChainId === chain.id ? 'text-nova-accent' : 'text-nova-muted'}`}
                  onClick={() => void (connected ? switchWalletChain(chain.id) : switchChain(chain.id))}
                >
                  {activeChainId === chain.id ? 'Active' : 'Use'}
                </button>
                <input
                  type="checkbox"
                  checked={enabled.includes(chain.id)}
                  onChange={() => void handleToggleChain(chain.id)}
                />
              </div>
            </Row>
          ))}
          {optional.map((chain) => (
            <Row key={chain.id} label={`${chain.name} (opt)`}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`text-xs ${activeChainId === chain.id ? 'text-nova-accent' : 'text-nova-muted'}`}
                  onClick={() => void (connected ? switchWalletChain(chain.id) : switchChain(chain.id))}
                >
                  {activeChainId === chain.id ? 'Active' : 'Use'}
                </button>
                <input
                  type="checkbox"
                  checked={enabled.includes(chain.id)}
                  onChange={() => void handleToggleChain(chain.id)}
                />
              </div>
            </Row>
          ))}
          <Row label="Active chain ID">{activeChainId}</Row>
        </section>

        <section className="overflow-hidden rounded-xl bg-nova-surface">
          <p className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-wider text-nova-muted">
            Security
          </p>
          <Row label="Auto-lock">
            <select
              className="bg-transparent text-right text-nova-ink outline-none"
              value={autolock}
              onChange={(e) => handleAutolock(Number(e.target.value) as AutolockMinutes)}
            >
              <option value={0}>Off</option>
              <option value={1}>1m</option>
              <option value={5}>5m</option>
              <option value={15}>15m</option>
              <option value={30}>30m</option>
            </select>
          </Row>
          <button type="button" className="w-full text-left" onClick={lockWallet}>
            <Row label="Lock wallet" />
          </button>
          <button type="button" className="w-full text-left" onClick={() => setConfirmWipe(true)}>
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="text-sm text-nova-danger">Remove wallet</span>
              <span className="text-nova-danger">›</span>
            </div>
          </button>
        </section>

        <p className="pb-4 text-center text-[11px] text-nova-muted">
          {BRAND.bundleId}

        </p>
      </div>

      <Modal open={confirmWipe} title="Remove wallet?" onClose={() => setConfirmWipe(false)}>
        <p className="mb-4 text-sm text-nova-muted">
          This deletes the encrypted keystore from this device. Back up your recovery phrase first.
        </p>
        <Button variant="danger" className="w-full" onClick={handleWipe}>
          Remove permanently
        </Button>
      </Modal>
    </>
  )
}
