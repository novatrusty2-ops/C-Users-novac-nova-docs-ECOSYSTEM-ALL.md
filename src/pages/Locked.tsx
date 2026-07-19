import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@/context/WalletContext'
import { ROUTES } from '@/lib/routes'
import { Button } from '@/components/common/Button'
import { Logo } from '@/components/layout/Logo'

export function LockedPage() {
  const { unlockWallet } = useWallet()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      await unlockWallet(password)
      navigate(ROUTES.portfolio)
    } catch {
      setError('Wrong password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 animate-fade-up">
      <Logo />
      <h1 className="mt-8 font-display text-3xl text-signet-gold-light">Welcome back</h1>
      <p className="mt-2 text-sm text-signet-ink-muted">Enter your password to unlock Signet.</p>
      <div className="mt-8 w-full max-w-sm space-y-3">
        <input
          type="password"
          className="input-field"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void submit()}
        />
        {error ? <p className="text-sm text-signet-danger">{error}</p> : null}
        <Button className="w-full animate-pulse-gold" disabled={loading} onClick={() => void submit()}>
          Unlock
        </Button>
      </div>
    </div>
  )
}
