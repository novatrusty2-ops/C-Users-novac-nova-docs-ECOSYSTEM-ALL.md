import { useState, type ReactNode } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'

interface PasswordGateProps {
  title?: string
  onUnlock: (password: string) => Promise<void>
  children: ReactNode
}

export function PasswordGate({ title = 'Enter password', onUnlock, children }: PasswordGateProps) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async () => {
    try {
      await onUnlock(password)
      setOpen(false)
      setPassword('')
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left">
        {children}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <input
          type="password"
          className="input-field mb-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {error ? <p className="mb-2 text-sm text-signet-danger">{error}</p> : null}
        <Button className="w-full" onClick={() => void submit()}>
          Continue
        </Button>
      </Modal>
    </>
  )
}
