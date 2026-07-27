/** Canonical Alltra RPC endpoints (primary + listed fallback). */
export const ALLTRA_RPC_ENDPOINTS = [
  'https://mainnet-rpc.alltra.global',
  'https://alltra-rpc.novablockchainsystem.com',
] as const

/** Deduped RPC list: preferred first, then catalog fallbacks. */
export function alltraRpcEndpoints(preferred?: string): string[] {
  const out: string[] = []
  const push = (raw: string | undefined) => {
    if (!raw) return
    const n = raw.replace(/\/$/, '')
    if (n && !out.includes(n)) out.push(n)
  }
  push(preferred)
  for (const u of ALLTRA_RPC_ENDPOINTS) push(u)
  return out
}

/** True when the error looks like RPC/transport failure (not a liquidity revert). */
export function isAlltraRpcTransportError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /502|503|504|Bad Gateway|SERVER_ERROR|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|fetch failed|network|unreachable|Unexpected token|<!DOCTYPE|not valid JSON|failed to detect network|Alltra RPC/i.test(
    msg,
  )
}
