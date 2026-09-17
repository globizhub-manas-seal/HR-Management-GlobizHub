import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsArray,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export enum HiringReasonEnum {
  NEW_POSITION = 'NEW_POSITION',
  REPLACEMENT = 'REPLACEMENT',
  EXPANSION = 'EXPANSION',
}

export enum RecruitmentEmploymentTypeEnum {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
}

export class CreateManpowerRequisitionDto {
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @IsString()
  @IsNotEmpty()
  designationId: string;

  @IsInt()
  @Min(1)
  positionsCount: number = 1;

  @IsOptional()
  @IsEnum(RecruitmentEmploymentTypeEnum)
  employmentType?: RecruitmentEmploymentTypeEnum =
    RecruitmentEmploymentTypeEnum.FULL_TIME;

  @IsOptional()
  @IsString()
  location?: string;

  @IsEnum(HiringReasonEnum)
  hiringReason: HiringReasonEnum = HiringReasonEnum.NEW_POSITION;

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
  currency?: string = 'INR';

  @IsOptional()
  @IsDateString()
  expectedJoiningDate?: string;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsOptional()
  @IsBoolean()
  isBudgeted?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetAmount?: number;
}
