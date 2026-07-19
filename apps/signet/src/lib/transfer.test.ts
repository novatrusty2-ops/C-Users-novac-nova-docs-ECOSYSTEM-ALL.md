import { describe, expect, it } from 'vitest'
import { Interface, parseUnits } from 'ethers'
import {
  ERC20_ABI,
  buildErc20Transfer,
  buildNativeTransfer,
  estimateFeeLabel,
  toTransactionRequest,
  validateTransferAddress,
  validateTransferAmount,
} from './transfer'

const TO = '0x1111111111111111111111111111111111111111'
const TOKEN = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const FROM = '0x2222222222222222222222222222222222222222'

describe('transfer', () => {
  it('validates addresses', () => {
    expect(() => validateTransferAddress(TO)).not.toThrow()
    expect(() => validateTransferAddress('not-an-address')).toThrow(/invalid/i)
  })

  it('validates positive amounts', () => {
    expect(validateTransferAmount('1.5', 18)).toBe(parseUnits('1.5', 18))
    expect(() => validateTransferAmount('0', 18)).toThrow(/invalid amount/i)
    expect(() => validateTransferAmount('-1', 18)).toThrow(/invalid amount/i)
    expect(() => validateTransferAmount('', 6)).toThrow(/invalid amount/i)
  })

  it('builds native transfer', () => {
    const value = parseUnits('0.01', 18)
    const tx = buildNativeTransfer(TO, value)
    expect(tx).toEqual({ to: TO, value })
  })

  it('rejects zero native value', () => {
    expect(() => buildNativeTransfer(TO, 0n)).toThrow(/invalid amount/i)
  })

  it('builds erc20 transfer calldata', () => {
    const amount = parseUnits('10', 6)
    const tx = buildErc20Transfer(TOKEN, TO, amount)
    expect(tx.to).toBe(TOKEN)
    expect(tx.token).toBe(TOKEN)
    const iface = new Interface(ERC20_ABI)
    const decoded = iface.decodeFunctionData('transfer', tx.data)
    expect(decoded[0]).toBe(TO)
    expect(decoded[1]).toBe(amount)
  })

  it('rejects invalid token address', () => {
    expect(() => buildErc20Transfer('bad', TO, 1n)).toThrow(/token/i)
  })

  it('maps to TransactionRequest for native', () => {
    const tx = buildNativeTransfer(TO, 1n)
    expect(toTransactionRequest(FROM, tx)).toEqual({ from: FROM, to: TO, value: 1n })
  })

  it('maps to TransactionRequest for erc20', () => {
    const tx = buildErc20Transfer(TOKEN, TO, 1n)
    const req = toTransactionRequest(FROM, tx)
    expect(req.from).toBe(FROM)
    expect(req.to).toBe(TOKEN)
    expect(typeof req.data).toBe('string')
  })

  it('labels free gas as Free', () => {
    expect(estimateFeeLabel(21000n, 0n)).toBe('Free')
  })

  it('labels non-zero fee', () => {
    const label = estimateFeeLabel(21000n, 1_000_000_000n)
    expect(label).toMatch(/ETH/)
    expect(label).not.toBe('Free')
  })

  it('rejects invalid recipient on native build', () => {
    expect(() => buildNativeTransfer('0xdead', 1n)).toThrow(/invalid/i)
  })

  it('parses 6-decimal stable amounts', () => {
    expect(validateTransferAmount('100.5', 6)).toBe(100500000n)
  })
})
