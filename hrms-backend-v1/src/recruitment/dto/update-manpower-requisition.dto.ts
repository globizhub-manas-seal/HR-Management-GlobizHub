import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsArray,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import {
  HiringReasonEnum,
  RecruitmentEmploymentTypeEnum,
} from './create-manpower-requisition.dto';

export class UpdateManpowerRequisitionDto {
  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  designationId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  positionsCount?: number;

  @IsOptional()
  @IsEnum(RecruitmentEmploymentTypeEnum)
  employmentType?: RecruitmentEmploymentTypeEnum;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(HiringReasonEnum)
  hiringReason?: HiringReasonEnum;

  @IsOptional()
  @IsString()
  replacementForId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minExperienceYears?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxExperienceYears?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSalary?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  expectedJoiningDate?: string;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsOptional()
  @IsBoolean()
  isBudgeted?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetAmount?: number;
}
