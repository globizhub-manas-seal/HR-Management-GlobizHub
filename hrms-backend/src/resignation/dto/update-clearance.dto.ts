import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateClearanceDto {
  @IsString()
  @IsNotEmpty()
  department: 'assets' | 'it' | 'finance' | 'hr';

  @IsBoolean()
  @IsNotEmpty()
  completed: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
