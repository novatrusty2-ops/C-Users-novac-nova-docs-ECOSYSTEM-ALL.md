import { useCallback, useState } from 'react'
import { isFafoMode, setFafoMode, toggleFafoMode } from '@/lib/fafo'

export function useFAFO() {
  const [enabled, setEnabled] = useState(isFafoMode())

  const toggle = useCallback(() => {
    const next = toggleFafoMode()
    setEnabled(next)
    return next
  }, [])

  const set = useCallback((value: boolean) => {
    setFafoMode(value)
    setEnabled(value)
  }, [])

  return { enabled, toggle, set }
}
