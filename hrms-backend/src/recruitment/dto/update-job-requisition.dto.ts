import {
  IsString,
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
import { WorkplaceTypeEnum } from './create-job-requisition.dto';
import { ScreeningQuestionDto } from './screening-question.dto';

export class UpdateJobRequisitionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  designationId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(WorkplaceTypeEnum)
  workplaceType?: WorkplaceTypeEnum;

  @IsOptional()
  @IsString()
  employmentType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  openings?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

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
  showSalaryRange?: boolean;

  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;
}
