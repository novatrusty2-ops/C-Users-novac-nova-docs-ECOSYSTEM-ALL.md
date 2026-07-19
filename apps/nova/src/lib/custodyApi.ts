/** Nova custody API client — DFNS + Cobo keys stay on the server. */

export interface CustodyProviderStatus {
  ready: boolean
  baseUrl: string
}

export interface CustodyStatus {
  product: string
  dfns: CustodyProviderStatus
  cobo: CustodyProviderStatus
}

export interface CustodyWallet {
  id: string
  name?: string | null
  network?: string | null
  address?: string | null
  status?: string | null
  type?: string | null
  subtype?: string | null
}

function baseUrl(): string {
  const raw = String(import.meta.env.VITE_CUSTODY_API_URL || '').trim()
  return raw.replace(/\/+$/, '')
}

export function custodyConfigured(): boolean {
  return Boolean(baseUrl())
}

async function getJson<T>(path: string): Promise<T> {
  const root = baseUrl()
  if (!root) {
    throw new Error('Set VITE_CUSTODY_API_URL to your Nova custody API')
  }
  const res = await fetch(`${root}${path}`, {
    headers: { Accept: 'application/json' },
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || `Custody API ${res.status}`)
  }
  return data
}

export function fetchCustodyStatus(): Promise<CustodyStatus> {
  return getJson<CustodyStatus>('/api/custody/status')
}

export function fetchDfnsWallets(): Promise<{ items: CustodyWallet[] }> {
  return getJson<{ items: CustodyWallet[] }>('/api/custody/dfns/wallets')
}

export function fetchCoboWallets(): Promise<{ items: CustodyWallet[] }> {
  return getJson<{ items: CustodyWallet[] }>('/api/custody/cobo/wallets')
}
