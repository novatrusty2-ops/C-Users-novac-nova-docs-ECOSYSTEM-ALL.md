import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ChainDefinition, TokenBalanceRow, WalletAccount } from '@/types'
import {
  ensureDefaultAccount,
  getAccountById,
  getActiveAccountId,
  loadAccounts,
  setActiveAccountId,
} from '@/lib/accounts'
import { getActiveChainId, setActiveChainId } from '@/lib/activeChain'
import { allKnownChains } from '@/lib/networks'
import {
  createWallet,
  deriveAccount,
  getSigner,
  hasKeystore,
  importMnemonic,
  importPrivateKey,
  isUnlocked,
  lock,
  unlock,
  wipe,
} from '@/lib/keystore'
import { useToast } from './ToastContext'

interface WalletContextValue {
  hasWallet: boolean
  unlocked: boolean
  accounts: WalletAccount[]
  activeAccount: WalletAccount | null
  activeChainId: number
  activeChain: ChainDefinition | undefined
  balances: TokenBalanceRow[]
  balancesLoading: boolean
  create: (password: string) => Promise<{ address: string; mnemonic: string }>
  importPhrase: (phrase: string, password: string) => Promise<{ address: string }>
  importKey: (key: string, password: string) => Promise<{ address: string }>
  unlockWallet: (password: string) => Promise<void>
  lockWallet: () => void
  wipeWallet: () => void
  switchAccount: (id: string) => void
  switchChain: (chainId: number) => void
  refreshBalances: () => Promise<void>
  addDerivedAccount: (name?: string) => WalletAccount
}

const WalletContext = createContext<WalletContextValue | null>(null)

async function fetchBalancesStub(
  account: WalletAccount,
  chain: ChainDefinition,
): Promise<TokenBalanceRow[]> {
  const rows: TokenBalanceRow[] = []
  for (const token of chain.tokens) {
    rows.push({
      chainId: chain.id,
      chainName: chain.name,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      address: token.address,
      balance: '0',
      balanceRaw: 0n,
      usdPrice: token.usd ?? null,
      usdValue: null,
      iconColor: chain.iconColor,
    })
  }
  void account
  return rows
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { push } = useToast()
  const [hasWallet, setHasWallet] = useState(hasKeystore())
  const [unlocked, setUnlocked] = useState(isUnlocked())
  const [accounts, setAccounts] = useState<WalletAccount[]>(() => loadAccounts())
  const [activeAccountId, setActiveId] = useState<string | null>(() => getActiveAccountId())
  const [activeChainId, setChainId] = useState(getActiveChainId())
  const [balances, setBalances] = useState<TokenBalanceRow[]>([])
  const [balancesLoading, setBalancesLoading] = useState(false)

  const activeAccount = useMemo(
    () => (activeAccountId ? getAccountById(activeAccountId) ?? null : null),
    [activeAccountId, accounts],
  )

  const activeChain = useMemo(
    () => allKnownChains().find((c) => c.id === activeChainId),
    [activeChainId],
  )

  const refreshBalances = useCallback(async () => {
    if (!activeAccount || !activeChain || !unlocked) {
      setBalances([])
      return
    }
    setBalancesLoading(true)
    try {
      const rows = await fetchBalancesStub(activeAccount, activeChain)
      setBalances(rows)
    } finally {
      setBalancesLoading(false)
    }
  }, [activeAccount, activeChain, unlocked])

  useEffect(() => {
    void refreshBalances()
  }, [refreshBalances])

  const syncAccounts = useCallback(() => {
    setAccounts(loadAccounts())
    setActiveId(getActiveAccountId())
  }, [])

  const create = useCallback(
    async (password: string) => {
      const result = await createWallet(password)
      ensureDefaultAccount(result.address, 0)
      setHasWallet(true)
      setUnlocked(true)
      syncAccounts()
      push('Wallet created', 'success')
      return result
    },
    [push, syncAccounts],
  )

  const importPhrase = useCallback(
    async (phrase: string, password: string) => {
      const result = await importMnemonic(phrase, password)
      ensureDefaultAccount(result.address, 0)
      setHasWallet(true)
      setUnlocked(true)
      syncAccounts()
      push('Wallet imported', 'success')
      return result
    },
    [push, syncAccounts],
  )

  const importKey = useCallback(
    async (key: string, password: string) => {
      const result = await importPrivateKey(key, password)
      ensureDefaultAccount(result.address)
      setHasWallet(true)
      setUnlocked(true)
      syncAccounts()
      push('Private key imported', 'success')
      return result
    },
    [push, syncAccounts],
  )

  const unlockWallet = useCallback(
    async (password: string) => {
      await unlock(password)
      setUnlocked(true)
      syncAccounts()
      push('Wallet unlocked', 'success')
    },
    [push, syncAccounts],
  )

  const lockWallet = useCallback(() => {
    lock()
    setUnlocked(false)
    setBalances([])
    push('Wallet locked', 'info')
  }, [push])

  const wipeWallet = useCallback(() => {
    wipe()
    setHasWallet(false)
    setUnlocked(false)
    setAccounts([])
    setActiveId(null)
    setBalances([])
    push('Wallet removed', 'info')
  }, [push])

  const switchAccount = useCallback((id: string) => {
    setActiveAccountId(id)
    setActiveId(id)
  }, [])

  const switchChain = useCallback((chainId: number) => {
    setActiveChainId(chainId)
    setChainId(chainId)
  }, [])

  const addDerivedAccount = useCallback(
    (name?: string) => {
      const index = accounts.filter((a) => a.kind === 'eoa').length
      const wallet = deriveAccount(index)
      const account = ensureDefaultAccount(wallet.address, index)
      if (name) account.name = name
      syncAccounts()
      return account
    },
    [accounts, syncAccounts],
  )

  const value = useMemo<WalletContextValue>(
    () => ({
      hasWallet,
      unlocked,
      accounts,
      activeAccount,
      activeChainId,
      activeChain,
      balances,
      balancesLoading,
      create,
      importPhrase,
      importKey,
      unlockWallet,
      lockWallet,
      wipeWallet,
      switchAccount,
      switchChain,
      refreshBalances,
      addDerivedAccount,
    }),
    [
      hasWallet,
      unlocked,
      accounts,
      activeAccount,
      activeChainId,
      activeChain,
      balances,
      balancesLoading,
      create,
      importPhrase,
      importKey,
      unlockWallet,
      lockWallet,
      wipeWallet,
      switchAccount,
      switchChain,
      refreshBalances,
      addDerivedAccount,
    ],
  )

  void getSigner

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet requires WalletProvider')
  return ctx
}
