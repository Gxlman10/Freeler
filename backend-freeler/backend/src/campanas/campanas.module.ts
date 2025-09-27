import { Module } from '@nestjs/common';
import { CampanasController } from './presentation/campanas.controller';

@Module({
  imports: [],
  controllers: [CampanasController],
  providers: [],
  exports: [],
})
export class CampanasModule {}
