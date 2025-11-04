import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentosController } from './presentation/documentos.controller';
import DocumentosService from './application/services/documentos.service';

@Module({
  imports: [ConfigModule],
  controllers: [DocumentosController],
  providers: [DocumentosService],
  exports: [DocumentosService],
})
export class DocumentosModule {}

export default DocumentosModule;
