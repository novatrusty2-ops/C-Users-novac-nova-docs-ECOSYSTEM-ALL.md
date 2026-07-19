import { beforeEach, describe, expect, it } from 'vitest'
import {
  _resetSessionForTests,
  createWallet,
  deriveAccount,
  exportMnemonic,
  getSigner,
  hasKeystore,
  importMnemonic,
  importPrivateKey,
  isUnlocked,
  lock,
  unlock,
  wipe,
} from './keystore'

const PASS = 'Signet-Test-Passphrase-9!'

beforeEach(() => {
  wipe()
  _resetSessionForTests()
})

describe('keystore', () => {
  it('starts without a keystore', () => {
    expect(hasKeystore()).toBe(false)
    expect(isUnlocked()).toBe(false)
  })

  it('creates a 12-word wallet and unlocks session', async () => {
    const { address, mnemonic } = await createWallet(PASS)
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    expect(mnemonic.split(' ')).toHaveLength(12)
    expect(hasKeystore()).toBe(true)
    expect(isUnlocked()).toBe(true)
  })

  it('rejects empty password on create', async () => {
    await expect(createWallet('')).rejects.toThrow(/password/i)
  })

  it('locks and unlocks with correct password', async () => {
    const { mnemonic } = await createWallet(PASS)
    lock()
    expect(isUnlocked()).toBe(false)
    const unlocked = await unlock(PASS)
    expect(unlocked.mnemonic).toBe(mnemonic)
    expect(unlocked.wallets[0]?.address).toMatch(/^0x/)
  })

  it('rejects wrong password', async () => {
    await createWallet(PASS)
    lock()
    await expect(unlock('wrong-password')).rejects.toThrow(/wrong password/i)
  })

  it('imports a valid mnemonic', async () => {
    const phrase =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
    const { address } = await importMnemonic(phrase, PASS)
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    lock()
    const again = await unlock(PASS)
    expect(again.wallets[0]?.address).toBe(address)
  })

  it('rejects invalid mnemonic', async () => {
    await expect(importMnemonic('not a real mnemonic phrase here at all', PASS)).rejects.toThrow(
      /invalid mnemonic/i,
    )
  })

  it('imports a private key', async () => {
    const pk = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const { address } = await importPrivateKey(pk, PASS)
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    lock()
    const session = await unlock(PASS)
    expect(session.wallets[0]?.address).toBe(address)
  })

  it('exports mnemonic after password check', async () => {
    const { mnemonic } = await createWallet(PASS)
    const exported = await exportMnemonic(PASS)
    expect(exported).toBe(mnemonic)
  })

  it('derives additional HD accounts', async () => {
    await createWallet(PASS)
    const a0 = getSigner(0)
    const a1 = deriveAccount(1)
    const a2 = deriveAccount(2)
    expect(await a0.getAddress()).not.toBe(a1.address)
    expect(a1.address).not.toBe(a2.address)
  })

  it('wipes keystore and locks', async () => {
    await createWallet(PASS)
    wipe()
    expect(hasKeystore()).toBe(false)
    expect(isUnlocked()).toBe(false)
  })

  it('getSigner throws when locked', async () => {
    await createWallet(PASS)
    lock()
    expect(() => getSigner(0)).toThrow(/locked/i)
  })

  it('normalize mnemonic whitespace on import', async () => {
    const compact =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
    const spaced =
      '  abandon   abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about  '
    const a = await importMnemonic(compact, PASS)
    wipe()
    _resetSessionForTests()
    const b = await importMnemonic(spaced, PASS)
    expect(b.address).toBe(a.address)
  })

  it('persists across unlock cycles', async () => {
    const { address } = await createWallet(PASS)
    lock()
    const again = await unlock(PASS)
    expect(again.wallets[0]?.address).toBe(address)
  })
})
