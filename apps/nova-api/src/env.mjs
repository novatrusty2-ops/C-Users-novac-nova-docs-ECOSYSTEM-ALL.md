import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

export function loadEnv() {
  const path = resolve(root, '.env')
  if (!existsSync(path)) return { ...process.env }
  const out = { ...process.env }
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const k = t.slice(0, i)
    if (out[k] == null || out[k] === '') out[k] = t.slice(i + 1)
  }
  return out
}

export function dfnsKeyPath(env) {
  return resolve(root, env.DFNS_PRIVATE_KEY_PATH || 'secrets/dfns-rsa2048.pem')
}
