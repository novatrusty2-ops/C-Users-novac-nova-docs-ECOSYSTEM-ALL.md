import {
  HDNodeWallet,
  Mnemonic,
  Wallet,
  type Signer,
} from 'ethers'

const KEYSTORE_KEY = 'nova.keystore.v1'
const DEFAULT_PATH_PREFIX = "m/44'/60'/0'/0"

interface StoredKeystore {
  version: 1
  ciphertext: string
  accounts: number
}

interface UnlockSession {
  mnemonic: string
  wallets: HDNodeWallet[]
  accounts: number
}

let session: UnlockSession | null = null

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

function readStored(): StoredKeystore | null {
  const raw = storage()?.getItem(KEYSTORE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredKeystore
  } catch {
    return null
  }
}

function writeStored(data: StoredKeystore): void {
  storage()?.setItem(KEYSTORE_KEY, JSON.stringify(data))
}

function deriveWallets(mnemonic: string, count: number): HDNodeWallet[] {
  const wallets: HDNodeWallet[] = []
  for (let i = 0; i < count; i++) {
    wallets.push(HDNodeWallet.fromPhrase(mnemonic, undefined, `${DEFAULT_PATH_PREFIX}/${i}`))
  }
  return wallets
}

function walletFromPrivateKey(pk: string): HDNodeWallet {
  const w = new Wallet(pk.startsWith('0x') ? pk : `0x${pk}`)
  return w as unknown as HDNodeWallet
}

async function encryptMnemonic(mnemonic: string, password: string): Promise<string> {
  const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, `${DEFAULT_PATH_PREFIX}/0`)
  return wallet.encrypt(password)
}

async function decryptMnemonic(ciphertext: string, password: string): Promise<string> {
  const wallet = await Wallet.fromEncryptedJson(ciphertext, password)
  if (!(wallet instanceof HDNodeWallet) || !wallet.mnemonic?.phrase) {
    throw new Error('Invalid keystore')
  }
  return wallet.mnemonic.phrase
}

export function hasKeystore(): boolean {
  return readStored() != null
}

export function isUnlocked(): boolean {
  return session != null
}

export function lock(): void {
  session = null
}

export function wipe(): void {
  lock()
  storage()?.removeItem(KEYSTORE_KEY)
}

export async function createWallet(password: string): Promise<{ address: string; mnemonic: string }> {
  if (!password) throw new Error('Password required')
  const root = HDNodeWallet.createRandom()
  const mnemonic = root.mnemonic!.phrase
  const ciphertext = await encryptMnemonic(mnemonic, password)
  writeStored({ version: 1, ciphertext, accounts: 1 })
  session = { mnemonic, wallets: deriveWallets(mnemonic, 1), accounts: 1 }
  return { address: session.wallets[0]!.address, mnemonic }
}

export async function importMnemonic(mnemonic: string, password: string): Promise<{ address: string }> {
  if (!password) throw new Error('Password required')
  const normalized = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!Mnemonic.isValidMnemonic(normalized)) throw new Error('Invalid mnemonic')
  const ciphertext = await encryptMnemonic(normalized, password)
  writeStored({ version: 1, ciphertext, accounts: 1 })
  session = { mnemonic: normalized, wallets: deriveWallets(normalized, 1), accounts: 1 }
  return { address: session.wallets[0]!.address }
}

export async function importPrivateKey(pk: string, password: string): Promise<{ address: string }> {
  if (!password) throw new Error('Password required')
  const wallet = new Wallet(pk.startsWith('0x') ? pk : `0x${pk}`)
  const ciphertext = await wallet.encrypt(password)
  writeStored({ version: 1, ciphertext, accounts: 1 })
  session = { mnemonic: '', wallets: [walletFromPrivateKey(pk)], accounts: 1 }
  return { address: wallet.address }
}

export async function unlock(password: string): Promise<{ mnemonic: string; wallets: HDNodeWallet[] }> {
  const stored = readStored()
  if (!stored) throw new Error('No keystore')
  if (!password) throw new Error('Password required')

  try {
    const wallet = await Wallet.fromEncryptedJson(stored.ciphertext, password)
    if (wallet instanceof HDNodeWallet && wallet.mnemonic?.phrase) {
      const phrase = wallet.mnemonic.phrase
      session = {
        mnemonic: phrase,
        wallets: deriveWallets(phrase, stored.accounts),
        accounts: stored.accounts,
      }
    } else {
      session = {
        mnemonic: '',
        wallets: [wallet as HDNodeWallet],
        accounts: stored.accounts,
      }
    }
  } catch {
    throw new Error('Wrong password')
  }

  return { mnemonic: session!.mnemonic, wallets: session!.wallets }
}

export function getSigner(accountIndex = 0): Signer {
  if (!session) throw new Error('Wallet locked')
  const w = session.wallets[accountIndex]
  if (!w) throw new Error('Account not found')
  return w
}

export async function exportMnemonic(password: string): Promise<string> {
  const stored = readStored()
  if (!stored) throw new Error('No keystore')
  const phrase = await decryptMnemonic(stored.ciphertext, password)
  if (!phrase) throw new Error('Mnemonic unavailable')
  return phrase
}

export function deriveAccount(index: number): HDNodeWallet {
  if (!session?.mnemonic) throw new Error('Mnemonic unavailable')
  if (index < 0) throw new Error('Invalid index')

  while (session.wallets.length <= index) {
    const i = session.wallets.length
    session.wallets.push(
      HDNodeWallet.fromPhrase(session.mnemonic, undefined, `${DEFAULT_PATH_PREFIX}/${i}`),
    )
  }

  if (index + 1 > session.accounts) {
    session.accounts = index + 1
    const stored = readStored()
    if (stored) writeStored({ ...stored, accounts: session.accounts })
  }

  return session.wallets[index]!
}

export function _resetSessionForTests(): void {
  session = null
}
