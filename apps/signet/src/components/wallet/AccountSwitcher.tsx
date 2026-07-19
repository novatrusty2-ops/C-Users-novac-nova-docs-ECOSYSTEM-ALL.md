import { useState } from 'react'
import { useWallet } from '@/context/WalletContext'
import { shortAddress } from '@/lib/tokens'
import { Modal } from '@/components/common/Modal'

export function AccountSwitcher() {
  const { accounts, activeAccount, switchAccount } = useWallet()
  const [open, setOpen] = useState(false)

  if (!activeAccount) return null

  return (
    <>
      <button type="button" className="btn-ghost text-xs py-1.5" onClick={() => setOpen(true)}>
        {activeAccount.name} · {shortAddress(activeAccount.address)}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Accounts">
        <ul className="space-y-2">
          {accounts.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className={`card-interactive w-full text-left ${
                  a.id === activeAccount.id ? 'border-signet-gold/50' : ''
                }`}
                onClick={() => {
                  switchAccount(a.id)
                  setOpen(false)
                }}
              >
                <p className="font-medium text-signet-ink">{a.name}</p>
                <p className="font-mono text-xs text-signet-ink-dim">{shortAddress(a.address, 6)}</p>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  )
}
