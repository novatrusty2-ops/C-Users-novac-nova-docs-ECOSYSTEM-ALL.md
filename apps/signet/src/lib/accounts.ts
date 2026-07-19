import type { WalletAccount } from '@/types'

const ACCOUNTS_KEY = 'signet.accounts.v3'
const ACTIVE_KEY = 'signet.accounts.active.v3'

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

function uid(): string {
  return crypto.randomUUID()
}

export function loadAccounts(): WalletAccount[] {
  const raw = storage()?.getItem(ACCOUNTS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as WalletAccount[]
  } catch {
    return []
  }
}

export function saveAccounts(accounts: WalletAccount[]): void {
  storage()?.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function getActiveAccountId(): string | null {
  return storage()?.getItem(ACTIVE_KEY) ?? null
}

export function setActiveAccountId(id: string): void {
  storage()?.setItem(ACTIVE_KEY, id)
}

export function ensureDefaultAccount(address: string, derivationIndex = 0): WalletAccount {
  const accounts = loadAccounts()
  const existing = accounts.find(
    (a) => a.address.toLowerCase() === address.toLowerCase() && a.kind === 'eoa',
  )
  if (existing) {
    if (!getActiveAccountId()) setActiveAccountId(existing.id)
    return existing
  }
  const account: WalletAccount = {
    id: uid(),
    name: 'Account 1',
    address,
    kind: 'eoa',
    derivationIndex,
  }
  const next = [...accounts, account]
  saveAccounts(next)
  setActiveAccountId(account.id)
  return account
}

export function addEoaAccount(name: string, address: string, derivationIndex?: number): WalletAccount {
  const account: WalletAccount = {
    id: uid(),
    name,
    address,
    kind: 'eoa',
    derivationIndex,
  }
  saveAccounts([...loadAccounts(), account])
  return account
}

export function addMultisigAccount(account: Omit<WalletAccount, 'id' | 'kind'> & { kind?: 'multisig' }): WalletAccount {
  const full: WalletAccount = {
    ...account,
    id: uid(),
    kind: 'multisig',
  }
  saveAccounts([...loadAccounts(), full])
  return full
}

export function renameAccount(id: string, name: string): void {
  saveAccounts(loadAccounts().map((a) => (a.id === id ? { ...a, name } : a)))
}

export function removeAccount(id: string): void {
  const accounts = loadAccounts().filter((a) => a.id !== id)
  saveAccounts(accounts)
  if (getActiveAccountId() === id) {
    if (accounts[0]) setActiveAccountId(accounts[0].id)
    else storage()?.removeItem(ACTIVE_KEY)
  }
}

export function getAccountById(id: string): WalletAccount | undefined {
  return loadAccounts().find((a) => a.id === id)
}
