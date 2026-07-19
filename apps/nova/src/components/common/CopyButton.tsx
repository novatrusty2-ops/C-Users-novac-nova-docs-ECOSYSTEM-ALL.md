import { useState } from 'react'
import { useToast } from '@/context/ToastContext'

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
}

export function CopyButton({ text, label = 'Copy', className = '' }: CopyButtonProps) {
  const { push } = useToast()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      push('Copied', 'success')
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      push('Copy failed', 'error')
    }
  }

  return (
    <button type="button" className={`btn-ghost text-sm ${className}`} onClick={() => void copy()}>
      {copied ? 'Copied' : label}
    </button>
  )
}
