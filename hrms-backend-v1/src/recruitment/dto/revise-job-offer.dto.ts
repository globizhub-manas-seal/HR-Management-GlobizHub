import { IsString, IsNotEmpty } from 'class-validator';
import { CreateJobOfferDto } from './create-job-offer.dto';

export class ReviseJobOfferDto extends CreateJobOfferDto {
  @IsString()
  @IsNotEmpty()
  revisionReason: string;
}
