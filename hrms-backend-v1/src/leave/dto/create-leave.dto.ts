import { IsEnum, IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { LeaveType } from '../../../generated/prisma/client'; // <-- Updated import path
export class CreateLeaveDto {
  @IsEnum(LeaveType)
  @IsNotEmpty()
  type: LeaveType;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}