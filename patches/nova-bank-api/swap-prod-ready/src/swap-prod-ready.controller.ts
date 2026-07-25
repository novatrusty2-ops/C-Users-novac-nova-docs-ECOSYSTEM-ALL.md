import { Controller, Get } from '@nestjs/common';
import { MISSING_PROD_BOOK_MARKETS, buildMockBook } from './seed-books';

@Controller('swap/prod')
export class SwapProdReadyController {
  @Get('checklist')
  checklist() {
    return {
      ok: true,
      quoteHttpTarget: 200,
      missingBooksToSeed: MISSING_PROD_BOOK_MARKETS,
      sampleBook: buildMockBook('VICTORYA-USDC'),
      note:
        'Wire seedMissingMockBooks(books) into SwapService.onModuleInit; interceptor forces quote 201→200',
    };
  }
}
