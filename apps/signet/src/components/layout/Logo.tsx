import { Link } from 'react-router-dom'
import { BRAND } from '@/lib/brand'
import { brandMarkUrl } from '@/lib/brand'

interface LogoProps {
  compact?: boolean
  className?: string
}

export function Logo({ compact, className = '' }: LogoProps) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={brandMarkUrl()}
        alt=""
        className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} rounded-lg ring-1 ring-signet-gold/30`}
      />
      {!compact ? (
        <span className="font-display text-xl tracking-wide text-signet-gold-light">
          {BRAND.shortName}
        </span>
      ) : null}
    </Link>
  )
}
