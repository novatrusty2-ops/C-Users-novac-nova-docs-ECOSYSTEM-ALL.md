import type { ReactNode } from 'react'
import { Header, MobileNav } from './Header'
import { OfflineBanner } from './OfflineBanner'
import { ToastStack } from '@/components/common/Toast'
import { PrivateAccessBanner } from '@/components/security/PrivateAccessBanner'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell grain-overlay relative min-h-[100dvh]">
      <OfflineBanner />
      <PrivateAccessBanner />
      <Header />
      <main className="relative z-10">{children}</main>
      <MobileNav />
      <ToastStack />
    </div>
  )
}
