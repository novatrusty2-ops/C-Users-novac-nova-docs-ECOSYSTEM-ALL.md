import { DynamicModule, Module, Provider } from '@nestjs/common';
import { NovaPayController } from './novapay.controller';
import { NovaPayLedgerHook, NovaPayService } from './novapay.service';

export const NOVAPAY_LEDGER_HOOK = Symbol('NOVAPAY_LEDGER_HOOK');

@Module({})
export class NovaPayModule {
  static register(options?: { ledger?: NovaPayLedgerHook }): DynamicModule {
    const ledgerProvider: Provider = {
      provide: NOVAPAY_LEDGER_HOOK,
      useValue: options?.ledger ?? {},
    };

    return {
      module: NovaPayModule,
      controllers: [NovaPayController],
      providers: [
        ledgerProvider,
        {
          provide: NovaPayService,
          useFactory: (ledger: NovaPayLedgerHook) => new NovaPayService(ledger),
          inject: [NOVAPAY_LEDGER_HOOK],
        },
      ],
      exports: [NovaPayService],
    };
  }
}
