import { useWallet } from '@/context/WalletContext'
import { getChain } from '@/lib/chains'

interface NetworkPillProps {
  chainId?: number
  onClick?: () => void
}

export function NetworkPill({ chainId, onClick }: NetworkPillProps) {
  const { activeChainId } = useWallet()
  const id = chainId ?? activeChainId
  const chain = getChain(id)

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-nova-border bg-nova-surface px-3 py-1.5 text-xs font-medium text-nova-ink transition hover:border-nova-accent/50"
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: chain?.iconColor ?? 'var(--color-accent)' }}
      />
      {chain?.name ?? `Chain ${id}`}
    </button>
  )
}
