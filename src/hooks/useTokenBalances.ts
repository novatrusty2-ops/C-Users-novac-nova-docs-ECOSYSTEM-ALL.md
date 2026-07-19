import { useCallback, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'

export function useTokenBalances() {
  const { balances, balancesLoading, refreshBalances } = useWallet()

  useEffect(() => {
    void refreshBalances()
  }, [refreshBalances])

  const totalUsd = balances.reduce((sum, r) => sum + (r.usdValue ?? 0), 0)

  return {
    rows: balances,
    loading: balancesLoading,
    totalUsd,
    refresh: refreshBalances,
  }
}

export function useRefreshBalancesOnFocus() {
  const { refreshBalances } = useWallet()
  useEffect(() => {
    const onFocus = () => void refreshBalances()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshBalances])
}

export function useBalanceForSymbol(symbol: string) {
  const { rows } = useTokenBalances()
  return rows.find((r) => r.symbol.toUpperCase() === symbol.toUpperCase())
}

export function useChainBalances(chainId: number) {
  const { rows } = useTokenBalances()
  return rows.filter((r) => r.chainId === chainId)
}

export function useMemoizedRefresh(refresh: () => Promise<void>) {
  return useCallback(() => void refresh(), [refresh])
}
