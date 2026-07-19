import { useCallback, useEffect, useState } from 'react'
import { executeBridge, quoteBridge, type BridgeQuote } from '@/lib/bridge/execute'
import { loadBridgeHistory, type BridgeHistoryEntry } from '@/lib/bridge/history'
import { routesFromChain } from '@/lib/bridge/routes'
import { useWallet } from '@/context/WalletContext'

export function useBridge() {
  const { activeAccount, activeChainId } = useWallet()
  const [history, setHistory] = useState<BridgeHistoryEntry[]>(() => loadBridgeHistory())
  const [quote, setQuote] = useState<BridgeQuote | null>(null)
  const [loading, setLoading] = useState(false)

  const routes = routesFromChain(activeChainId)

  const refreshHistory = useCallback(() => {
    setHistory(loadBridgeHistory())
  }, [])

  const getQuote = useCallback(
    (toChainId: number, symbol: string, amount: string) => {
      try {
        const q = quoteBridge(activeChainId, toChainId, symbol, amount)
        setQuote(q)
        return q
      } catch {
        setQuote(null)
        return null
      }
    },
    [activeChainId],
  )

  const bridge = useCallback(
    async (toChainId: number, symbol: string, amount: string) => {
      if (!activeAccount) throw new Error('No account')
      setLoading(true)
      try {
        const result = await executeBridge({
          fromChainId: activeChainId,
          toChainId,
          symbol,
          amount,
          sender: activeAccount.address,
        })
        refreshHistory()
        setQuote(null)
        return result
      } finally {
        setLoading(false)
      }
    },
    [activeAccount, activeChainId, refreshHistory],
  )

  useEffect(() => {
    refreshHistory()
  }, [refreshHistory])

  return { routes, quote, getQuote, bridge, history, loading, refreshHistory }
}
