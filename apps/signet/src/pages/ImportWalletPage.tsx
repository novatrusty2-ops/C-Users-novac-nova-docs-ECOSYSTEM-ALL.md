import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@/context/WalletContext'
import { ROUTES } from '@/lib/routes'
import { Button } from '@/components/common/Button'

type Tab = 'phrase' | 'key'

export function ImportWalletPage() {
  const navigate = useNavigate()
  const { importPhrase, importKey } = useWallet()
  const [tab, setTab] = useState<Tab>('phrase')
  const [password, setPassword] = useState('')
  const [phrase, setPhrase] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      if (tab === 'phrase') await importPhrase(phrase, password)
      else await importKey(privateKey, password)
      navigate(ROUTES.portfolio)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container max-w-md animate-fade-up">
      <h1 className="font-display text-3xl text-signet-gold-light">Import wallet</h1>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className={`btn-ghost flex-1 ${tab === 'phrase' ? 'border-signet-gold/50' : ''}`}
          onClick={() => setTab('phrase')}
        >
          Recovery phrase
        </button>
        <button
          type="button"
          className={`btn-ghost flex-1 ${tab === 'key' ? 'border-signet-gold/50' : ''}`}
          onClick={() => setTab('key')}
        >
          Private key
        </button>
      </div>
      <div className="mt-6 space-y-3">
        {tab === 'phrase' ? (
          <textarea
            className="input-field min-h-28"
            placeholder="Enter recovery phrase"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
          />
        ) : (
          <input
            className="input-field font-mono text-sm"
            placeholder="0x…"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
          />
        )}
        <input
          type="password"
          className="input-field"
          placeholder="Encryption password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button className="w-full" disabled={loading || !password} onClick={() => void submit()}>
          Import
        </Button>
      </div>
    </div>
  )
}
