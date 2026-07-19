import { beforeEach, describe, expect, it } from 'vitest'
import {
  _resetSessionForTests,
  createWallet,
  deriveAccount,
  exportMnemonic,
  getSigner,
  hasKeystore,
  importMnemonic,
  isUnlocked,
  lock,
  unlock,
  wipe,
} from './keystore'

const PASS = 'Nova-Test-Passphrase-9!'

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

  it('exports mnemonic after password check', async () => {
    const { mnemonic } = await createWallet(PASS)
    const exported = await exportMnemonic(PASS)
    expect(exported).toBe(mnemonic)
  })

  it('derives additional HD accounts', async () => {
    await createWallet(PASS)
    const a0 = getSigner(0)
    const a1 = deriveAccount(1)
    expect(await a0.getAddress()).not.toBe(a1.address)
  })
})
