import { IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { LeaveType } from '../../../generated/prisma/client';

export class CreateLeaveDto {
  @IsEnum(LeaveType)
  @IsNotEmpty()
  type: LeaveType;

  @IsNotEmpty()
  startDate: string | Date;

  @IsNotEmpty()
  endDate: string | Date;

  @IsString()
  @IsNotEmpty()
  reason: string;
}