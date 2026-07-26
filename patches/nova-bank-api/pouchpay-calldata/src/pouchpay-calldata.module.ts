import { Module } from '@nestjs/common'
import { PouchpayCalldataController } from './pouchpay-calldata.controller'

@Module({
  controllers: [PouchpayCalldataController],
})
export class PouchpayCalldataModule {}
