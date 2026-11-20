import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsNotEmpty,
} from 'class-validator';

export class ApproveRequisitionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetAmount?: number;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class RequestChangesDto {
  @IsString()
  @IsNotEmpty({ message: 'Comments are mandatory when requesting changes' })
  comments: string;
}

export class RejectRequisitionDto {
  @IsString()
  @IsNotEmpty({
    message: 'Comments/reason are mandatory when rejecting a requisition',
  })
  comments: string;
}
