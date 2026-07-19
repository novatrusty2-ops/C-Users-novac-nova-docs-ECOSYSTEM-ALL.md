import { useMemo } from 'react'
import { useWallet } from '@/context/WalletContext'
import { formatMoney } from '@/lib/settings'

export function useTokenBalances(chainId?: number) {
  const { balances, balancesLoading } = useWallet()

  const filtered = useMemo(() => {
    if (chainId == null) return balances
    return balances.filter((b) => b.chainId === chainId)
  }, [balances, chainId])

  const totalUsd = useMemo(
    () => filtered.reduce((sum, b) => sum + (b.usdValue ?? 0), 0),
    [filtered],
  )

  return {
    rows: filtered,
    loading: balancesLoading,
    totalUsd,
    formattedTotal: formatMoney(totalUsd),
  }
}
