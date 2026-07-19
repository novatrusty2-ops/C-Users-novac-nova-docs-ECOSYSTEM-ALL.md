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
      className="inline-flex items-center gap-1.5 rounded-full bg-nova-surface px-2.5 py-1.5 text-[11px] font-medium text-nova-ink transition hover:bg-nova-surface-raised"
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: chain?.iconColor ?? 'var(--color-accent)' }}
      />
      <span className="max-w-[6.5rem] truncate">{chain?.name ?? `Chain ${id}`}</span>
    </button>
  )
}
