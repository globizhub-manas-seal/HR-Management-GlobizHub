import {
  IsNotEmpty,
  IsEnum,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { LeaveType, PeriodType } from '../../../generated/prisma/client';

export class CreateLeavePolicyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(LeaveType)
  @IsNotEmpty()
  type: LeaveType;

  @IsNumber()
  @IsNotEmpty()
  daysPerYear: number;

  @IsEnum(PeriodType)
  @IsOptional()
  periodType?: PeriodType;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsBoolean()
  @IsOptional()
  carryForward?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;
}
