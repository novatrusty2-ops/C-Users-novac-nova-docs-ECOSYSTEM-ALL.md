import { useToast } from '@/context/ToastContext'

export function ToastStack() {
  const { toasts, dismiss } = useToast()

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`animate-fade-up max-w-sm rounded-lg border px-4 py-3 text-sm shadow-soft ${
            t.variant === 'error'
              ? 'border-signet-danger/40 bg-signet-burgundy-dark text-signet-ink'
              : t.variant === 'success'
                ? 'border-signet-success/40 bg-signet-surface text-signet-ink'
                : 'border-signet-border bg-signet-surface text-signet-ink-muted'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span>{t.message}</span>
            <button type="button" className="text-signet-ink-dim" onClick={() => dismiss(t.id)}>
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
