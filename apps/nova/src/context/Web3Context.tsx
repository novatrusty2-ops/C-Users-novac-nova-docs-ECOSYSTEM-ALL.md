import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Eip1193Provider, KnownWalletId } from '@/lib/web3'
import {
  connectInjected,
  loadWeb3Session,
  openInstallOrDeepLink,
  saveWeb3Session,
  shortAddress,
  tryWalletConnect,
  type Web3Session,
} from '@/lib/web3'
import { listDiscoverableWallets, type DiscoveredWallet } from '@/lib/web3'
import { useToast } from './ToastContext'
import { useWallet } from './WalletContext'

interface Web3ContextValue {
  connected: boolean
  session: Web3Session | null
  connecting: boolean
  wallets: DiscoveredWallet[]
  refreshWallets: () => Promise<void>
  connectWallet: (wallet: DiscoveredWallet) => Promise<void>
  disconnectWallet: () => void
  shortAddress: (addr: string) => string
}

const Web3Context = createContext<Web3ContextValue | null>(null)

export function Web3Provider({ children }: { children: ReactNode }) {
  const { push } = useToast()
  const { attachExternalAccount } = useWallet()
  const [session, setSession] = useState<Web3Session | null>(() => loadWeb3Session())
  const [provider, setProvider] = useState<Eip1193Provider | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([])

  const refreshWallets = useCallback(async () => {
    setWallets(await listDiscoverableWallets())
  }, [])

  useEffect(() => {
    void refreshWallets()
  }, [refreshWallets])

  // Sync external account into WalletContext for balances / UI
  useEffect(() => {
    if (session) {
      attachExternalAccount({
        id: `web3:${session.walletId}`,
        name: session.walletName,
        address: session.address,
      })
    } else {
      attachExternalAccount(null)
    }
  }, [session, attachExternalAccount])

  useEffect(() => {
    if (!provider?.on) return
    const onAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[]
      if (!accounts?.length) {
        setSession(null)
        saveWeb3Session(null)
        setProvider(null)
        push('Wallet disconnected', 'info')
        return
      }
      setSession((prev) => {
        if (!prev) return prev
        const next = { ...prev, address: accounts[0] }
        saveWeb3Session(next)
        return next
      })
    }
    const onChain = (...args: unknown[]) => {
      const chainHex = args[0] as string
      const chainId = Number.parseInt(chainHex, 16)
      setSession((prev) => {
        if (!prev) return prev
        const next = { ...prev, chainId }
        saveWeb3Session(next)
        return next
      })
    }
    provider.on('accountsChanged', onAccounts)
    provider.on('chainChanged', onChain)
    return () => {
      provider.removeListener?.('accountsChanged', onAccounts)
      provider.removeListener?.('chainChanged', onChain)
    }
  }, [provider, push])

  const connectWallet = useCallback(
    async (wallet: DiscoveredWallet) => {
      setConnecting(true)
      try {
        if (wallet.option.id === 'walletconnect') {
          await tryWalletConnect()
          return
        }
        if (!wallet.available || !wallet.provider) {
          openInstallOrDeepLink(wallet.option.id as KnownWalletId)
          push(`Open or install ${wallet.option.name}, then try again`, 'info')
          return
        }
        const { session: next, provider: p } = await connectInjected({
          provider: wallet.provider,
          walletId: wallet.option.id,
          walletName: wallet.eip6963Name || wallet.option.name,
        })
        setSession(next)
        setProvider(p)
        push(`Connected ${next.walletName}`, 'success')
      } catch (err) {
        push(err instanceof Error ? err.message : 'Connect failed', 'error')
        throw err
      } finally {
        setConnecting(false)
        void refreshWallets()
      }
    },
    [push, refreshWallets],
  )

  const disconnectWallet = useCallback(() => {
    setSession(null)
    setProvider(null)
    saveWeb3Session(null)
    push('Web3 wallet disconnected', 'info')
  }, [push])

  const value = useMemo<Web3ContextValue>(
    () => ({
      connected: !!session,
      session,
      connecting,
      wallets,
      refreshWallets,
      connectWallet,
      disconnectWallet,
      shortAddress,
    }),
    [session, connecting, wallets, refreshWallets, connectWallet, disconnectWallet],
  )

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}

export function useWeb3(): Web3ContextValue {
  const ctx = useContext(Web3Context)
  if (!ctx) throw new Error('useWeb3 requires Web3Provider')
  return ctx
}
