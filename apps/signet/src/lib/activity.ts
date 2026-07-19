import type { ActivityItem } from '@/types'

const PREFIX = 'signet.activity.v3.'

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

function key(address: string): string {
  return PREFIX + address.toLowerCase()
}

export function loadActivity(address: string): ActivityItem[] {
  const raw = storage()?.getItem(key(address))
  if (!raw) return []
  try {
    const items = JSON.parse(raw) as ActivityItem[]
    return items.sort((a, b) => b.timestamp - a.timestamp)
  } catch {
    return []
  }
}

export function saveActivity(address: string, items: ActivityItem[]): void {
  storage()?.setItem(key(address), JSON.stringify(items))
}

export function appendActivity(address: string, item: ActivityItem): void {
  const items = loadActivity(address)
  saveActivity(address, [item, ...items.filter((i) => i.id !== item.id)].slice(0, 500))
}

export function updateActivityStatus(
  address: string,
  id: string,
  status: ActivityItem['status'],
): void {
  saveActivity(
    address,
    loadActivity(address).map((i) => (i.id === id ? { ...i, status } : i)),
  )
}

export function clearActivity(address: string): void {
  storage()?.removeItem(key(address))
}

export function createActivityId(): string {
  return crypto.randomUUID()
}
