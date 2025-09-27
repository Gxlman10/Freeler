import { Module } from '@nestjs/common';
import { LeadsController } from './presentation/leads.controller';

@Module({
  imports: [],
  controllers: [LeadsController],
  providers: [],
  exports: [],
})
export class LeadsModule {}
