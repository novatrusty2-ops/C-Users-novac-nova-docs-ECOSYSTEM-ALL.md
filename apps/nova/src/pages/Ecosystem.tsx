import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { TopBar } from '@/components/layout/TopBar'
import { useToast } from '@/context/ToastContext'
import { useWallet } from '@/context/WalletContext'
import { useWeb3 } from '@/context/Web3Context'
import { CHAINS, defaultChainIds } from '@/lib/chains'
import { ECOSYSTEM_LINKS, PARTNERS } from '@/lib/partners'
import { setEnabledChainIds, getEnabledChainIds } from '@/lib/networks'
import { importEcosystemTokensFromMesh, loadUserTokens } from '@/lib/usertokens'
import { CopyButton } from '@/components/common/CopyButton'
import { ROUTES } from '@/lib/routes'
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton'

export function Ecosystem() {
  const { push } = useToast()
  const { activeAccount, refreshBalances, switchChain } = useWallet()
  const { connected, switchWalletChain } = useWeb3()
  const [tokenCount, setTokenCount] = useState(() => loadUserTokens().length)
  const [importing, setImporting] = useState(false)

  function enableAllEcosystemChains() {
    const ids = defaultChainIds()
    setEnabledChainIds([...new Set([...getEnabledChainIds(), ...ids])])
    push('All Nova ecosystem chains enabled', 'success')
  }

  async function selectChain(id: number) {
    if (connected) {
      try {
        await switchWalletChain(id)
        return
      } catch {
        /* fall through */
      }
    }
    switchChain(id)
  }

  function importMeshTokens(source: 'ecosystem' | 'pouchpay' = 'ecosystem') {
    setImporting(true)
    try {
      const result = importEcosystemTokensFromMesh(source)
      setTokenCount(result.total)
      push(
        result.added > 0
          ? `Imported ${result.added} tokens with price + liquidity`
          : `Priced catalog ready (${result.total} tokens)`,
        'success',
      )
      void refreshBalances()
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <TopBar title="Ecosystem" showNetwork={false} />
      <div className="page-container space-y-6">
        <section className="card-surface space-y-3">
          <h2 className="font-display text-sm font-semibold text-nova-ink">Nova mesh chains</h2>
          <p className="text-xs text-nova-muted">
            Enable every EVM network from the Nova Bank wallet registry (NovaONE, NRW, Production,
            DeFi Oracle, Anaka Bridge, Alltra / PouchPay).
          </p>
          <ul className="space-y-2">
            {CHAINS.filter((c) => c.isDefault).map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.iconColor }} />
                <button
                  type="button"
                  className="text-left text-nova-ink hover:text-nova-highlight"
                  onClick={() => void selectChain(c.id)}
                >
                  {c.name}
                  <span className="ml-2 text-xs text-nova-muted">{c.id}</span>
                </button>
              </li>
            ))}
          </ul>
          <ConnectWalletButton className="w-full" label="Connect Web3 wallet" />
          <Button className="w-full" onClick={enableAllEcosystemChains}>
            Enable all ecosystem chains
          </Button>
        </section>

        <section className="card-surface space-y-3">
          <h2 className="font-display text-sm font-semibold text-nova-ink">
            Import tokens · NovaONE, NRW & DeFi Oracle
          </h2>
          <p className="text-xs text-nova-muted">
            Pull curated tradable/transferable tokens for{' '}
            <span className="font-mono">22016</span>, <span className="font-mono">33001</span>, and{' '}
            <span className="font-mono">138</span> (stables USDC/USDT, mesh assets, custody ETH).
            Imported: {tokenCount}
          </p>
          <Button
            className="w-full"
            disabled={importing}
            onClick={() => importMeshTokens('ecosystem')}
          >
            Import mesh + custody tokens
          </Button>
        </section>


        <section className="card-surface space-y-4">
          <h2 className="font-display text-sm font-semibold text-nova-ink">Partner wallets</h2>
          {PARTNERS.map((p) => (
            <div key={p.id} className="rounded-xl border border-nova-border/60 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.accent }} />
                <p className="font-medium text-nova-ink">{p.name}</p>
              </div>
              <p className="text-xs text-nova-muted">{p.role}</p>
              <p className="text-xs text-nova-muted leading-relaxed">{p.notes}</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost text-xs py-1.5 px-3"
                >
                  Open {p.name}
                </a>
                {p.secondaryUrl ? (
                  <a
                    href={p.secondaryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost text-xs py-1.5 px-3"
                  >
                    Secondary
                  </a>
                ) : null}
                {p.id === 'pouchpay' ? (
                  <Button
                    variant="ghost"
                    className="text-xs"
                    onClick={() => {
                      setEnabledChainIds([...new Set([...getEnabledChainIds(), 651940])])
                      void selectChain(651940)
                      push('Alltra / PouchPay chain active', 'success')
                    }}
                  >
                    Use Alltra chain
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          {activeAccount ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-nova-muted truncate flex-1 font-mono">{activeAccount.address}</span>
              <CopyButton text={activeAccount.address} label="Copy for partners" />
            </div>
          ) : null}
        </section>

        <section className="card-surface space-y-2 text-xs text-nova-muted">
          <p className="font-medium text-nova-ink">Live APIs</p>
          <a className="block text-nova-highlight break-all" href={ECOSYSTEM_LINKS.walletNetworksApi}>
            wallet/networks
          </a>
          <a className="block text-nova-highlight break-all" href={ECOSYSTEM_LINKS.ecosystemTokensApi}>
            ecosystem/tokens
          </a>
          <a className="block text-nova-highlight" href={ECOSYSTEM_LINKS.novaSwap}>
            Nova Swap
          </a>
          <Link to={ROUTES.settings} className="block text-nova-accent pt-2">
            Network toggles → Settings
          </Link>
        </section>
      </div>
    </>
  )
}
