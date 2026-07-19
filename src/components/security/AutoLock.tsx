import { useEffect, useRef } from 'react'
import { useWallet } from '@/context/WalletContext'
import { getAutolockMinutes } from '@/lib/settings'

export function AutoLock() {
  const { unlocked, lockWallet } = useWallet()
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!unlocked) return
    const minutes = getAutolockMinutes()
    if (minutes === 0) return

    const reset = () => {
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => lockWallet(), minutes * 60_000)
    }

    reset()
    const events = ['mousemove', 'keydown', 'touchstart', 'click'] as const
    for (const ev of events) window.addEventListener(ev, reset)
    return () => {
      for (const ev of events) window.removeEventListener(ev, reset)
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [unlocked, lockWallet])

  return null
}
