import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum OfferReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewJobOfferDto {
  @IsEnum(OfferReviewAction)
  @IsNotEmpty()
  action: OfferReviewAction;

  @IsString()
  @IsOptional()
  comments?: string;
}
