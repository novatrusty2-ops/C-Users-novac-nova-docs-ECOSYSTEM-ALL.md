export type SettlementAccount = {
  id: string
  label: string
  accountHolder: string
  /** SEPA IBAN when applicable; for US ACH use accountNumber instead */
  iban?: string
  bic: string
  intermediaryBic?: string
  routingNumber?: string
  accountNumber?: string
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
    id: 'wise-eur-global-luxury',
    label: 'EUR · Wise · GLOBAL LUXURY SRLS',
    accountHolder: 'GLOBAL LUXURY SRLS',
    iban: 'BE18905804591765',
    bic: 'TRWIBEB1XXX',
    currency: 'EUR',
    bank: 'Wise',
    address: 'Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium',
  },
  {
    id: 'wise-usd-global-luxury',
    label: 'USD · Wise · GLOBAL LUXURY SRLS',
    accountHolder: 'GLOBAL LUXURY SRLS',
    bic: 'TRWIUS35XXX',
    routingNumber: '084009519',
    accountNumber: '515842398651352',
    currency: 'USD',
    bank: 'Wise US Inc',
    address: '108 W 13th St, Wilmington, DE, 19801, United States',
  },
]

/** Value to send as beneficiaryIban on sandbox receive */
export function beneficiaryAccountRef(account: SettlementAccount): string {
  if (account.iban) return account.iban
  if (account.accountNumber) return account.accountNumber
  return ''
}

export function accountById(id: string): SettlementAccount {
  return SETTLEMENT_ACCOUNTS.find((a) => a.id === id) || SETTLEMENT_ACCOUNTS[0]
}
