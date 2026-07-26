import { Interface, JsonRpcProvider, parseUnits, formatUnits } from 'ethers'
import {
  ALLTRA_CHAIN_ID,
  ALLTRA_ROUTER,
  type PouchpayRouteQuote,
  type PouchpayTransactionRequest,
} from './routes'

const NATIVE = '0x0000000000000000000000000000000000000000'
const WALL = '0x2da2b8f961f161ab6320acb3377e2e844a3c3ce4'
const WETH = '0x798f6762bb40d6801a593459d08f890603d3979c'
const WBNB = '0xfE6E0aEd4Ca571BFbF3C3ae7Bf01fcA40B4716d3'
const WTRX = '0xaA7d8C0B6119148DE1456EC0025f9A7b2Dd41A4F'
const DEFAULT_RPC = 'https://mainnet-rpc.alltra.global'

type TokenEntry = { address: string; decimals: number; native?: boolean; aliasOf?: string }

/** Full production Alltra swap set + ETH/BNB/TRX native aliases (wraps). */
const TOKENS: Record<string, TokenEntry> = {
  ALL: { address: NATIVE, decimals: 18, native: true },
  '$BUCKS': { address: '0x90a72d1cC06434938671e3e10c8774870bd40e41', decimals: 18 },
  '11::11': { address: '0x535cA3048871dc5A6466A6b07559c0D08f773D95', decimals: 18 },
  ACX: { address: '0xe86714a357e20bb7af375f2bb18601f5caaedac9', decimals: 18 },
  AUDA: { address: '0x690740f055a41fa7669f5a379bf71b0cdf353073', decimals: 18 },
  AUSDC: { address: '0xcf5423f2e06878bb23fe914519339be739e6c6b1', decimals: 18 },
  AUSDT: { address: '0x015b1897ed5279930bc2be46f661894d219292a6', decimals: 18 },
  BRK: { address: '0x53C135B2581974D441C2CF200585dB5d2F450d72', decimals: 18 },
  CHT: { address: '0xe59bb804f4884fcea183a4a67b1bb04f4a4567bc', decimals: 8 },
  FIRE: { address: '0x923fB4A1E4cB4450a2EAe0075c30Ce22aBA781c4', decimals: 18 },
  FLKR: { address: '0xbeAF04696Ab28466a2F8762d4E175aaBE32D58d5', decimals: 18 },
  FSH: { address: '0xC77d4787eE65236Fa81d2bE77a4c205B3e1883d2', decimals: 18 },
  GLD1111: { address: '0xD1FF8EaA1EA78A4d5213D6685a7fFe91D54AF621', decimals: 18 },
  HYBX: { address: '0x1839f77ebed7f388c7035f7061b4b8ef0e72317a', decimals: 8 },
  HYDX: { address: '0x0d9793861aeb9244ad1b34375a83a6730f6add38', decimals: 18 },
  ICX: { address: '0x8AEF3c48Fa393f5a52cdb2dAea2F84e141ECA2F0', decimals: 18 },
  MONEEZ: { address: '0x990F219011fc7C643465988665a98698bB7Cc142', decimals: 18 },
  'NSB-AUSDT': { address: '0x66d8efa0af63b0e84eb1dd72bf00f00cd1e2234e', decimals: 18 },
  PAYINQ: { address: '0xbA5d382D85aD9C1b6109b838928Df9898BbC2BDa', decimals: 18 },
  PSS: { address: '0xF7339552D4272e3A75E4A27Fe451013e94A64B55', decimals: 18 },
  SFY: { address: '0x2b6c609938303559f4d8a62986473a11fb21075E', decimals: 18 },
  SHIVA: { address: '0x9E514a353Be010F45eec93d9AcEb01b28986b1D7', decimals: 18 },
  SKSH: { address: '0xAFa5eC4D4A3fbe80714d0b5f5020c6F2eDA2A7E7', decimals: 18 },
  SON: { address: '0x4aaA6FeA3B49A1f9b4cdB3d0a33F4A0a471aF8f5', decimals: 18 },
  TN8: { address: '0x761D9b7D56B5D4B975231DE6Da2f324E600fa73C', decimals: 18 },
  USDC: { address: '0xa95eed79f84e6a0151eaeb9d441f9ffd50e8e881', decimals: 18 },
  'USDT-LEGACY': { address: '0xB5A55d36cF82Ec4Eea9813a82e81a631610459c8', decimals: 18 },
  VCE: { address: '0x5FE130Bec080BdDCcc1f42B6C611E99b0FB2cBaf', decimals: 18 },
  WALL: { address: WALL, decimals: 18 },
  WBTC: { address: '0x66971b907dfcc6325124af427fc7f97656a68e9c', decimals: 8 },
  WETH: { address: WETH, decimals: 18 },
  ETH: { address: WETH, decimals: 18, aliasOf: 'WETH' },
  WBNB: { address: WBNB, decimals: 18 },
  BNB: { address: WBNB, decimals: 18, aliasOf: 'WBNB' },
  WTRX: { address: WTRX, decimals: 18 },
  TRX: { address: WTRX, decimals: 18, aliasOf: 'WTRX' },
  ZRG: { address: '0x04382FAbed4e66Cb66711357E32e1E03078D9a70', decimals: 18 },
  ZARA: { address: '0xb91b4F8D9913cf90b55E34e192a89bad346E3Eb3', decimals: 18 },
  'USDT-TRC20': { address: '0x1B71cA166C7B32561C483F35A73316B88cdC5027', decimals: 18 },
  'USDT-BNB': { address: '0xdaC78a6054C4255AD72B65a87eea2E0c865697Fa', decimals: 18 },
}

const ROUTER_ABI = [
  'function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)',
  'function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable',
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
  'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
]

const iface = new Interface(ROUTER_ABI)

function resolve(symbol: string): TokenEntry & { symbol: string } {
  const raw = symbol.trim()
  const upper = raw.toUpperCase()
  const key =
    upper === '11:11' || upper === '11;11'
      ? '11::11'
      : upper === 'BUCKS'
        ? '$BUCKS'
        : upper === '$BUCKS'
          ? '$BUCKS'
          : upper
  const t = TOKENS[key] || TOKENS[raw]
  if (!t) throw new Error(`Unknown Alltra token: ${symbol}`)
  return { ...t, symbol: key }
}

function pathCandidates(from: TokenEntry, to: TokenEntry): string[][] {
  const fromIsNative = Boolean(from.native)
  const toIsNative = Boolean(to.native)
  const fromAddr = fromIsNative ? WALL : from.address
  const toAddr = toIsNative ? WALL : to.address
  if (fromAddr.toLowerCase() === toAddr.toLowerCase()) throw new Error('Same token')
  const direct = [fromAddr, toAddr]
  const wall = WALL.toLowerCase()
  if (fromAddr.toLowerCase() === wall || toAddr.toLowerCase() === wall) return [direct]
  return [direct, [fromAddr, WALL, toAddr]]
}

/** Build on-chain UniswapV2 callData for ALLTRA Global Swap (fixes missing callData). */
export async function buildAlltraCallDataQuote(
  fromSymbol: string,
  toSymbol: string,
  amount: string,
  options: { recipient?: string; slippageBps?: number; rpc?: string } = {},
): Promise<PouchpayRouteQuote> {
  const from = resolve(fromSymbol)
  const to = resolve(toSymbol)
  const recipient =
    options.recipient || '0x5227115Ba7c8694218f570c1EC2a680095872820'
  const slippageBps = options.slippageBps ?? 100
  const rpc = options.rpc || DEFAULT_RPC

  const fromIsNative = Boolean(from.native)
  const toIsNative = Boolean(to.native)
  const amountIn = parseUnits(amount, from.decimals)
  const provider = new JsonRpcProvider(rpc, ALLTRA_CHAIN_ID)

  let path: string[] | undefined
  let amountOut: bigint | undefined
  let lastErr: unknown
  for (const candidate of pathCandidates(from, to)) {
    try {
      const amounts: bigint[] = await provider
        .call({
          to: ALLTRA_ROUTER,
          data: iface.encodeFunctionData('getAmountsOut', [amountIn, candidate]),
        })
        .then((data) => iface.decodeFunctionResult('getAmountsOut', data)[0] as bigint[])
      const out = amounts[amounts.length - 1]
      if (out && out > 0n) {
        path = candidate
        amountOut = out
        break
      }
    } catch (err) {
      lastErr = err
    }
  }
  if (!path || !amountOut) {
    throw new Error(
      lastErr instanceof Error ? lastErr.message : 'No on-chain liquidity for path',
    )
  }

  const amountOutMin = (amountOut * BigInt(10_000 - slippageBps)) / 10_000n
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60)

  let callData: string
  let value = 0n
  let method: string
  if (fromIsNative) {
    method = 'swapExactETHForTokens'
    callData = iface.encodeFunctionData(method, [amountOutMin, path, recipient, deadline])
    value = amountIn
  } else if (toIsNative) {
    method = 'swapExactTokensForETH'
    callData = iface.encodeFunctionData(method, [
      amountIn,
      amountOutMin,
      path,
      recipient,
      deadline,
    ])
  } else {
    method = 'swapExactTokensForTokens'
    callData = iface.encodeFunctionData(method, [
      amountIn,
      amountOutMin,
      path,
      recipient,
      deadline,
    ])
  }

  const tx: PouchpayTransactionRequest = {
    chainId: ALLTRA_CHAIN_ID,
    from: recipient,
    to: ALLTRA_ROUTER,
    data: callData,
    value: '0x' + value.toString(16),
    gasLimit: '0x493e0',
  }

  const humanIn = formatUnits(amountIn, from.decimals)
  const humanOut = formatUnits(amountOut, to.decimals)

  return {
    chainId: ALLTRA_CHAIN_ID,
    fromSymbol: from.symbol,
    toSymbol: to.symbol,
    amountIn: humanIn,
    amountOut: humanOut.replace(/\.?0+$/, ''),
    path,
    router: ALLTRA_ROUTER,
    callData,
    transactionRequest: tx,
    onChainLiquidity: true,
    method,
    minAmountOut: formatUnits(amountOutMin, to.decimals),
    provider: 'pouchpay',
    httpStatus: 200,
    status: 'green',
    color: 'green',
    ok: true,
  }
}
