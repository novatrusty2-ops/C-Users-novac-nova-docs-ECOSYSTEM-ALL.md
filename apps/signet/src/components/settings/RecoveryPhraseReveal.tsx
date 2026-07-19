import { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { CopyButton } from '@/components/common/CopyButton'

interface RecoveryPhraseRevealProps {
  onReveal: (password: string) => Promise<string>
}

export function RecoveryPhraseReveal({ onReveal }: RecoveryPhraseRevealProps) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [phrase, setPhrase] = useState<string | null>(null)
  const [error, setError] = useState('')

  const reveal = async () => {
    try {
      const p = await onReveal(password)
      setPhrase(p)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Show recovery phrase
      </Button>
      <Modal open={open} onClose={() => { setOpen(false); setPhrase(null); setPassword('') }} title="Recovery phrase">
        {!phrase ? (
          <>
            <input
              type="password"
              className="input-field mb-2"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error ? <p className="mb-2 text-sm text-signet-danger">{error}</p> : null}
            <Button className="w-full" onClick={() => void reveal()}>
              Reveal
            </Button>
          </>
        ) : (
          <div className="card-interactive font-mono text-sm leading-relaxed">
            {phrase}
            <CopyButton text={phrase} className="mt-3" />
          </div>
        )}
      </Modal>
    </>
  )
}
