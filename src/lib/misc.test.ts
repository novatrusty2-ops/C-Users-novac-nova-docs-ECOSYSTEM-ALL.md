import { describe, expect, it } from 'vitest'
import {
  CHAINS,
  chainBadgeStyle,
  defaultChainIds,
  getChain,
  getChainBySlug,
  partnerChains,
  publicEvmChains,
} from './chains'
import { BRAND } from './brand'
import { formatUnitsAmount, isValidAddress, parseAmount, shortAddress } from './tokens'
import { convertFromUsd, formatMoney, getDisplayCurrency, setDisplayCurrency } from './settings'
import { isStablecoin, resolveUsdPrice } from './prices'
import { oracleUsdPrice } from './oracle'
import { quoteSwap } from './swap'
import { predictSafeAddress, deploySafe } from './safe/deploy'
import { computeSafeTxHash, buildSafeTransaction } from './safe/transactions'
import {
  proposeSafeTx,
  confirmSafeTx,
  executeSafeTx,
  pendingForSafe,
  clearPendingSafeTxs,
} from './safe/pending'
import { getEnabledChainIds, setEnabledChainIds, toggleChain } from './networks'
import { getActiveChainId, setActiveChainId } from './activeChain'
import { isFafoMode, setFafoMode } from './fafo'
import { isGateUnlocked, setGateUnlocked, clearGate } from './institutionalGate'
import { canViewPrivateBankingChains } from './privateAccess'
import { buildPortfolioInsights } from './insights'
import { appendActivity, loadActivity } from './activity'
import type { TokenBalanceRow } from '@/types'

const O1 = '0x1111111111111111111111111111111111111111'
const O2 = '0x2222222222222222222222222222222222222222'
const O3 = '0x3333333333333333333333333333333333333333'

describe('chains registry', () => {
  it('includes NovaOne with brand purple color', () => {
    const c = getChain(22016)!
    expect(c.name).toBe('NovaOne')
    expect(c.iconColor).toBe(BRAND.chainColors.novaone)
    expect(c.iconColor).toBe('#8B5CF6')
    expect(c.zeroGas).toBe(true)
  })

  it('includes NRW World Chain with brand purple color', () => {
    const c = getChainBySlug('nrw')!
    expect(c.id).toBe(33001)
    expect(c.iconColor).toBe(BRAND.chainColors.nrw)
    expect(c.iconColor).toBe('#A855F7')
  })

  it('lists public EVM and partner chains', () => {
    expect(publicEvmChains().length).toBeGreaterThanOrEqual(10)
    expect(partnerChains().some((c) => c.slug === 'nrw')).toBe(true)
  })

  it('defaultChainIds includes novaone and nrw', () => {
    const ids = defaultChainIds()
    expect(ids).toContain(22016)
    expect(ids).toContain(33001)
  })

  it('chainBadgeStyle uses icon color', () => {
    expect(chainBadgeStyle(22016).background).toBe('#8B5CF6')
    expect(chainBadgeStyle(33001).background).toBe('#A855F7')
  })

  it('has unique chain ids', () => {
    const ids = CHAINS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('tokens helpers', () => {
  it('validates addresses', () => {
    expect(isValidAddress(O1)).toBe(true)
    expect(isValidAddress('nope')).toBe(false)
  })

  it('shortens addresses', () => {
    expect(shortAddress(O1)).toMatch(/^0x1111…1111$/)
  })

  it('formats and parses amounts', () => {
    expect(parseAmount('1.5', 18)).toBe(1500000000000000000n)
    expect(formatUnitsAmount(0n, 18)).toBe('0')
    expect(formatUnitsAmount(1n, 18)).toBe('<0.000001')
  })
})

describe('settings + prices', () => {
  it('converts and formats display currencies', () => {
    setDisplayCurrency('EUR')
    expect(getDisplayCurrency()).toBe('EUR')
    expect(convertFromUsd(100, 'EUR')).toBeCloseTo(92)
    expect(formatMoney(12.5, 'USD')).toContain('12.50')
    expect(formatMoney(1000, 'JPY')).toContain('¥')
  })

  it('pegs stablecoins to $1', async () => {
    expect(isStablecoin('USDC')).toBe(true)
    expect(await resolveUsdPrice('USDT')).toBe(1)
  })

  it('falls back to oracle for NOVA and NRW', async () => {
    expect(oracleUsdPrice('NOVA')).toBeGreaterThan(0)
    expect(oracleUsdPrice('NRW')).toBeGreaterThan(0)
    expect(await resolveUsdPrice('NOVA')).toBe(oracleUsdPrice('NOVA'))
  })
})

describe('swap', () => {
  it('quotes stablecoin pairs 1:1 with fee', async () => {
    const q = await quoteSwap('USDC', 'USDT', '100')
    expect(q.rate).toBe(1)
    expect(q.feeBps).toBe(30)
    expect(Number(q.amountOut)).toBeCloseTo(99.7, 4)
  })

  it('rejects same token and bad amount', async () => {
    await expect(quoteSwap('ETH', 'ETH', '1')).rejects.toThrow(/same/i)
    await expect(quoteSwap('ETH', 'USDC', '0')).rejects.toThrow(/amount/i)
  })

  it('quotes non-stable via oracle', async () => {
    const q = await quoteSwap('NOVA', 'NRW', '10')
    expect(q.provider).toBe('internal')
    expect(Number(q.amountOut)).toBeGreaterThan(0)
  })
})

describe('safe multisig', () => {
  it('predicts deterministic address', () => {
    const a = predictSafeAddress({ chainId: 22016, owners: [O1, O2], threshold: 2 })
    const b = predictSafeAddress({ chainId: 22016, owners: [O2, O1], threshold: 2 })
    expect(a.address).toBe(b.address)
    expect(a.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
  })

  it('rejects invalid threshold', () => {
    expect(() => predictSafeAddress({ chainId: 1, owners: [O1], threshold: 2 })).toThrow(
      /threshold/i,
    )
  })

  it('deploySafe returns prediction', async () => {
    const d = await deploySafe({ chainId: 1, owners: [O1, O2, O3], threshold: 2 })
    expect(d.address).toMatch(/^0x/)
  })

  it('computes stable safe tx hash', () => {
    const h1 = computeSafeTxHash({
      safeAddress: O1,
      to: O2,
      value: '0',
      data: '0x',
      nonce: 0,
      chainId: 1,
    })
    const h2 = computeSafeTxHash({
      safeAddress: O1,
      to: O2,
      value: '0',
      data: '0x',
      nonce: 0,
      chainId: 1,
    })
    expect(h1).toBe(h2)
    expect(buildSafeTransaction({
      safeAddress: O1,
      to: O2,
      value: '1',
      data: '0x',
      nonce: 1,
      chainId: 22016,
    }).safeTxHash).toMatch(/^0x/)
  })

  it('propose confirm execute flow', () => {
    clearPendingSafeTxs()
    const safe = predictSafeAddress({ chainId: 1, owners: [O1, O2], threshold: 2 })
    const pending = proposeSafeTx({
      safeAddress: safe.address,
      to: O3,
      value: '0',
      data: '0x',
      nonce: 0,
      chainId: 1,
      threshold: 2,
    })
    expect(pendingForSafe(safe.address)).toHaveLength(1)
    confirmSafeTx(pending.safeTxHash, O1)
    confirmSafeTx(pending.safeTxHash, O2)
    const executed = executeSafeTx(pending.safeTxHash)
    expect(executed?.executed).toBe(true)
  })
})

describe('networks + active chain', () => {
  it('toggles enabled chains', () => {
    setEnabledChainIds([22016, 33001])
    expect(getEnabledChainIds()).toEqual([22016, 33001])
    toggleChain(1)
    expect(getEnabledChainIds()).toContain(1)
    toggleChain(1)
    expect(getEnabledChainIds()).not.toContain(1)
  })

  it('defaults active chain to NovaOne', () => {
    expect(getActiveChainId()).toBe(22016)
    setActiveChainId(33001)
    expect(getActiveChainId()).toBe(33001)
  })
})

describe('fafo + institutional gate', () => {
  it('toggles FAFO mode', () => {
    expect(isFafoMode()).toBe(false)
    setFafoMode(true)
    expect(isFafoMode()).toBe(true)
  })

  it('gates private banking', () => {
    clearGate()
    expect(isGateUnlocked()).toBe(false)
    expect(canViewPrivateBankingChains()).toBe(false)
    setGateUnlocked('test-token')
    expect(isGateUnlocked()).toBe(true)
    expect(canViewPrivateBankingChains()).toBe(true)
  })
})

describe('insights + activity', () => {
  it('returns insight strings', () => {
    const rows: TokenBalanceRow[] = [
      {
        chainId: 22016,
        chainName: 'NovaOne',
        symbol: 'NOVA',
        name: 'Nova',
        decimals: 18,
        address: null,
        balance: '10',
        balanceRaw: 10n ** 19n,
        usdPrice: 1,
        usdValue: 10,
        iconColor: '#8B5CF6',
      },
    ]
    const tips = buildPortfolioInsights(rows, 10)
    expect(tips.length).toBeGreaterThan(0)
    expect(tips[0]?.message).toEqual(expect.any(String))
  })

  it('records activity', () => {
    appendActivity(O1, {
      id: '1',
      chainId: 22016,
      hash: '0xabc',
      from: O1,
      to: O2,
      value: '1',
      symbol: 'NOVA',
      timestamp: Date.now(),
      status: 'confirmed',
      kind: 'send',
    })
    expect(loadActivity(O1)).toHaveLength(1)
  })
})

describe('brand tokens', () => {
  it('exposes regal Signet palette', () => {
    expect(BRAND.name).toBe('Signet Wallet')
    expect(BRAND.domain).toBe('signetwallet.com')
    expect(BRAND.colors.burgundy).toBe('#8C2A3E')
    expect(BRAND.colors.gold).toBe('#C9A84C')
    expect(BRAND.colors.cream).toBe('#F5F0E8')
  })
})
