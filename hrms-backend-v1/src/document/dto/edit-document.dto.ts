import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { DocumentCategory } from '../../../generated/prisma/client';

export class EditDocumentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @IsOptional()
  @IsString()
  employeeId?: string | null;
}
