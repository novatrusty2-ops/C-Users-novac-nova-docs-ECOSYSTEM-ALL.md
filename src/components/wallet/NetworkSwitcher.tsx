import { useState } from 'react'
import { useChainData } from '@/hooks/useChainData'
import { useWallet } from '@/context/WalletContext'
import { Modal } from '@/components/common/Modal'

export function NetworkSwitcher() {
  const { visibleChains } = useChainData()
  const { activeChainId, switchChain } = useWallet()
  const [open, setOpen] = useState(false)
  const active = visibleChains.find((c) => c.id === activeChainId)

  return (
    <>
      <button type="button" className="btn-ghost text-xs py-1.5 gap-2" onClick={() => setOpen(true)}>
        {active ? (
          <>
            <span
              className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-black/20"
              style={{ backgroundColor: active.iconColor }}
            />
            {active.name}
          </>
        ) : (
          'Network'
        )}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Networks">
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {visibleChains.map((chain) => (
            <li key={chain.id}>
              <button
                type="button"
                className={`card-interactive flex w-full items-center gap-3 text-left ${
                  chain.id === activeChainId ? 'border-signet-gold/50' : ''
                }`}
                onClick={() => {
                  switchChain(chain.id)
                  setOpen(false)
                }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-signet-bg-deep"
                  style={{ backgroundColor: chain.iconColor }}
                >
                  {chain.nativeCurrency.symbol.slice(0, 2)}
                </span>
                <div>
                  <p className="font-medium">{chain.name}</p>
                  <p className="text-xs text-signet-ink-dim">Chain ID {chain.id}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  )
}
