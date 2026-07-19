import { BrowserProvider } from 'ethers'
import type { Eip1193Provider, KnownWalletId } from './types'
import { WALLET_CATALOG } from './catalog'

const STORAGE_KEY = 'signet.web3.session.v1'

export interface Web3Session {
  address: string
  chainId: number
  walletId: KnownWalletId
  walletName: string
}

export function loadWeb3Session(): Web3Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Web3Session
  } catch {
    return null
  }
}

export function saveWeb3Session(session: Web3Session | null) {
  if (!session) localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export async function requestAccounts(provider: Eip1193Provider): Promise<string[]> {
  const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[]
  if (!accounts?.length) throw new Error('No accounts returned')
  return accounts
}

export async function readChainId(provider: Eip1193Provider): Promise<number> {
  const hex = (await provider.request({ method: 'eth_chainId' })) as string
  return Number.parseInt(hex, 16)
}

export async function connectInjected(opts: {
  provider: Eip1193Provider
  walletId: KnownWalletId
  walletName: string
}): Promise<{ session: Web3Session; provider: Eip1193Provider; browser: BrowserProvider }> {
  const accounts = await requestAccounts(opts.provider)
  const chainId = await readChainId(opts.provider)
  const session: Web3Session = {
    address: accounts[0],
    chainId,
    walletId: opts.walletId,
    walletName: opts.walletName,
  }
  saveWeb3Session(session)
  const browser = new BrowserProvider(opts.provider)
  return { session, provider: opts.provider, browser }
}

export async function tryWalletConnect(): Promise<never> {
  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined
  if (!projectId) {
    throw new Error(
      'WalletConnect needs VITE_WALLETCONNECT_PROJECT_ID. Use MetaMask, Trust, SafePal, Gate, or another injected wallet for now.',
    )
  }
  // Lazy-load when project id is configured (optional dependency path)
  throw new Error('WalletConnect provider bundle not configured in this build — use an injected wallet.')
}

export function openInstallOrDeepLink(walletId: KnownWalletId) {
  const opt = WALLET_CATALOG.find((w) => w.id === walletId)
  if (!opt) return
  const dapp = typeof window !== 'undefined' ? window.location.href : ''
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
  if (isMobile && opt.deepLink && dapp) {
    window.open(opt.deepLink(dapp), '_blank', 'noopener,noreferrer')
    return
  }
  if (opt.installUrl) window.open(opt.installUrl, '_blank', 'noopener,noreferrer')
}

export function shortAddress(addr: string) {
  if (addr.length < 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
