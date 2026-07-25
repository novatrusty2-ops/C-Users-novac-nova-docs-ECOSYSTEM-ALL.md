import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SwapQuoteHttp200Interceptor } from './swap-quote-200.interceptor';
import { SwapProdReadyController } from './swap-prod-ready.controller';

@Module({
  controllers: [SwapProdReadyController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: SwapQuoteHttp200Interceptor,
    },
  ],
})
export class SwapProdReadyModule {}
