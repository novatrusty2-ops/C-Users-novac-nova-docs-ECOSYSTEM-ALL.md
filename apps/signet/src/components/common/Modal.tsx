import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-signet-bg-deep/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md animate-fade-up rounded-t-2xl border border-signet-border bg-signet-surface p-5 shadow-soft sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-signet-gold-light">{title}</h2>
          <button type="button" onClick={onClose} className="text-signet-ink-dim hover:text-signet-ink">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
