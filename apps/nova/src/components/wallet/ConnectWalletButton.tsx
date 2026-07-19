import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { ConnectWalletModal } from '@/components/wallet/ConnectWalletModal'
import { useWeb3 } from '@/context/Web3Context'

interface ConnectWalletButtonProps {
  className?: string
  label?: string
  variant?: 'primary' | 'ghost'
  onConnected?: () => void
}

export function ConnectWalletButton({
  className = '',
  label = 'Connect wallet',
  variant = 'primary',
  onConnected,
}: ConnectWalletButtonProps) {
  const [open, setOpen] = useState(false)
  const { connected, session, shortAddress, disconnectWallet } = useWeb3()

  if (connected && session) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-nova-surface px-3 py-2 text-xs font-mono text-nova-ink"
        >
          {session.walletName} · {shortAddress(session.address)}
        </button>
        <Button variant="ghost" className="text-xs px-3 py-2" onClick={disconnectWallet}>
          Disconnect
        </Button>
        <ConnectWalletModal open={open} onClose={() => setOpen(false)} onConnected={onConnected} />
      </div>
    )
  }

  return (
    <>
      <Button variant={variant} className={className} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ConnectWalletModal open={open} onClose={() => setOpen(false)} onConnected={onConnected} />
    </>
  )
}
