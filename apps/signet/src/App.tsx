import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AutoLock } from '@/components/security/AutoLock'
import { ROUTES } from '@/lib/routes'
import { useWallet } from '@/context/WalletContext'
import { LandingPage } from '@/pages/LandingPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { ImportWalletPage } from '@/pages/ImportWalletPage'
import { LockedPage } from '@/pages/Locked'
import { DashboardPage } from '@/pages/Dashboard'
import { AssetsPage } from '@/pages/Assets'
import { TokensPage } from '@/pages/Tokens'
import { TokenChartPage } from '@/pages/TokenChartPage'
import { SendPage } from '@/pages/SendPage'
import { ReceivePage } from '@/pages/ReceivePage'
import { SwapPage } from '@/pages/SwapPage'
import { BridgePage } from '@/pages/Bridge'
import { BanksDirectoryPage } from '@/pages/BanksDirectory'
import { MorePage } from '@/pages/MorePage'
import { CreateSafePage } from '@/pages/multisig/CreateSafePage'
import { PendingProposalsPage } from '@/pages/multisig/PendingProposalsPage'
import { SettingsLayout } from '@/pages/settings/SettingsLayout'
import { SettingsIndexPage } from '@/pages/settings/Index'
import { SettingsAccountsPage } from '@/pages/settings/Accounts'
import { SettingsGeneralPage } from '@/pages/settings/General'
import { SettingsSecurityPage } from '@/pages/settings/Security'
import { SettingsBackupPage } from '@/pages/settings/Backup'
import { SettingsNetworkPage } from '@/pages/settings/Network'
import { SettingsDisplayPage } from '@/pages/settings/Display'
import { SettingsNotificationsPage } from '@/pages/settings/Notifications'
import { SettingsConnectionsPage } from '@/pages/settings/Connections'
import { SettingsAdvancedPage } from '@/pages/settings/Advanced'
import { SettingsFafoPage } from '@/pages/settings/Fafo'
import { SettingsAboutPage } from '@/pages/settings/About'
import { WalletConnectPage } from '@/pages/WalletConnectPage'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { hasWallet, unlocked, sessionReady } = useWallet()

  if (sessionReady) return children
  if (!hasWallet) return <Navigate to={ROUTES.onboarding} replace />
  if (!unlocked) return <Navigate to={ROUTES.unlock} replace />
  return children
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { hasWallet, unlocked, sessionReady } = useWallet()
  if (sessionReady || (hasWallet && unlocked)) return <Navigate to={ROUTES.portfolio} replace />
  if (hasWallet && !unlocked) return <Navigate to={ROUTES.unlock} replace />
  return children
}

export function App() {
  return (
    <ErrorBoundary>
      <AppShell>
        <AutoLock />
        <Routes>
          <Route path={ROUTES.home} element={<LandingPage />} />
          <Route
            path={ROUTES.onboarding}
            element={
              <PublicOnly>
                <OnboardingPage />
              </PublicOnly>
            }
          />
          <Route
            path={ROUTES.import}
            element={
              <PublicOnly>
                <ImportWalletPage />
              </PublicOnly>
            }
          />
          <Route path={ROUTES.unlock} element={<LockedPage />} />
          <Route path={ROUTES.walletConnect} element={<WalletConnectPage />} />

          <Route
            path={ROUTES.portfolio}

            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.assets}
            element={
              <ProtectedRoute>
                <AssetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={`${ROUTES.assets}/:symbol`}
            element={
              <ProtectedRoute>
                <AssetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.tokens}
            element={
              <ProtectedRoute>
                <TokensPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.tokenChart}
            element={
              <ProtectedRoute>
                <TokenChartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.send}
            element={
              <ProtectedRoute>
                <SendPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.receive}
            element={
              <ProtectedRoute>
                <ReceivePage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.swap}
            element={
              <ProtectedRoute>
                <SwapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.bridge}
            element={
              <ProtectedRoute>
                <BridgePage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.banks}
            element={
              <ProtectedRoute>
                <BanksDirectoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.more}
            element={
              <ProtectedRoute>
                <MorePage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.multisigCreate}
            element={
              <ProtectedRoute>
                <CreateSafePage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.multisigPending}
            element={
              <ProtectedRoute>
                <PendingProposalsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.settings}
            element={
              <ProtectedRoute>
                <SettingsLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SettingsIndexPage />} />
            <Route path="accounts" element={<SettingsAccountsPage />} />
            <Route path="general" element={<SettingsGeneralPage />} />
            <Route path="security" element={<SettingsSecurityPage />} />
            <Route path="backup" element={<SettingsBackupPage />} />
            <Route path="network" element={<SettingsNetworkPage />} />
            <Route path="display" element={<SettingsDisplayPage />} />
            <Route path="notifications" element={<SettingsNotificationsPage />} />
            <Route path="connections" element={<SettingsConnectionsPage />} />
            <Route path="advanced" element={<SettingsAdvancedPage />} />
            <Route path="fafo" element={<SettingsFafoPage />} />
            <Route path="about" element={<SettingsAboutPage />} />
          </Route>

          <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
        </Routes>
      </AppShell>
    </ErrorBoundary>
  )
}

export default App
