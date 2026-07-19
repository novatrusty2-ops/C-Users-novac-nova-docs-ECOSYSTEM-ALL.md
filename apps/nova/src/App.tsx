import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { MobileShell } from '@/components/layout/MobileShell'
import { ToastStack } from '@/context/ToastContext'
import { ROUTES, TAB_ROUTES } from '@/lib/routes'
import { useWallet } from '@/context/WalletContext'
import { Landing } from '@/pages/Landing'
import { Onboarding } from '@/pages/Onboarding'
import { Unlock } from '@/pages/Unlock'
import { Portfolio } from '@/pages/Portfolio'
import { Swap } from '@/pages/Swap'
import { Activity } from '@/pages/Activity'
import { Settings } from '@/pages/Settings'
import { Send } from '@/pages/Send'
import { Receive } from '@/pages/Receive'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { hasWallet, unlocked } = useWallet()

  if (!hasWallet) return <Navigate to={ROUTES.onboarding} replace />
  if (!unlocked) return <Navigate to={ROUTES.unlock} replace />
  return children
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { hasWallet, unlocked } = useWallet()
  if (hasWallet && unlocked) return <Navigate to={ROUTES.portfolio} replace />
  if (hasWallet && !unlocked) return <Navigate to={ROUTES.unlock} replace />
  return children
}

function AppRoutes() {
  const { pathname } = useLocation()
  const showTabs = TAB_ROUTES.some((r) => pathname === r)

  return (
    <MobileShell showTabs={showTabs}>
      <ToastStack />
      <Routes>
        <Route path={ROUTES.home} element={<Landing />} />
        <Route
          path={ROUTES.onboarding}
          element={
            <PublicOnly>
              <Onboarding />
            </PublicOnly>
          }
        />
        <Route path={ROUTES.unlock} element={<Unlock />} />

        <Route
          path={ROUTES.portfolio}
          element={
            <ProtectedRoute>
              <Portfolio />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.swap}
          element={
            <ProtectedRoute>
              <Swap />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.activity}
          element={
            <ProtectedRoute>
              <Activity />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.settings}
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.send}
          element={
            <ProtectedRoute>
              <Send />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.receive}
          element={
            <ProtectedRoute>
              <Receive />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>
    </MobileShell>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  )
}

export default App
