import { Module } from '@nestjs/common'
import { PouchpayCalldataController } from './pouchpay-calldata.controller'
import { PouchpayRoutesController } from './pouchpay-routes.controller'
import { PouchpayCalldataService } from './calldata.service'

@Module({
  controllers: [PouchpayCalldataController, PouchpayRoutesController],
  providers: [PouchpayCalldataService],
  exports: [PouchpayCalldataService],
})
export class PouchpayCalldataModule {}
