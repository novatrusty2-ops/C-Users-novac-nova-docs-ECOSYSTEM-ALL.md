import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center animate-fade-up">
      <p className="font-display text-2xl text-signet-gold-light">{title}</p>
      {description ? <p className="max-w-sm text-sm text-signet-ink-muted">{description}</p> : null}
      {action}
    </div>
  )
}
