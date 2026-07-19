import type { Eip1193Provider, Eip6963ProviderDetail, KnownWalletId, WalletOption } from './types'
import { WALLET_CATALOG } from './catalog'

declare global {
  interface Window {
    ethereum?: Eip1193Provider
    trustwallet?: Eip1193Provider
    safepalProvider?: Eip1193Provider
    gatewallet?: Eip1193Provider
    okxwallet?: Eip1193Provider
    bitkeep?: { ethereum?: Eip1193Provider }
  }
}

export function discoverEip6963(timeoutMs = 120): Promise<Eip6963ProviderDetail[]> {
  if (typeof window === 'undefined') return Promise.resolve([])

  return new Promise((resolve) => {
    const found = new Map<string, Eip6963ProviderDetail>()
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail
      if (detail?.info?.uuid) found.set(detail.info.uuid, detail)
    }
    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))
    window.setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', onAnnounce)
      resolve([...found.values()])
    }, timeoutMs)
  })
}

function legacyInjected(): Eip1193Provider[] {
  const list: Eip1193Provider[] = []
  const eth = window.ethereum
  if (eth?.providers?.length) list.push(...eth.providers)
  else if (eth) list.push(eth)
  if (window.trustwallet) list.push(window.trustwallet)
  if (window.safepalProvider) list.push(window.safepalProvider)
  if (window.gatewallet) list.push(window.gatewallet)
  if (window.okxwallet) list.push(window.okxwallet)
  if (window.bitkeep?.ethereum) list.push(window.bitkeep.ethereum)
  // dedupe by reference
  return [...new Set(list)]
}

export interface DiscoveredWallet {
  option: WalletOption
  provider?: Eip1193Provider
  available: boolean
  eip6963Name?: string
}

function matchCatalog(
  option: WalletOption,
  eip6963: Eip6963ProviderDetail[],
  legacy: Eip1193Provider[],
): DiscoveredWallet {
  if (option.id === 'walletconnect') {
    return { option, available: true }
  }

  const byRdns = option.rdns?.length
    ? eip6963.find((d) => option.rdns!.some((r) => d.info.rdns === r || d.info.rdns.endsWith(r)))
    : undefined
  if (byRdns) {
    return {
      option,
      provider: byRdns.provider,
      available: true,
      eip6963Name: byRdns.info.name,
    }
  }

  if (option.flags) {
    const hit = legacy.find((p) => option.flags!(p))
    if (hit) return { option, provider: hit, available: true }
  }

  if (option.id === 'injected' && legacy[0]) {
    return { option, provider: legacy[0], available: true }
  }

  // OKX / Bitget often only on window.*
  if (option.id === 'okx' && window.okxwallet) {
    return { option, provider: window.okxwallet, available: true }
  }
  if (option.id === 'bitget' && window.bitkeep?.ethereum) {
    return { option, provider: window.bitkeep.ethereum, available: true }
  }
  if (option.id === 'gate' && window.gatewallet) {
    return { option, provider: window.gatewallet, available: true }
  }
  if (option.id === 'safepal' && window.safepalProvider) {
    return { option, provider: window.safepalProvider, available: true }
  }
  if (option.id === 'trust' && window.trustwallet) {
    return { option, provider: window.trustwallet, available: true }
  }

  return { option, available: false }
}

export async function listDiscoverableWallets(): Promise<DiscoveredWallet[]> {
  const eip6963 = await discoverEip6963()
  const legacy = legacyInjected()
  const rows = WALLET_CATALOG.map((opt) => matchCatalog(opt, eip6963, legacy))

  // Prefer available wallets first, keep catalog order within groups
  return [
    ...rows.filter((r) => r.available && r.option.id !== 'walletconnect'),
    ...rows.filter((r) => !r.available && r.option.id !== 'walletconnect'),
    ...rows.filter((r) => r.option.id === 'walletconnect'),
  ]
}

export function walletIdFromProvider(provider: Eip1193Provider): KnownWalletId {
  for (const opt of WALLET_CATALOG) {
    if (opt.flags?.(provider)) return opt.id
  }
  return 'injected'
}
