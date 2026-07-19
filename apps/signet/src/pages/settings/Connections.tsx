import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton'
import { useWeb3 } from '@/context/Web3Context'
import { WALLET_CATALOG } from '@/lib/web3'

export function SettingsConnectionsPage() {
  const { connected, session, shortAddress } = useWeb3()

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="font-display text-2xl text-signet-gold-light">Connections</h1>
        <p className="mt-2 text-sm text-signet-ink-muted">
          Connect MetaMask, Trust Wallet, SafePal, Gate Wallet, and other Web3 wallets — or manage
          sessions alongside your Signet keystore.
        </p>
      </div>

      <section className="card-surface space-y-4">
        <h2 className="font-display text-lg text-signet-ink">Web3 wallet</h2>
        {connected && session ? (
          <p className="text-sm text-signet-ink-muted">
            Connected to <span className="text-signet-gold-light">{session.walletName}</span> ·{' '}
            <span className="font-mono">{shortAddress(session.address)}</span>
          </p>
        ) : (
          <p className="text-sm text-signet-ink-muted">No external wallet connected.</p>
        )}
        <ConnectWalletButton label="Connect Web3 wallet" />
      </section>

      <section className="card-surface space-y-3">
        <h2 className="font-display text-lg text-signet-ink">Supported wallets</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {WALLET_CATALOG.filter((w) => w.id !== 'walletconnect').map((w) => (
            <li
              key={w.id}
              className="flex items-center gap-2 rounded-lg border border-signet-border/60 px-3 py-2 text-sm"
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: w.accent }}
              >
                {w.name.slice(0, 2).toUpperCase()}
              </span>
              <span>
                <span className="block text-signet-ink">{w.name}</span>
                <span className="block text-[11px] text-signet-ink-muted">{w.subtitle}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
