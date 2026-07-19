import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  shimmer?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  shimmer,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    variant === 'primary'
      ? `btn-primary ${shimmer ? 'shimmer' : ''}`
      : variant === 'ghost'
        ? 'btn-ghost'
        : 'btn-ghost border-signet-danger/40 text-signet-danger hover:border-signet-danger'

  return (
    <button className={`${base} disabled:opacity-50 ${className}`} {...props}>
      {children}
    </button>
  )
}
