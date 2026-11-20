import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewResignationDto {
  @IsString()
  @IsNotEmpty()
  decision: 'APPROVED' | 'REJECTED';

  @IsString()
  @IsOptional()
  comment?: string;

  @IsOptional()
  approvedLastWorkingDay?: string | Date;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
