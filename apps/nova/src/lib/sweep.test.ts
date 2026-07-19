import { describe, expect, it } from 'vitest'
import { isAddress } from 'ethers'
import { NOVA_DESTINATION_ADDRESS } from './destination'
import { validateTransferAddress } from './transfer'

describe('destination sweep address', () => {
  it('is a valid checksummed EVM address', () => {
    expect(isAddress(NOVA_DESTINATION_ADDRESS)).toBe(true)
    expect(() => validateTransferAddress(NOVA_DESTINATION_ADDRESS)).not.toThrow()
  })
})
