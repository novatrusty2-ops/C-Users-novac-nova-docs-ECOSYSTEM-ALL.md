const DEFAULT_BASE =
  'https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox'

export function sandboxBase(): string {
  return (import.meta.env.VITE_NOVAPAY_SANDBOX_BASE || DEFAULT_BASE).replace(/\/$/, '')
}

export type NovaPayStatus = {
  partner?: string
  enabled?: boolean
  mode?: string
  configured?: boolean
  authMethod?: string
  sandboxUiUrl?: string
  receiveUrl?: string
  sendUrl?: string
  manifestUrl?: string
  callbackUrl?: string
}

export type NovaPayManifest = {
  partner?: string
  institution?: string
  currencies?: string
  transactionTypes?: string
  authMethod?: string
  payloadSample?: Record<string, unknown>
  transactionSubmitUrl?: string
  statusCallbackUrl?: string
}

export type NovaPayEvent = {
  direction?: string
  status?: string
  reference?: string
  transactionId?: string
  amount?: string
  currency?: string
  createdAt?: string
  timestamp?: string
  body?: Record<string, unknown>
  payload?: Record<string, unknown>
  [key: string]: unknown
}

async function api<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(`${sandboxBase()}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data: T
  try {
    data = text ? (JSON.parse(text) as T) : (null as T)
  } catch {
    data = { raw: text } as T
  }
  return { ok: res.ok, status: res.status, data }
}

export function getStatus() {
  return api<NovaPayStatus>('GET', '/status')
}

export function getManifest() {
  return api<NovaPayManifest>('GET', '/manifest')
}

export function getEvents() {
  return api<NovaPayEvent[] | { events?: NovaPayEvent[]; items?: NovaPayEvent[] }>(
    'GET',
    '/events',
  )
}

export function postReceive(body: Record<string, unknown>) {
  return api<Record<string, unknown>>('POST', '/receive', body)
}

export function postSend(body: Record<string, unknown>) {
  return api<Record<string, unknown>>('POST', '/send', body)
}

export function normalizeEvents(
  data: NovaPayEvent[] | { events?: NovaPayEvent[]; items?: NovaPayEvent[] } | null,
): NovaPayEvent[] {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.events)) return data.events
  if (data && Array.isArray(data.items)) return data.items
  return []
}
