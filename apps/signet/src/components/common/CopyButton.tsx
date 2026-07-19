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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      push('Copied to clipboard', 'success')
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      push('Copy failed', 'error')
    }
  }

  return (
    <button type="button" onClick={copy} className={`btn-ghost text-xs py-1.5 px-3 ${className}`}>
      {copied ? 'Copied' : label}
    </button>
  )
}
