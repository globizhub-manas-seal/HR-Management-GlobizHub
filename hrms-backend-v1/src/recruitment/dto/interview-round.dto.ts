import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InterviewRoundType } from '../../../generated/prisma/client';

export class CreateCriterionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxRating?: number;

  @IsNumber()
  @IsOptional()
  sequence?: number;
}

export class CreateInterviewRoundDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(InterviewRoundType)
  @IsNotEmpty()
  type: InterviewRoundType;

  @IsNumber()
  @Min(1)
  @IsOptional()
  sequence?: number;

  @IsNumber()
  @Min(10)
  @IsOptional()
  durationMinutes?: number;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCriterionDto)
  @IsOptional()
  criteria?: CreateCriterionDto[];
}

export class UpdateInterviewRoundDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(InterviewRoundType)
  @IsOptional()
  type?: InterviewRoundType;

  @IsNumber()
  @Min(1)
  @IsOptional()
  sequence?: number;

  @IsNumber()
  @Min(10)
  @IsOptional()
  durationMinutes?: number;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCriterionDto)
  @IsOptional()
  criteria?: CreateCriterionDto[];
}
