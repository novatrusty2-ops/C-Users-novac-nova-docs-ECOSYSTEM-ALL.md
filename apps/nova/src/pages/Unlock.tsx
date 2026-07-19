import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { TopBar } from '@/components/layout/TopBar'
import { useWallet } from '@/context/WalletContext'
import { ROUTES } from '@/lib/routes'

export function Unlock() {
  const navigate = useNavigate()
  const { hasWallet, unlockWallet } = useWallet()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await unlockWallet(password)
      navigate(ROUTES.portfolio)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unlock failed')
    } finally {
      setBusy(false)
    }
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
      <div className="page-container max-w-sm mx-auto">
        <p className="mb-6 text-sm text-nova-muted">Enter your password to access Nova Wallet.</p>
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
            {busy ? 'Unlocking…' : 'Unlock'}
          </Button>
        </form>
      </div>
    </div>
  )
}
