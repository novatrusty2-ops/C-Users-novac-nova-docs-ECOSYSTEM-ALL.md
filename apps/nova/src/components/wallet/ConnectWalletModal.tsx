import { useEffect } from 'react'
import { Modal } from '@/components/common/Modal'
import { Spinner } from '@/components/common/Spinner'
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
      // toast already shown
    }
  }

  return (
    <Modal open={open} title="Connect wallet" onClose={onClose}>
      <p className="mb-4 text-xs text-nova-muted">
        MetaMask, Trust, SafePal, Gate, OKX, Coinbase, Rabby, Brave, Bitget, and other Web3 wallets.
      </p>

      {connected && session ? (
        <div className="mb-4 rounded-xl bg-nova-bg px-3 py-3 text-sm">
          <p className="text-nova-accent font-medium">{session.walletName}</p>
          <p className="font-mono text-xs text-nova-muted mt-1">{shortAddress(session.address)}</p>
        </div>
      ) : null}

      {connecting ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <ul className="max-h-[55vh] space-y-1 overflow-y-auto">
          {wallets.map((w) => (
            <li key={w.option.id}>
              <button
                type="button"
                onClick={() => void handlePick(w)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-nova-bg"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: w.option.accent }}
                >
                  {w.option.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-nova-ink">
                    {w.eip6963Name || w.option.name}
                  </span>
                  <span className="block text-xs text-nova-muted">{w.option.subtitle}</span>
                </span>
                <span
                  className={`text-[11px] font-medium ${
                    w.available || w.option.id === 'walletconnect'
                      ? 'text-nova-accent'
                      : 'text-nova-muted'
                  }`}
                >
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
