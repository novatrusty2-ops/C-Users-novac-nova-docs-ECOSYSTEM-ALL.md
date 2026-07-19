import { Link } from 'react-router-dom'
import { useWallet } from '@/context/WalletContext'
import { ROUTES } from '@/lib/routes'

export function ConnectButton() {
  const { unlocked, hasWallet } = useWallet()

  if (unlocked) {
    return (
      <Link to={ROUTES.portfolio} className="btn-primary text-xs py-1.5 px-3 animate-pulse-gold">
        Open
      </Link>
    )
  }

  if (hasWallet) {
    return (
      <Link to={ROUTES.unlock} className="btn-primary text-xs py-1.5 px-3">
        Unlock
      </Link>
    )
  }

  return (
    <Link to={ROUTES.onboarding} className="btn-primary text-xs py-1.5 px-3 shimmer">
      Get started
    </Link>
  )
}
