import { useMemo } from 'react'
import type { TokenBalanceRow } from '@/types'
import { useDisplaySettings } from './useDisplaySettings'
import { useTokenBalances } from './useTokenBalances'

export function useVisibleTokenRows(extraRows: TokenBalanceRow[] = []) {
  const { rows } = useTokenBalances()
  const { settings } = useDisplaySettings()

  return useMemo(() => {
    const merged = [...rows, ...extraRows]
    return merged.filter((row) => {
      if (row.balanceRaw === 0n && !row.address) return true
      if (settings.spamFilter && row.symbol.match(/^(SCAM|TEST)/i)) return false
      if (
        settings.hideSmallBalances &&
        row.usdValue != null &&
        row.usdValue < settings.smallBalanceThresholdUsd
      ) {
        return false
      }
      return true
    })
  }, [rows, extraRows, settings])
}

export function useFilteredTokenSearch(query: string, rows: TokenBalanceRow[]) {
  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.symbol.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.chainName.toLowerCase().includes(q),
    )
  }, [query, rows])
}
