import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum CandidateOfferResponse {
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export class RecordOfferResponseDto {
  @IsEnum(CandidateOfferResponse)
  @IsNotEmpty()
  response: CandidateOfferResponse;

  @IsString()
  @IsOptional()
  declineReason?: string;
}
