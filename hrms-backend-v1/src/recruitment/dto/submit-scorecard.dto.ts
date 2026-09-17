import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScorecardRecommendation } from '../../../generated/prisma/client';

export class CriterionEvaluationDto {
  @IsString()
  @IsNotEmpty()
  criterionId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class SubmitScorecardDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  overallRating?: number;

  @IsEnum(ScorecardRecommendation)
  @IsNotEmpty()
  recommendation: ScorecardRecommendation;

  @IsString()
  @IsOptional()
  strengths?: string;

  @IsString()
  @IsOptional()
  concerns?: string;

  @IsString()
  @IsOptional()
  privateNotes?: string;

  @IsString()
  @IsOptional()
  sharedFeedback?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterionEvaluationDto)
  @IsOptional()
  evaluations?: CriterionEvaluationDto[];
}
