import { useMemo, useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { isMeshStable } from '@/lib/tokenCapabilities'
import { tokenMatchesSearch } from './tokenSearch'

interface TokenPickerProps {
  open: boolean
  title: string
  symbols: string[]
  value: string
  onClose: () => void
  onSelect: (symbol: string) => void
}

/** High-contrast token sheet — avoids near-black native <select> option lists. */
export function TokenPicker({ open, title, symbols, value, onClose, onSelect }: TokenPickerProps) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    return symbols.filter((s) => tokenMatchesSearch(s, q))
  }, [q, symbols])

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="token-picker-sheet -mx-1 rounded-xl p-2">
        <input
          className="token-picker-search mb-2 w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          placeholder="Search token"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
          {filtered.map((s) => {
            const active = s === value
            return (
              <li key={s}>
                <button
                  type="button"
                  className={`token-picker-row flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                    active ? 'is-active' : ''
                  }`}
                  onClick={() => {
                    onSelect(s)
                    setQ('')
                    onClose()
                  }}
                >
                  <span>{s}</span>
                  <span className="text-xs font-medium opacity-70">
                    {isMeshStable(s) ? 'stable' : 'token'}
                  </span>
                </button>
              </li>
            )
          })}
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm opacity-70">No tokens match</li>
          ) : null}
        </ul>
      </div>
    </Modal>
  )
}
