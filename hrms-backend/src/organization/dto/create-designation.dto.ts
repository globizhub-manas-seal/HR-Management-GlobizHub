import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
} from 'class-validator';

export enum EmployeeRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HR_HEAD = 'HR_HEAD',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export class CreateDesignationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(EmployeeRole)
  @IsOptional()
  baseRole?: EmployeeRole;

  @IsString()
  @IsOptional()
  color?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sidebarModules?: string[];

  @IsObject()
  @IsOptional()
  modulePermissions?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dashboardWidgets?: string[];
}
