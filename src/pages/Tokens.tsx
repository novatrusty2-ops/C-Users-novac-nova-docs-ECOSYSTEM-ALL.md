import { useState } from 'react'
import { TokenList } from '@/components/tokens/TokenList'
import { TokenSearch } from '@/components/tokens/TokenSearch'
import { AddTokenModal } from '@/components/tokens/AddTokenModal'
import { useFilteredTokenSearch, useVisibleTokenRows } from '@/hooks/useVisibleTokenRows'
import { Button } from '@/components/common/Button'

export function TokensPage() {
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const rows = useVisibleTokenRows()
  const filtered = useFilteredTokenSearch(query, rows)

  return (
    <div className="page-container">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-signet-gold-light">Tokens</h1>
        <Button variant="ghost" onClick={() => setAddOpen(true)}>
          Add token
        </Button>
      </div>
      <TokenSearch value={query} onChange={setQuery} />
      <div className="mt-4">
        <TokenList rows={filtered} />
      </div>
      <AddTokenModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
