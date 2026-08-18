import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [S3Module],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
