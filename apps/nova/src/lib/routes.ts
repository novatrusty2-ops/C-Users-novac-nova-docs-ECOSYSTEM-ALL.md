export const ROUTES = {
  home: '/',
  onboarding: '/onboarding',
  unlock: '/unlock',
  portfolio: '/portfolio',
  swap: '/swap',
  activity: '/activity',
  settings: '/settings',
  send: '/send',
  receive: '/receive',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export const TAB_ROUTES = [
  ROUTES.portfolio,
  ROUTES.swap,
  ROUTES.activity,
  ROUTES.settings,
] as const
