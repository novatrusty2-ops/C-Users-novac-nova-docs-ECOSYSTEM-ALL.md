import { Interface, JsonRpcProvider, parseUnits, formatUnits } from 'ethers'
import {
  ALLTRA_CHAIN_ID,
  ALLTRA_ROUTER,
  type PouchpayRouteQuote,
  type PouchpayTransactionRequest,
} from './routes'

const NATIVE = '0x0000000000000000000000000000000000000000'
const WALL = '0x2da2b8f961f161ab6320acb3377e2e844a3c3ce4'
const DEFAULT_RPC = 'https://mainnet-rpc.alltra.global'

const TOKENS: Record<string, { address: string; decimals: number; native?: boolean }> = {
  ALL: { address: NATIVE, decimals: 18, native: true },
  WALL: { address: WALL, decimals: 18 },
  AUSDT: { address: '0x015b1897ed5279930bc2be46f661894d219292a6', decimals: 18 },
  AUSDC: { address: '0xcf5423f2e06878bb23fe914519339be739e6c6b1', decimals: 18 },
  USDC: { address: '0xa95eed79f84e6a0151eaeb9d441f9ffd50e8e881', decimals: 18 },
  WETH: { address: '0x798f6762bb40d6801a593459d08f890603d3979c', decimals: 18 },
  HYDX: { address: '0x0d9793861aeb9244ad1b34375a83a6730f6add38', decimals: 18 },
}

const ROUTER_ABI = [
  'function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)',
  'function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable',
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
  'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
]

const iface = new Interface(ROUTER_ABI)

function resolve(symbol: string) {
  const t = TOKENS[symbol.trim().toUpperCase()]
  if (!t) throw new Error(`Unknown Alltra token: ${symbol}`)
  return t
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
  const path = [fromIsNative ? WALL : from.address, toIsNative ? WALL : to.address]
  if (path[0].toLowerCase() === path[1].toLowerCase()) throw new Error('Same token')

  const amountIn = parseUnits(amount, from.decimals)
  const provider = new JsonRpcProvider(rpc, ALLTRA_CHAIN_ID)
  const amounts: bigint[] = await provider.call({
    to: ALLTRA_ROUTER,
    data: iface.encodeFunctionData('getAmountsOut', [amountIn, path]),
  }).then((data) => iface.decodeFunctionResult('getAmountsOut', data)[0] as bigint[])

  const amountOut = amounts[amounts.length - 1]
  if (!amountOut || amountOut <= 0n) throw new Error('No on-chain liquidity for path')
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
    fromSymbol: fromSymbol.toUpperCase(),
    toSymbol: toSymbol.toUpperCase(),
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
