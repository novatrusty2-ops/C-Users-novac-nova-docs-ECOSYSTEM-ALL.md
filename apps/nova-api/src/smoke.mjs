import { loadEnv } from './env.mjs'
import { listDfnsWallets } from './dfns.mjs'
import { listCoboWallets } from './cobo.mjs'

const env = loadEnv()

const dfns = await listDfnsWallets(env)
console.log('DFNS OK', { count: dfns.length })

const cobo = await listCoboWallets(env)
console.log('COBO OK', { count: cobo.length })

console.log('nova-api smoke passed')
