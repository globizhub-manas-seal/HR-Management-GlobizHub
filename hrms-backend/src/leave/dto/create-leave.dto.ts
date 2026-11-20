import {
  IsNotEmpty,
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
} from 'class-validator';
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

  @IsBoolean()
  @IsOptional()
  isHalfDay?: boolean;

  @IsIn(['FIRST_HALF', 'SECOND_HALF'])
  @IsOptional()
  halfDaySession?: 'FIRST_HALF' | 'SECOND_HALF';
}
