import { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { setGateUnlocked } from '@/lib/institutionalGate'
import { useToast } from '@/context/ToastContext'

const GATE_URL = import.meta.env.VITE_GATE_URL ?? 'http://localhost:8787'

interface InstitutionalGateProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function InstitutionalGate({ open, onClose, onSuccess }: InstitutionalGateProps) {
  const { push } = useToast()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const verify = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${GATE_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (!res.ok) throw new Error('Invalid code')
      const data = (await res.json()) as { token: string }
      setGateUnlocked(data.token)
      push('Institutional access granted', 'success')
      onSuccess?.()
      onClose()
    } catch {
      push('Verification failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Institutional access">
      <p className="mb-3 text-sm text-signet-ink-muted">
        Enter your institutional access code to view private banking networks.
      </p>
      <input
        className="input-field mb-3"
        type="password"
        placeholder="Access code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <Button className="w-full" disabled={loading || !code} onClick={() => void verify()}>
        Verify
      </Button>
    </Modal>
  )
}
