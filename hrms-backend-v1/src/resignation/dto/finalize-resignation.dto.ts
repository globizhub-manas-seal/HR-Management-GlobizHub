import { IsOptional, IsString } from 'class-validator';

export class FinalizeResignationDto {
  @IsString()
  @IsOptional()
  exitInterviewNotes?: string;
}
