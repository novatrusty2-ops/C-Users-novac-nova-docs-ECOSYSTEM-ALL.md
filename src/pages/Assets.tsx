import { useParams } from 'react-router-dom'
import { AssetList } from '@/components/assets/AssetList'
import { AssetDetail } from '@/components/assets/AssetDetail'
import { useVisibleTokenRows } from '@/hooks/useVisibleTokenRows'

export function AssetsPage() {
  const { symbol } = useParams()
  const rows = useVisibleTokenRows()
  const row = symbol ? rows.find((r) => r.symbol.toLowerCase() === symbol.toLowerCase()) : undefined

  return (
    <div className="page-container">
      {symbol ? (
        <AssetDetail row={row} />
      ) : (
        <>
          <h1 className="mb-6 font-display text-3xl text-signet-gold-light">Assets</h1>
          <AssetList rows={rows} />
        </>
      )}
    </div>
  )
}
