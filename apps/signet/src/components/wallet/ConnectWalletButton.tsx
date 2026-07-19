import { useState } from 'react'
import { ConnectWalletModal } from '@/components/wallet/ConnectWalletModal'
import { useWeb3 } from '@/context/Web3Context'

interface ConnectWalletButtonProps {
  className?: string
  label?: string
  onConnected?: () => void
}

export function ConnectWalletButton({
  className = '',
  label = 'Connect wallet',
  onConnected,
}: ConnectWalletButtonProps) {
  const [open, setOpen] = useState(false)
  const { connected, session, shortAddress, disconnectWallet } = useWeb3()

  if (connected && session) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-signet-border bg-signet-surface px-3 py-2 font-mono text-xs text-signet-ink"
        >
          {session.walletName} · {shortAddress(session.address)}
        </button>
        <button
          type="button"
          className="btn-ghost text-xs"
          onClick={disconnectWallet}
        >
          Disconnect
        </button>
        <ConnectWalletModal open={open} onClose={() => setOpen(false)} onConnected={onConnected} />
      </div>
    )
  }

  return (
    <>
      <button type="button" className={`btn-primary ${className}`} onClick={() => setOpen(true)}>
        {label}
      </button>
      <ConnectWalletModal open={open} onClose={() => setOpen(false)} onConnected={onConnected} />
    </>
  )
}
