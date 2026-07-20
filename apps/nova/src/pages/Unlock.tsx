import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { TopBar } from '@/components/layout/TopBar'
import { useWallet } from '@/context/WalletContext'
import { ROUTES } from '@/lib/routes'
import { NOVA_DESTINATION_ADDRESS } from '@/lib/destination'

export function Unlock() {
  const navigate = useNavigate()
  const { hasWallet, unlockWallet } = useWallet()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function unlock(then: 'portfolio' | 'send-all') {
    setError('')
    setBusy(true)
    try {
      await unlockWallet(password)
      if (then === 'send-all') {
        navigate(`${ROUTES.send}?sweep=1`)
      } else {
        navigate(ROUTES.portfolio)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unlock failed')
    } finally {
      setBusy(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await unlock('portfolio')
  }

  if (!hasWallet) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-nova-muted">No wallet found on this device.</p>
        <Link to={ROUTES.onboarding}>
          <Button>Create wallet</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh]">
      <TopBar title="Unlock" showNetwork={false} backTo={ROUTES.home} />
      <div className="page-container max-w-sm mx-auto space-y-4">
        <p className="text-sm text-nova-muted">Enter your password to access Nova Wallet.</p>
        <form className="space-y-4" onSubmit={(e) => void submit(e)}>
          <input
            className="input-field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
          {error ? <p className="text-sm text-nova-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Unlocking…' : '1 · Unlock'}
          </Button>
        </form>

        <div className="rounded-xl bg-nova-surface px-4 py-4 space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-nova-muted">Send all</p>
          <p className="font-mono text-[11px] text-nova-ink break-all">{NOVA_DESTINATION_ADDRESS}</p>
          <Button
            type="button"
            className="w-full"
            disabled={busy || !password}
            onClick={() => void unlock('send-all')}
          >
            {busy ? 'Unlocking…' : '1+2 · Unlock & send all'}
          </Button>
          <p className="text-[11px] text-nova-muted">
            Unlocks, opens Send, and prepares the sweep to your Nova destination (you confirm once).
          </p>
        </div>
      </div>
    </div>
  )
}
