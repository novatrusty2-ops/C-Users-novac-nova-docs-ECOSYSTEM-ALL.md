import { useWallet } from '@/context/WalletContext'
import { CopyButton } from '@/components/common/CopyButton'
import { NetworkSwitcher } from '@/components/wallet/NetworkSwitcher'

export function ReceivePage() {
  const { activeAccount, activeChain } = useWallet()
  const address = activeAccount?.address ?? ''

  return (
    <div className="page-container max-w-md animate-fade-up">
      <h1 className="font-display text-3xl text-signet-gold-light">Receive</h1>
      <p className="mt-1 text-sm text-signet-ink-muted">Share your address on {activeChain?.name}</p>
      <div className="mt-4">
        <NetworkSwitcher />
      </div>
      <div className="card-interactive mt-6 flex flex-col items-center gap-4 p-8">
        <div
          className="grid h-40 w-40 place-items-center rounded-xl border-2 border-signet-gold/40 bg-signet-bg-deep p-2"
          aria-label="Address QR placeholder"
        >
          <svg viewBox="0 0 100 100" className="h-full w-full text-signet-gold/80">
            <rect x="10" y="10" width="25" height="25" fill="currentColor" />
            <rect x="65" y="10" width="25" height="25" fill="currentColor" />
            <rect x="10" y="65" width="25" height="25" fill="currentColor" />
            <rect x="40" y="40" width="8" height="8" fill="currentColor" />
            <rect x="52" y="40" width="8" height="8" fill="currentColor" />
            <rect x="40" y="52" width="8" height="8" fill="currentColor" />
            <rect x="65" y="65" width="12" height="12" fill="currentColor" />
          </svg>
        </div>
        <p className="break-all text-center font-mono text-sm">{address}</p>
        <CopyButton text={address} label="Copy address" />
      </div>
    </div>
  )
}
