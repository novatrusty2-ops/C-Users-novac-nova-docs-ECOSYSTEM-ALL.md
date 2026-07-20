export const ROUTES = {
  home: '/',
  onboarding: '/onboarding',
  unlock: '/unlock',
  portfolio: '/portfolio',
  swap: '/swap',
  activity: '/activity',
  settings: '/settings',
  ecosystem: '/ecosystem',
  send: '/send',
  receive: '/receive',
  withdraw: '/withdraw',
  token: '/token/:chainId/:symbol',
} as const

export function tokenDetailPath(chainId: number, symbol: string): string {
  return `/token/${chainId}/${encodeURIComponent(symbol)}`
}

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export const TAB_ROUTES = [
  ROUTES.portfolio,
  ROUTES.swap,
  ROUTES.activity,
  ROUTES.settings,
] as const
