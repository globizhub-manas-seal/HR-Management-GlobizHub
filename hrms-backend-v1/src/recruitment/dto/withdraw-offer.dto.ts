import { IsNotEmpty, IsString } from 'class-validator';

export class WithdrawOfferDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
