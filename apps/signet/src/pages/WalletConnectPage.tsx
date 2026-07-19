import { Link } from 'react-router-dom'
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton'
import { ROUTES } from '@/lib/routes'

/** External Web3 connect surface (MetaMask / Trust / SafePal / Gate / …) */
export function WalletConnectPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4 animate-fade-up">
      <Link to={ROUTES.settingsConnections} className="text-sm text-signet-ink-muted hover:text-signet-gold">
        ← Connections
      </Link>
      <h1 className="font-display text-2xl text-signet-gold-light">Connect wallet</h1>
      <p className="text-sm text-signet-ink-muted">
        Connect a browser or mobile Web3 wallet to Signet — MetaMask, Trust, SafePal, Gate, and more.
      </p>
      <ConnectWalletButton className="w-full" label="Choose wallet" />
    </div>
  )
}
