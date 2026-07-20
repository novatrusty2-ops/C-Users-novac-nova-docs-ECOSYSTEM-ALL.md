/** Ecosystem partner integrations for Nova Wallet */

export interface PartnerWallet {
  id: string
  name: string
  role: string
  url: string
  secondaryUrl?: string
  accent: string
  /** Same HD address works across these chain IDs */
  sharedChains: number[]
  notes: string
}

export const PARTNERS: PartnerWallet[] = [
  {
    id: 'novaplus',
    name: 'Nova Plus Wallet',
    role: 'Production mesh wallet — NovaONE · NRW · Nova Plus + 7 bridge currencies',
    url: 'https://novablockchain.it.com/',
    secondaryUrl: 'https://nova-bank-api-production-7311.up.railway.app',
    accent: '#38BDF8',
    sharedChains: [22016, 33001, 9001, 11013],
    notes:
      'Nova Plus Wallet shares your HD address across NovaONE (22016), NRW World (33001), Nova Plus (9001), and Anaka Bridge (11013). All production tokens plus USD·EUR·GBP·AUD·CHF·JPY·SDG bridge currencies auto-import with full price & liquidity.',
  },
  {
    id: 'pouchpay',
    name: 'PouchPay Wallet',
    role: 'ALLTRA / PouchPay payments wallet',
    url: 'https://play.google.com/store/apps/details?id=global.alltra.app',
    secondaryUrl: 'https://alltra.global/',
    accent: '#E8D48B',
    sharedChains: [651940, 22016, 33001],
    notes:
      'PouchPay-Alltra is the ALLTRA ecosystem wallet. Enable Alltra Global World (651940) in Nova Networks, then use the same EVM address for PouchPay deposits when supported.',
  },
]

export const ECOSYSTEM_LINKS = {
  novaBank: 'https://nova-bank-api-production-7311.up.railway.app',
  novaSwap: 'https://nova-bank-api-production-7311.up.railway.app/swap',
  novaOneExplorer: 'https://novaone.anakatech.llc/',
  nrwCentralBank: 'https://nrw-central-bank-api-production.up.railway.app',
  walletNetworksApi: 'https://nova-bank-api-production-7311.up.railway.app/api/v1/wallet/networks',
  ecosystemTokensApi:
    'https://nova-bank-api-production-7311.up.railway.app/api/v1/chains/ecosystem/tokens',
  defiOracleWallet: 'https://wallet.defi-oracle.io/wallet/',
  /** Nova Plus — 3-chain mesh (NovaONE · NRW · Production) */
  novaPlus: 'https://novablockchain.it.com/',
} as const

export function getPartner(id: string): PartnerWallet | undefined {
  return PARTNERS.find((p) => p.id === id)
}
