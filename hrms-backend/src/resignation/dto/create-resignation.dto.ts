import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateResignationDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  reasonDetails?: string;

  @IsNotEmpty()
  requestedLastWorkingDay: string | Date;
}
