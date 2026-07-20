import { DynamicModule, Module, Provider } from '@nestjs/common';
import { OpenPaydController } from './openpayd.controller';
import {
  OpenPaydLedgerHook,
  OpenPaydService,
} from './openpayd.service';

export const OPENPAYD_LEDGER_HOOK = Symbol('OPENPAYD_LEDGER_HOOK');

@Module({})
export class OpenPaydModule {
  /**
   * Production: pass a ledger hook that credits/debits Nova accounts.
   * Local: omit hook for status/health/oauth-only install.
   */
  static register(options?: {
    ledger?: OpenPaydLedgerHook;
  }): DynamicModule {
    const ledgerProvider: Provider = {
      provide: OPENPAYD_LEDGER_HOOK,
      useValue: options?.ledger ?? {},
    };

    return {
      module: OpenPaydModule,
      controllers: [OpenPaydController],
      providers: [
        ledgerProvider,
        {
          provide: OpenPaydService,
          useFactory: (ledger: OpenPaydLedgerHook) =>
            new OpenPaydService(ledger),
          inject: [OPENPAYD_LEDGER_HOOK],
        },
      ],
      exports: [OpenPaydService],
    };
  }
}
