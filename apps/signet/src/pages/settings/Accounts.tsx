import { useWallet } from '@/context/WalletContext'
import { shortAddress } from '@/lib/tokens'
import { Button } from '@/components/common/Button'

export function SettingsAccountsPage() {
  const { accounts, activeAccount, switchAccount, addDerivedAccount } = useWallet()

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl text-signet-gold-light">Accounts</h1>
      <ul className="mt-4 space-y-2">
        {accounts.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className={`card-interactive w-full text-left ${a.id === activeAccount?.id ? 'border-signet-gold/50' : ''}`}
              onClick={() => switchAccount(a.id)}
            >
              <p className="font-medium">{a.name}</p>
              <p className="font-mono text-xs text-signet-ink-dim">{shortAddress(a.address, 8)} · {a.kind}</p>
            </button>
          </li>
        ))}
      </ul>
      <Button variant="ghost" className="mt-4" onClick={() => addDerivedAccount(`Account ${accounts.length + 1}`)}>
        Add derived account
      </Button>
    </div>
  )
}
