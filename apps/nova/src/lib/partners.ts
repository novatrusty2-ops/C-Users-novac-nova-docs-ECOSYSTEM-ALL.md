/** Cross-wallet / ecosystem partner integrations for Nova Wallet */

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
    id: 'signet',
    name: 'Signet Wallet',
    role: 'Institutional self-custody · Anaka mesh + Safe',
    url: 'https://signetwallet.com',
    secondaryUrl: 'https://novablockchain.it.com',
    accent: '#C9A84C',
    sharedChains: [22016, 33001, 138, 11013, 651940, 1, 56],
    notes:
      'Signet uses the same BIP44 path (m/44\'/60\'/0\'/0/n). Import your Nova recovery phrase into Signet (or vice versa) to share addresses across the mesh.',
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
} as const

export function getPartner(id: string): PartnerWallet | undefined {
  return PARTNERS.find((p) => p.id === id)
}
