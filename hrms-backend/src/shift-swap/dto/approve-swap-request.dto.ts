import { IsNotEmpty, IsBoolean } from 'class-validator';

export class ApproveSwapRequestDto {
  @IsNotEmpty()
  @IsBoolean()
  approve: boolean;
}
