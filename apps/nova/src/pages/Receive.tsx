import { TopBar } from '@/components/layout/TopBar'
import { CopyButton } from '@/components/common/CopyButton'
import { useWallet } from '@/context/WalletContext'
import { ROUTES } from '@/lib/routes'

export function Receive() {
  const { activeAccount } = useWallet()

  if (!activeAccount) {
    return null
  }

  return (
    <>
      <TopBar title="Receive" backTo={ROUTES.portfolio} />
      <div className="page-container space-y-6 text-center">
        <p className="text-sm text-nova-muted">
          Share your address to receive assets on NovaONE, NRW World, or enabled chains.
        </p>
        <div className="card-surface break-all font-mono text-sm text-nova-highlight">
          {activeAccount.address}
        </div>
        <CopyButton text={activeAccount.address} label="Copy address" className="mx-auto" />
      </div>
    </>
  )
}
