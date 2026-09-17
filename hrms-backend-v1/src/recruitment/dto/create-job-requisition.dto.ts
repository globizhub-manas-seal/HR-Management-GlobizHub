import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScreeningQuestionDto } from './screening-question.dto';

export enum DirectJobReasonEnum {
  DIRECT_HIRE = 'DIRECT_HIRE',
  REPLACEMENT = 'REPLACEMENT',
  EMERGENCY_HIRE = 'EMERGENCY_HIRE',
  INTERNAL_POSITION = 'INTERNAL_POSITION',
}

export enum WorkplaceTypeEnum {
  ON_SITE = 'ON_SITE',
  HYBRID = 'HYBRID',
  REMOTE = 'REMOTE',
}

export class CreateJobRequisitionDto {
  @IsOptional()
  @IsString()
  manpowerRequisitionId?: string;

  @IsOptional()
  @IsEnum(DirectJobReasonEnum)
  directHiringReason?: DirectJobReasonEnum;

  @IsOptional()
  @IsString()
  directHiringJustification?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @IsOptional()
  @IsString()
  designationId?: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsOptional()
  @IsEnum(WorkplaceTypeEnum)
  workplaceType?: WorkplaceTypeEnum = WorkplaceTypeEnum.ON_SITE;

  @IsOptional()
  @IsString()
  employmentType?: string = 'FULL_TIME';

  @IsInt()
  @Min(1)
  openings: number = 1;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  responsibilities: string;

  @IsString()
  @IsNotEmpty()
  requirements: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScreeningQuestionDto)
  screeningQuestions?: ScreeningQuestionDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @IsBoolean()
  showSalaryRange?: boolean = false;

  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;
}
