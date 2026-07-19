import { useWallet } from '@/context/WalletContext'
import { Button } from '@/components/common/Button'
import { clearBridgeHistory } from '@/lib/bridge/history'

export function SettingsAdvancedPage() {
  const { refreshBalances } = useWallet()

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="font-display text-2xl text-signet-gold-light">Advanced</h1>
      <Button variant="ghost" onClick={() => void refreshBalances()}>Refresh balances</Button>
      <Button variant="ghost" onClick={() => clearBridgeHistory()}>Clear bridge history</Button>
    </div>
  )
}
