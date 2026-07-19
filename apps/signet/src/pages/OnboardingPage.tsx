import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWallet } from '@/context/WalletContext'
import { ROUTES } from '@/lib/routes'
import { Button } from '@/components/common/Button'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { create } = useWallet()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [mnemonic, setMnemonic] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (password.length < 8) return
    if (password !== confirm) return
    setLoading(true)
    try {
      const result = await create(password)
      setMnemonic(result.mnemonic)
    } finally {
      setLoading(false)
    }
  }

  if (mnemonic) {
    return (
      <div className="page-container max-w-lg animate-fade-up">
        <h1 className="font-display text-3xl text-signet-gold-light">Save your phrase</h1>
        <p className="mt-2 text-sm text-signet-ink-muted">Write these words down offline. Never share them.</p>
        <div className="card-interactive mt-6 font-mono text-sm leading-relaxed">{mnemonic}</div>
        <Button className="mt-6 w-full" onClick={() => navigate(ROUTES.portfolio)}>
          Continue to wallet
        </Button>
      </div>
    )
  }

  return (
    <div className="page-container max-w-md animate-fade-up">
      <h1 className="font-display text-3xl text-signet-gold-light">Create wallet</h1>
      <p className="mt-2 text-sm text-signet-ink-muted">Choose a strong password to encrypt your keys locally.</p>
      <div className="mt-6 space-y-3">
        <input
          type="password"
          className="input-field"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          className="input-field"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button className="w-full" disabled={loading} onClick={() => void submit()}>
          Create wallet
        </Button>
        <p className="text-center text-sm text-signet-ink-dim">
          Already have a wallet?{' '}
          <Link to={ROUTES.import} className="text-signet-gold-light underline">
            Import
          </Link>
        </p>
      </div>
    </div>
  )
}
