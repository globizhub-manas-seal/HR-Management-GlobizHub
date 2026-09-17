import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  roleId?: string;

  @IsArray()
  @IsOptional()
  taskChecklist?: Array<{
    title: string;
    description?: string;
    requiredForActivation?: boolean;
    dueDaysFromJoin?: number;
  }>;

  @IsArray()
  @IsOptional()
  documentChecklist?: Array<{
    name: string;
    category: string;
    requiresSign?: boolean;
    required?: boolean;
    description?: string;
  }>;
}
