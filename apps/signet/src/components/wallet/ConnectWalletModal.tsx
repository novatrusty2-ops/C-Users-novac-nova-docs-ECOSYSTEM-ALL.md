import { useEffect } from 'react'
import { Modal } from '@/components/common/Modal'
import { useWeb3 } from '@/context/Web3Context'
import type { DiscoveredWallet } from '@/lib/web3'

interface ConnectWalletModalProps {
  open: boolean
  onClose: () => void
  onConnected?: () => void
}

export function ConnectWalletModal({ open, onClose, onConnected }: ConnectWalletModalProps) {
  const { wallets, refreshWallets, connectWallet, connecting, connected, session, shortAddress } =
    useWeb3()

  useEffect(() => {
    if (open) void refreshWallets()
  }, [open, refreshWallets])

  async function handlePick(wallet: DiscoveredWallet) {
    try {
      await connectWallet(wallet)
      onConnected?.()
      onClose()
    } catch {
      /* toast shown */
    }
  }

  return (
    <Modal open={open} title="Connect wallet" onClose={onClose}>
      <p className="mb-4 text-xs text-signet-ink-muted">
        MetaMask, Trust Wallet, SafePal, Gate Wallet, OKX, Coinbase, Rabby, Brave, Bitget, and other
        Web3 wallets.
      </p>

      {connected && session ? (
        <div className="mb-4 rounded-xl border border-signet-border bg-signet-bg-deep px-3 py-3 text-sm">
          <p className="font-medium text-signet-gold-light">{session.walletName}</p>
          <p className="mt-1 font-mono text-xs text-signet-ink-muted">
            {shortAddress(session.address)}
          </p>
        </div>
      ) : null}

      {connecting ? (
        <p className="py-8 text-center text-sm text-signet-ink-muted">Connecting…</p>
      ) : (
        <ul className="max-h-[55vh] space-y-1 overflow-y-auto">
          {wallets.map((w) => (
            <li key={w.option.id}>
              <button
                type="button"
                onClick={() => void handlePick(w)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-signet-bg-deep"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: w.option.accent }}
                >
                  {w.option.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-signet-ink">
                    {w.eip6963Name || w.option.name}
                  </span>
                  <span className="block text-xs text-signet-ink-muted">{w.option.subtitle}</span>
                </span>
                <span className="text-[11px] font-medium text-signet-gold">
                  {w.available || w.option.id === 'walletconnect' ? 'Connect' : 'Install'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
