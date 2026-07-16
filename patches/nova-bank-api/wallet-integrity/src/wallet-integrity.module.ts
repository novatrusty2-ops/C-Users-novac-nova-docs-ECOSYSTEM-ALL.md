import { DynamicModule, Module, Provider } from '@nestjs/common';
import { InMemoryWalletIntegrityStore } from './in-memory.store';
import { WALLET_INTEGRITY_STORE, WalletIntegrityStore } from './store.interface';
import { WalletIntegrityController } from './wallet-integrity.controller';
import { WalletIntegrityService } from './wallet-integrity.service';

@Module({})
export class WalletIntegrityModule {
  /**
   * Production: pass your TypeORM/Prisma-backed store.
   * Tests / local: omit store to use in-memory.
   */
  static register(options?: {
    store?: WalletIntegrityStore;
  }): DynamicModule {
    const storeProvider: Provider = {
      provide: WALLET_INTEGRITY_STORE,
      useValue: options?.store ?? new InMemoryWalletIntegrityStore(),
    };

    return {
      module: WalletIntegrityModule,
      controllers: [WalletIntegrityController],
      providers: [storeProvider, WalletIntegrityService],
      exports: [WalletIntegrityService],
    };
  }
}
