import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { TopBar } from '@/components/layout/TopBar'
import { useWallet } from '@/context/WalletContext'
import { ROUTES } from '@/lib/routes'

type Mode = 'create' | 'import'

export function Onboarding() {
  const navigate = useNavigate()
  const { create, importPhrase } = useWallet()
  const [mode, setMode] = useState<Mode>('create')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [phrase, setPhrase] = useState('')
  const [mnemonic, setMnemonic] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setBusy(true)
    try {
      if (mode === 'create') {
        const result = await create(password)
        setMnemonic(result.mnemonic)
      } else {
        await importPhrase(phrase, password)
        navigate(ROUTES.portfolio)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  if (mnemonic) {
    return (
      <div className="min-h-[100dvh]">
        <TopBar title="Backup phrase" showNetwork={false} backTo={ROUTES.home} />
        <div className="page-container space-y-4">
          <p className="text-sm text-nova-muted">
            Write down your recovery phrase. Anyone with it can access your funds.
          </p>
          <div className="card-surface font-mono text-sm leading-relaxed text-nova-highlight">
            {mnemonic}
          </div>
          <Button className="w-full" onClick={() => navigate(ROUTES.portfolio)}>
            I saved my phrase
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh]">
      <TopBar title="Set up wallet" showNetwork={false} backTo={ROUTES.home} />
      <div className="page-container">
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded-xl py-2 text-sm font-medium ${mode === 'create' ? 'bg-nova-surface text-nova-highlight border border-nova-accent/40' : 'text-nova-muted'}`}
            onClick={() => setMode('create')}
          >
            Create new
          </button>
          <button
            type="button"
            className={`flex-1 rounded-xl py-2 text-sm font-medium ${mode === 'import' ? 'bg-nova-surface text-nova-highlight border border-nova-accent/40' : 'text-nova-muted'}`}
            onClick={() => setMode('import')}
          >
            Import
          </button>
        </div>

        <form className="space-y-4" onSubmit={(e) => void submit(e)}>
          {mode === 'import' ? (
            <textarea
              className="input-field min-h-[120px]"
              placeholder="Enter recovery phrase"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              required
            />
          ) : null}
          <input
            className="input-field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            className="input-field"
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {error ? <p className="text-sm text-nova-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Working…' : mode === 'create' ? 'Create wallet' : 'Import wallet'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-nova-muted">
          Already have a wallet?{' '}
          <Link to={ROUTES.unlock} className="text-nova-highlight hover:underline">
            Unlock
          </Link>
        </p>
      </div>
    </div>
  )
}
