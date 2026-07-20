import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { BrowserProvider, type Signer } from 'ethers'
import type { Eip1193Provider, KnownWalletId } from '@/lib/web3'
import {
  connectInjected,
  ensureWalletChain,
  listDiscoverableWallets,
  loadWeb3Session,
  openInstallOrDeepLink,
  restoreInjectedSession,
  saveWeb3Session,
  shortAddress,
  tryWalletConnect,
  type DiscoveredWallet,
  type Web3Session,
} from '@/lib/web3'
import { useToast } from './ToastContext'
import { useWallet } from './WalletContext'

interface Web3ContextValue {
  connected: boolean
  session: Web3Session | null
  provider: Eip1193Provider | null
  connecting: boolean
  wallets: DiscoveredWallet[]
  refreshWallets: () => Promise<void>
  connectWallet: (wallet: DiscoveredWallet) => Promise<void>
  disconnectWallet: () => void
  switchWalletChain: (chainId: number) => Promise<void>
  ensureActiveChain: (chainId: number) => Promise<void>
  getInjectedSigner: () => Promise<Signer | null>
  shortAddress: (addr: string) => string
}

const Web3Context = createContext<Web3ContextValue | null>(null)

export function Web3Provider({ children }: { children: ReactNode }) {
  const { push } = useToast()
  const { attachExternalAccount, switchChain, activeChainId } = useWallet()
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

  useEffect(() => {
    let cancelled = false
    async function restore() {
      const saved = loadWeb3Session()
      if (!saved) return
      const discovered = await listDiscoverableWallets()
      if (cancelled) return
      const match =
        discovered.find((w) => w.option.id === saved.walletId && w.provider) ??
        discovered.find((w) => w.available && w.provider)
      if (!match?.provider) return
      const restored = await restoreInjectedSession({
        provider: match.provider,
        walletId: saved.walletId,
        walletName: saved.walletName,
        expectedAddress: saved.address,
      })
      if (cancelled || !restored) return
      setSession(restored.session)
      setProvider(restored.provider)
      switchChain(restored.session.chainId)
    }
    void restore()
    return () => {
      cancelled = true
    }
  }, [switchChain])

  useEffect(() => {
    if (session) {
      attachExternalAccount({
        id: `web3:${session.walletId}`,
        name: session.walletName,
        address: session.address,
        kind: 'eoa',
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
        const next = { ...prev, address: accounts[0]! }
        saveWeb3Session(next)
        return next
      })
    }
    const onChain = (...args: unknown[]) => {
      const chainHex = args[0] as string
      const chainId = Number.parseInt(chainHex, 16)
      if (!Number.isFinite(chainId)) return
      setSession((prev) => {
        if (!prev) return prev
        const next = { ...prev, chainId }
        saveWeb3Session(next)
        return next
      })
      switchChain(chainId)
    }
    provider.on('accountsChanged', onAccounts)
    provider.on('chainChanged', onChain)
    return () => {
      provider.removeListener?.('accountsChanged', onAccounts)
      provider.removeListener?.('chainChanged', onChain)
    }
  }, [provider, push, switchChain])

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
          preferChainId: activeChainId || 138,
        })
        setSession(next)
        setProvider(p)
        switchChain(next.chainId)
        push(`Connected ${next.walletName} · chain ${next.chainId}`, 'success')
      } catch (err) {
        push(err instanceof Error ? err.message : 'Connect failed', 'error')
        throw err
      } finally {
        setConnecting(false)
        void refreshWallets()
      }
    },
    [push, refreshWallets, activeChainId, switchChain],
  )

  const disconnectWallet = useCallback(() => {
    setSession(null)
    setProvider(null)
    saveWeb3Session(null)
    push('Web3 wallet disconnected', 'info')
  }, [push])

  const switchWalletChain = useCallback(
    async (chainId: number) => {
      switchChain(chainId)
      if (!provider) return
      const nextId = await ensureWalletChain(provider, chainId)
      setSession((prev) => {
        if (!prev) return prev
        const next = { ...prev, chainId: nextId }
        saveWeb3Session(next)
        return next
      })
    },
    [provider, switchChain],
  )

  const ensureActiveChain = useCallback(
    async (chainId: number) => {
      if (!provider) return
      const nextId = await ensureWalletChain(provider, chainId)
      switchChain(nextId)
      setSession((prev) => {
        if (!prev) return prev
        const next = { ...prev, chainId: nextId }
        saveWeb3Session(next)
        return next
      })
    },
    [provider, switchChain],
  )

  const getInjectedSigner = useCallback(async (): Promise<Signer | null> => {
    if (!provider) return null
    return new BrowserProvider(provider).getSigner()
  }, [provider])

  const value = useMemo<Web3ContextValue>(
    () => ({
      connected: !!session && !!provider,
      session,
      provider,
      connecting,
      wallets,
      refreshWallets,
      connectWallet,
      disconnectWallet,
      switchWalletChain,
      ensureActiveChain,
      getInjectedSigner,
      shortAddress,
    }),
    [
      session,
      provider,
      connecting,
      wallets,
      refreshWallets,
      connectWallet,
      disconnectWallet,
      switchWalletChain,
      ensureActiveChain,
      getInjectedSigner,
    ],
  )

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}

export function useWeb3(): Web3ContextValue {
  const ctx = useContext(Web3Context)
  if (!ctx) throw new Error('useWeb3 requires Web3Provider')
  return ctx
}
