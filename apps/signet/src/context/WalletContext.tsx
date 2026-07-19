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
import { JsonRpcProvider, formatUnits } from 'ethers'
import { getActiveChainId, setActiveChainId } from '@/lib/activeChain'
import { allKnownChains, getEnabledChainIds } from '@/lib/networks'
import { resolveUsdPrice } from '@/lib/prices'
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
  sessionReady: boolean
  accounts: WalletAccount[]
  activeAccount: WalletAccount | null
  activeChainId: number
  activeChain: ChainDefinition | undefined
  balances: TokenBalanceRow[]
  balancesLoading: boolean
  externalAccount: WalletAccount | null
  attachExternalAccount: (account: WalletAccount | null) => void
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

async function fetchChainBalances(
  account: WalletAccount,
  chain: ChainDefinition,
): Promise<TokenBalanceRow[]> {
  let nativeRaw = 0n
  try {
    const rpc = chain.rpcUrls[0]
    if (rpc) {
      const provider = new JsonRpcProvider(rpc, chain.id, { staticNetwork: true })
      nativeRaw = await new Promise<bigint>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('rpc timeout')), 4500)
        provider
          .getBalance(account.address)
          .then((v) => {
            clearTimeout(t)
            resolve(v)
          })
          .catch((e) => {
            clearTimeout(t)
            reject(e)
          })
      })
    }
  } catch {
    nativeRaw = 0n
  }

  const rows: TokenBalanceRow[] = []
  for (const token of chain.tokens) {
    const isNative = token.address == null
    const balanceRaw = isNative ? nativeRaw : 0n
    const balance = formatUnits(balanceRaw, token.decimals)
    const usdPrice =
      token.usd ?? (await resolveUsdPrice(token.symbol, token.coingeckoId)) ?? null
    const usdValue =
      usdPrice != null ? Number(balance) * usdPrice : null
    rows.push({
      chainId: chain.id,
      chainName: chain.name,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      address: token.address,
      balance: Number(balance) === 0 ? '0' : Number(balance).toLocaleString(undefined, { maximumFractionDigits: 6 }),
      balanceRaw,
      usdPrice,
      usdValue: usdValue != null && Number.isFinite(usdValue) ? usdValue : null,
      iconColor: chain.iconColor,
    })
  }
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
  const [externalAccount, setExternalAccount] = useState<WalletAccount | null>(null)

  const localAccount = useMemo(
    () => (activeAccountId ? getAccountById(activeAccountId) ?? null : null),
    [activeAccountId, accounts],
  )
  const activeAccount = externalAccount ?? localAccount
  const sessionReady = unlocked || !!externalAccount

  const activeChain = useMemo(
    () => allKnownChains().find((c) => c.id === activeChainId),
    [activeChainId],
  )

  const attachExternalAccount = useCallback((account: WalletAccount | null) => {
    setExternalAccount(account)
  }, [])

  const refreshBalances = useCallback(async () => {
    if (!activeAccount || !sessionReady) {
      setBalances([])
      return
    }
    setBalancesLoading(true)
    try {
      const enabled = new Set(getEnabledChainIds())
      const chains = allKnownChains().filter((c) => enabled.has(c.id))
      // Prioritize active + NovaOne + NRW for dashboard responsiveness
      const priority = [activeChainId, 22016, 33001]
      const ordered = [
        ...priority.map((id) => chains.find((c) => c.id === id)).filter(Boolean),
        ...chains.filter((c) => !priority.includes(c.id)),
      ] as ChainDefinition[]
      const unique = [...new Map(ordered.map((c) => [c.id, c])).values()].slice(0, 8)
      const chunks = await Promise.all(unique.map((c) => fetchChainBalances(activeAccount, c)))
      setBalances(chunks.flat())
    } finally {
      setBalancesLoading(false)
    }
  }, [activeAccount, activeChainId, sessionReady])

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
      sessionReady,
      accounts,
      activeAccount,
      activeChainId,
      activeChain,
      balances,
      balancesLoading,
      externalAccount,
      attachExternalAccount,
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
      sessionReady,
      accounts,
      activeAccount,
      activeChainId,
      activeChain,
      balances,
      balancesLoading,
      externalAccount,
      attachExternalAccount,
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
