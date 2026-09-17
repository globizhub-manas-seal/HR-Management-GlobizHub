import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateApplicationStatusDto {
  @IsIn(['APPLIED', 'SCREENING', 'SHORTLISTED', 'REJECTED'])
  @IsNotEmpty()
  status: 'APPLIED' | 'SCREENING' | 'SHORTLISTED' | 'REJECTED';

  @IsOptional()
  @IsString()
  notes?: string;
}
