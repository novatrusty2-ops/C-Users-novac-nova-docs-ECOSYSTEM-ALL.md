export interface WcSession {
  topic: string
  peerName: string
  chains: number[]
  accounts: string[]
  approved: boolean
}

export interface WcProposal {
  id: number
  proposer: string
  requiredChains: number[]
  requiredMethods: string[]
}

type SessionListener = (sessions: WcSession[]) => void

let sessions: WcSession[] = []
let pendingProposal: WcProposal | null = null
let nextProposalId = 1
const listeners = new Set<SessionListener>()

function notify(): void {
  for (const cb of listeners) cb([...sessions])
}

export function onSessionsChange(cb: SessionListener): () => void {
  listeners.add(cb)
  cb([...sessions])
  return () => listeners.delete(cb)
}

export async function pair(uri: string): Promise<WcProposal> {
  if (!uri.startsWith('wc:')) throw new Error('Invalid WalletConnect URI')
  pendingProposal = {
    id: nextProposalId++,
    proposer: uri.slice(0, 32),
    requiredChains: [1, 22016],
    requiredMethods: ['eth_sendTransaction', 'personal_sign'],
  }
  return pendingProposal
}

export function getPendingProposal(): WcProposal | null {
  return pendingProposal
}

export async function approveSession(accounts: string[], chains: number[]): Promise<WcSession> {
  if (!pendingProposal) throw new Error('No pending proposal')
  const session: WcSession = {
    topic: crypto.randomUUID(),
    peerName: pendingProposal.proposer,
    chains,
    accounts,
    approved: true,
  }
  sessions.push(session)
  pendingProposal = null
  notify()
  return session
}

export async function rejectSession(): Promise<void> {
  pendingProposal = null
}

export function listSessions(): WcSession[] {
  return [...sessions]
}

export function disconnectSession(topic: string): void {
  sessions = sessions.filter((s) => s.topic !== topic)
  notify()
}

export function _resetWalletConnectForTests(): void {
  sessions = []
  pendingProposal = null
  listeners.clear()
}
