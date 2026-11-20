import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { EmployeeRole } from './create-designation.dto';

export class UpdateDesignationDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsEnum(EmployeeRole)
  @IsOptional()
  baseRole?: EmployeeRole;
}
