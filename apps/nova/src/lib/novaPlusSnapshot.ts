/** Auto-synced snapshot from Nova Bank production ecosystem tokens (Nova Plus). */
export interface NovaPlusTokenSnap {
  symbol: string
  name: string
  decimals: number
  assetClass: 'native' | 'erc20' | 'crypto' | 'fiat' | string
  chainIds: number[]
  tradable: boolean
  swappable: boolean
  transferable: boolean
  decentralized: boolean
  usd: number
  coingeckoId: string | null
}

export const NOVA_PLUS_SNAPSHOT: NovaPlusTokenSnap[] = [
  {
    "symbol": "NOVA",
    "name": "NovaONE Native",
    "decimals": 18,
    "assetClass": "native",
    "chainIds": [
      22016,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 1,
    "coingeckoId": null
  },
  {
    "symbol": "NRW",
    "name": "NRW World Native",
    "decimals": 18,
    "assetClass": "native",
    "chainIds": [
      33001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 1,
    "coingeckoId": null
  },
  {
    "symbol": "USD",
    "name": "US Dollar",
    "decimals": 2,
    "assetClass": "fiat",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": false,
    "usd": 1,
    "coingeckoId": null
  },
  {
    "symbol": "EUR",
    "name": "Euro",
    "decimals": 2,
    "assetClass": "fiat",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": false,
    "usd": 1.08,
    "coingeckoId": null
  },
  {
    "symbol": "GBP",
    "name": "British Pound",
    "decimals": 2,
    "assetClass": "fiat",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": false,
    "usd": 1.27,
    "coingeckoId": null
  },
  {
    "symbol": "AUD",
    "name": "Australian Dollar",
    "decimals": 2,
    "assetClass": "fiat",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": false,
    "usd": 0.66,
    "coingeckoId": null
  },
  {
    "symbol": "CHF",
    "name": "Swiss Franc",
    "decimals": 2,
    "assetClass": "fiat",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": false,
    "usd": 1.12,
    "coingeckoId": null
  },
  {
    "symbol": "JPY",
    "name": "Japanese Yen",
    "decimals": 0,
    "assetClass": "fiat",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": false,
    "usd": 0.0067,
    "coingeckoId": null
  },
  {
    "symbol": "SDG",
    "name": "Sudanese Pound",
    "decimals": 2,
    "assetClass": "fiat",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": false,
    "usd": 0.0017,
    "coingeckoId": null
  },
  {
    "symbol": "CNY",
    "name": "Sudanese Pound",
    "decimals": 2,
    "assetClass": "fiat",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": false,
    "usd": 0.14,
    "coingeckoId": null
  },
  {
    "symbol": "USDC",
    "name": "USD Coin",
    "decimals": 6,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 1,
    "coingeckoId": "usd-coin"
  },
  {
    "symbol": "USDT",
    "name": "Tether USD",
    "decimals": 6,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 1,
    "coingeckoId": "tether"
  },
  {
    "symbol": "ETH",
    "name": "Ether",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 3500,
    "coingeckoId": "ethereum"
  },
  {
    "symbol": "BTC",
    "name": "Bitcoin",
    "decimals": 8,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 95000,
    "coingeckoId": "bitcoin"
  },
  {
    "symbol": "TRX",
    "name": "TRON",
    "decimals": 6,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.12,
    "coingeckoId": "tron"
  },
  {
    "symbol": "SOL",
    "name": "Solana",
    "decimals": 9,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 145,
    "coingeckoId": "solana"
  },
  {
    "symbol": "BNB",
    "name": "BNB",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 600,
    "coingeckoId": "binancecoin"
  },
  {
    "symbol": "MATIC",
    "name": "Polygon",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.55,
    "coingeckoId": "matic-network"
  },
  {
    "symbol": "ANKA",
    "name": "AnakaChain",
    "decimals": 18,
    "assetClass": "native",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.25,
    "coingeckoId": null
  },
  {
    "symbol": "ALL",
    "name": "ALLTRA Native",
    "decimals": 18,
    "assetClass": "native",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.08,
    "coingeckoId": null
  },
  {
    "symbol": "$BUCKS",
    "name": "DOLLAR BUCKS",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.01,
    "coingeckoId": null
  },
  {
    "symbol": "11::11",
    "name": "11:11",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.045,
    "coingeckoId": null
  },
  {
    "symbol": "ACX",
    "name": "ACX",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.18,
    "coingeckoId": null
  },
  {
    "symbol": "AUDA",
    "name": "MOOLA",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.66,
    "coingeckoId": null
  },
  {
    "symbol": "AUSDC",
    "name": "Alltra USD Coin (USDC)",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 1,
    "coingeckoId": null
  },
  {
    "symbol": "AUSDT",
    "name": "Alltra USD Token (USDT)",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 1,
    "coingeckoId": null
  },
  {
    "symbol": "BRK",
    "name": "Break",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.02,
    "coingeckoId": null
  },
  {
    "symbol": "CHT",
    "name": "ChatCoin",
    "decimals": 8,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.03,
    "coingeckoId": null
  },
  {
    "symbol": "FIRE",
    "name": "Ignition",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.04,
    "coingeckoId": null
  },
  {
    "symbol": "FLKR",
    "name": "Fliker",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.02,
    "coingeckoId": null
  },
  {
    "symbol": "FSH",
    "name": "Fresh",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.015,
    "coingeckoId": null
  },
  {
    "symbol": "GLD1111",
    "name": "11::11 1/1000 1 Oz Gold",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 2.4,
    "coingeckoId": null
  },
  {
    "symbol": "HYBX",
    "name": "HYBX",
    "decimals": 8,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.08,
    "coingeckoId": null
  },
  {
    "symbol": "HYDX",
    "name": "Hyper-Dex Exchange",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.07,
    "coingeckoId": null
  },
  {
    "symbol": "ICX",
    "name": "ICX",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.09,
    "coingeckoId": null
  },
  {
    "symbol": "MONEEZ",
    "name": "ReelMoneez",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.01,
    "coingeckoId": null
  },
  {
    "symbol": "NSB-AUSDT",
    "name": "NSB AUSDT (SP Monza Reserve)",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 1,
    "coingeckoId": null
  },
  {
    "symbol": "PAYINQ",
    "name": "Payinq",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.05,
    "coingeckoId": null
  },
  {
    "symbol": "PSS",
    "name": "PASS",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.03,
    "coingeckoId": null
  },
  {
    "symbol": "SFY",
    "name": "Staffy",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.04,
    "coingeckoId": null
  },
  {
    "symbol": "SHIVA",
    "name": "SHIVA",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.12,
    "coingeckoId": null
  },
  {
    "symbol": "SKSH",
    "name": "Skosh",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.02,
    "coingeckoId": null
  },
  {
    "symbol": "SON",
    "name": "Odin",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.03,
    "coingeckoId": null
  },
  {
    "symbol": "TN8",
    "name": "TorN8ion",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.02,
    "coingeckoId": null
  },
  {
    "symbol": "USDT-LEGACY",
    "name": "USD Token (Legacy)",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 1,
    "coingeckoId": null
  },
  {
    "symbol": "VCE",
    "name": "VOICE",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.05,
    "coingeckoId": null
  },
  {
    "symbol": "WALL",
    "name": "Wrapped Alltra",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.02,
    "coingeckoId": null
  },
  {
    "symbol": "WBTC",
    "name": "Alltra Wrapped BTC Token",
    "decimals": 8,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 95000,
    "coingeckoId": "wrapped-bitcoin"
  },
  {
    "symbol": "WETH",
    "name": "Wrapped Ether",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 3500,
    "coingeckoId": "weth"
  },
  {
    "symbol": "WBNB",
    "name": "Wrapped BNB (ALLTRA)",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 600,
    "coingeckoId": "wbnb"
  },
  {
    "symbol": "WTRX",
    "name": "Wrapped TRX (ALLTRA)",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.12,
    "coingeckoId": "wrapped-tron"
  },
  {
    "symbol": "ZRG",
    "name": "Zaragoza",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.03,
    "coingeckoId": null
  },
  {
    "symbol": "ZARA",
    "name": "Zaragoza USD Peg",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.04,
    "coingeckoId": null
  },
  {
    "symbol": "USDT-TRC20",
    "name": "Tether USD (TRC20)",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 1,
    "coingeckoId": null
  },
  {
    "symbol": "USDT-BNB",
    "name": "Tether USD (BNB / BEP20)",
    "decimals": 18,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 1,
    "coingeckoId": null
  },
  {
    "symbol": "XRP",
    "name": "XRP",
    "decimals": 6,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.62,
    "coingeckoId": "ripple"
  },
  {
    "symbol": "E1111",
    "name": "11:11 Coin",
    "decimals": 6,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.045,
    "coingeckoId": null
  },
  {
    "symbol": "VICTORYA",
    "name": "Victoria Coin",
    "decimals": 6,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.06,
    "coingeckoId": null
  },
  {
    "symbol": "KUSD",
    "name": "K USD",
    "decimals": 6,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 1,
    "coingeckoId": null
  },
  {
    "symbol": "ANAKA",
    "name": "Anaka Coin",
    "decimals": 6,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 0.15,
    "coingeckoId": null
  },
  {
    "symbol": "CUSDT",
    "name": "Custodial USDT",
    "decimals": 6,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 1,
    "coingeckoId": null
  },
  {
    "symbol": "CUSDC",
    "name": "Custodial USDC",
    "decimals": 6,
    "assetClass": "crypto",
    "chainIds": [
      22016,
      33001,
      9001
    ],
    "tradable": true,
    "swappable": true,
    "transferable": true,
    "decentralized": true,
    "usd": 1,
    "coingeckoId": null
  }
]

export const NOVA_PLUS_CHAIN_IDS = [22016, 33001, 9001] as const
export const NOVA_PLUS_SYNCED_AT = '2026-07-19T10:43:59.268Z'
