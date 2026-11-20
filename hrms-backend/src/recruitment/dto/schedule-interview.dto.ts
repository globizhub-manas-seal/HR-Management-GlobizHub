import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  InterviewMode,
  InterviewStatus,
  InterviewerRole,
} from '../../../generated/prisma/client';

export class InterviewerAssignmentDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsEnum(InterviewerRole)
  @IsOptional()
  role?: InterviewerRole = InterviewerRole.PANEL;
}

export class ScheduleInterviewDto {
  @IsString()
  @IsNotEmpty()
  interviewRoundId: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsNumber()
  @Min(10)
  @IsOptional()
  durationMinutes?: number;

  @IsString()
  @IsOptional()
  timezone?: string = 'Asia/Kolkata';

  @IsEnum(InterviewMode)
  @IsNotEmpty()
  mode: InterviewMode;

  @IsString()
  @IsOptional()
  meetingLink?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterviewerAssignmentDto)
  @IsNotEmpty()
  interviewers: InterviewerAssignmentDto[];
}

export class RescheduleInterviewDto {
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsNumber()
  @Min(10)
  @IsOptional()
  durationMinutes?: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  meetingLink?: string;

  @IsString()
  @IsOptional()
  location?: string;
}

export class UpdateInterviewStatusDto {
  @IsEnum(InterviewStatus)
  @IsNotEmpty()
  status: InterviewStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
