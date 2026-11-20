import { IsNotEmpty, IsBoolean } from 'class-validator';

export class RespondSwapRequestDto {
  @IsNotEmpty()
  @IsBoolean()
  accept: boolean;
}
