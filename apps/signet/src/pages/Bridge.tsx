import { BridgePanel } from '@/components/bridge/BridgePanel'
import { BridgeHistory } from '@/components/bridge/BridgeHistory'
import { useBridge } from '@/hooks/useBridge'

export function BridgePage() {
  const { history } = useBridge()

  return (
    <div className="page-container grid gap-8 lg:grid-cols-2">
      <BridgePanel />
      <section>
        <h2 className="mb-4 font-display text-xl text-signet-gold-muted">History</h2>
        <BridgeHistory entries={history} />
      </section>
    </div>
  )
}
