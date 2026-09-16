import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class CandidateDecisionDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['SELECTED', 'REJECTED'])
  decision: 'SELECTED' | 'REJECTED';

  @IsString()
  @IsOptional()
  notes?: string;
}
