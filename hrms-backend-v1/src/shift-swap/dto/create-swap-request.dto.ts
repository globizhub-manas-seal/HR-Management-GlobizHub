import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateSwapRequestDto {
  @IsNotEmpty()
  @IsString()
  targetEmployeeId: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  targetShiftId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
