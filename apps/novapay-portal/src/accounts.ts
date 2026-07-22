export type SettlementAccount = {
  id: string
  label: string
  accountHolder: string
  iban: string
  bic: string
  intermediaryBic?: string
  currency: 'EUR' | 'USD'
  bank: string
  address?: string
}

/** NovaPay configured settlement / beneficiary profiles */
export const SETTLEMENT_ACCOUNTS: SettlementAccount[] = [
  {
    id: 'revolut-eur-total-design',
    label: 'EUR · Revolut · TOTAL DESIGN S.R.L.',
    accountHolder: 'TOTAL DESIGN S.R.L.',
    iban: 'LT163250079884101461',
    bic: 'REVOLT21',
    intermediaryBic: 'CHASGB2L',
    currency: 'EUR',
    bank: 'Revolut Bank UAB',
  },
  {
    id: 'wise-usd-global-luxury',
    label: 'USD · Wise · GLOBAL LUXURY SRLS',
    accountHolder: 'GLOBAL LUXURY SRLS',
    iban: 'BE18905804591765',
    bic: 'TRWIBEB1XXX',
    currency: 'USD',
    bank: 'Wise',
    address: 'Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium',
  },
]

export function accountById(id: string): SettlementAccount {
  return SETTLEMENT_ACCOUNTS.find((a) => a.id === id) || SETTLEMENT_ACCOUNTS[0]
}
