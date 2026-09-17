import { IsOptional, IsString, IsDateString } from 'class-validator';

export class ConvertCandidateDto {
  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  reportingManagerId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
