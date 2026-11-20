import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export enum OnboardingStatusDto {
  INVITED = 'INVITED',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  COMPLETED = 'COMPLETED',
}

export class UpdateCaseStatusDto {
  @IsEnum(OnboardingStatusDto)
  @IsOptional()
  status?: OnboardingStatusDto;

  @IsBoolean()
  @IsOptional()
  offerSigned?: boolean;

  @IsString()
  @IsOptional()
  bgvStatus?: string; // PENDING, IN_PROGRESS, PASSED, FAILED, WAIVED

  @IsString()
  @IsOptional()
  notes?: string;
}
