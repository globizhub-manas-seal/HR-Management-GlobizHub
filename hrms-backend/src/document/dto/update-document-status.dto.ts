import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { DocumentStatus } from '../../../generated/prisma/client';

export class UpdateDocumentStatusDto {
  @IsNotEmpty()
  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
