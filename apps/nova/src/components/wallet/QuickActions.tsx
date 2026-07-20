import { Link } from 'react-router-dom'
import {
  IconBank,
  IconMore,
  IconReceive,
  IconSend,
  IconSwap,
} from '@/components/layout/icons'
import { ROUTES } from '@/lib/routes'

const ACTIONS = [
  { to: ROUTES.receive, label: 'Receive', Icon: IconReceive },
  { to: ROUTES.send, label: 'Send', Icon: IconSend },
  { to: ROUTES.swap, label: 'Trade', Icon: IconSwap },
  { to: ROUTES.withdraw, label: 'Withdraw', Icon: IconBank },
  { to: ROUTES.settings, label: 'More', Icon: IconMore },
] as const

export function QuickActions() {
  return (
    <div className="grid grid-cols-5 gap-1 px-1">
      {ACTIONS.map(({ to, label, Icon }) => (
        <Link key={label} to={to} className="okx-action">
          <span className="okx-action-icon">
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-medium text-nova-muted">{label}</span>
        </Link>
      ))}
    </div>
  )
}
