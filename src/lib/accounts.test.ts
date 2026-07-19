import { describe, expect, it } from 'vitest'
import {
  addEoaAccount,
  addMultisigAccount,
  ensureDefaultAccount,
  getAccountById,
  getActiveAccountId,
  loadAccounts,
  removeAccount,
  renameAccount,
  saveAccounts,
  setActiveAccountId,
} from './accounts'

const ADDR1 = '0x1111111111111111111111111111111111111111'
const ADDR2 = '0x2222222222222222222222222222222222222222'
const ADDR3 = '0x3333333333333333333333333333333333333333'

describe('accounts', () => {
  it('starts empty', () => {
    expect(loadAccounts()).toEqual([])
    expect(getActiveAccountId()).toBeNull()
  })

  it('ensures a default EOA account', () => {
    const a = ensureDefaultAccount(ADDR1, 0)
    expect(a.name).toBe('Account 1')
    expect(a.kind).toBe('eoa')
    expect(a.address).toBe(ADDR1)
    expect(getActiveAccountId()).toBe(a.id)
    expect(loadAccounts()).toHaveLength(1)
  })

  it('ensureDefaultAccount is idempotent for same address', () => {
    const a = ensureDefaultAccount(ADDR1)
    const b = ensureDefaultAccount(ADDR1)
    expect(a.id).toBe(b.id)
    expect(loadAccounts()).toHaveLength(1)
  })

  it('adds EOA accounts', () => {
    const a = addEoaAccount('Trading', ADDR1, 0)
    const b = addEoaAccount('Savings', ADDR2, 1)
    expect(loadAccounts()).toHaveLength(2)
    expect(a.derivationIndex).toBe(0)
    expect(b.name).toBe('Savings')
  })

  it('adds multisig accounts', () => {
    const m = addMultisigAccount({
      name: 'Treasury',
      address: ADDR3,
      owners: [ADDR1, ADDR2],
      threshold: 2,
      safeAddress: ADDR3,
      chainId: 1,
    })
    expect(m.kind).toBe('multisig')
    expect(m.threshold).toBe(2)
    expect(m.owners).toHaveLength(2)
  })

  it('renames accounts', () => {
    const a = ensureDefaultAccount(ADDR1)
    renameAccount(a.id, 'Primary')
    expect(getAccountById(a.id)?.name).toBe('Primary')
  })

  it('removes accounts and reassigns active', () => {
    const a = addEoaAccount('A', ADDR1, 0)
    const b = addEoaAccount('B', ADDR2, 1)
    setActiveAccountId(a.id)
    removeAccount(a.id)
    expect(loadAccounts()).toHaveLength(1)
    expect(getActiveAccountId()).toBe(b.id)
  })

  it('clears active when last account removed', () => {
    const a = ensureDefaultAccount(ADDR1)
    removeAccount(a.id)
    expect(loadAccounts()).toHaveLength(0)
    expect(getActiveAccountId()).toBeNull()
  })

  it('saveAccounts replaces manifest', () => {
    ensureDefaultAccount(ADDR1)
    saveAccounts([])
    expect(loadAccounts()).toEqual([])
  })

  it('setActiveAccountId persists', () => {
    const a = addEoaAccount('A', ADDR1, 0)
    setActiveAccountId(a.id)
    expect(getActiveAccountId()).toBe(a.id)
  })

  it('getAccountById returns undefined for missing', () => {
    expect(getAccountById('missing')).toBeUndefined()
  })

  it('supports mixed EOA + multisig manifest', () => {
    ensureDefaultAccount(ADDR1)
    addMultisigAccount({
      name: 'Safe',
      address: ADDR2,
      owners: [ADDR1],
      threshold: 1,
      safeAddress: ADDR2,
      chainId: 22016,
    })
    expect(loadAccounts().map((x) => x.kind).sort()).toEqual(['eoa', 'multisig'])
  })
})
