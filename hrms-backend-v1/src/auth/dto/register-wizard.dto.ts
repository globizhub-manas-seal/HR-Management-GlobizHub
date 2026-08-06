// src/auth/dto/register-wizard.dto.ts
import { IsString, IsArray, IsOptional, IsEmail } from 'class-validator';

export class RegisterWizardDto {
  // Step 1: Basic Info
  @IsString() companyName: string;
  @IsString() industry: string;
  @IsString() companySize: string;
  @IsEmail() email: string;
  @IsString() phone: string;
  @IsOptional() @IsString() website?: string;
  
  @IsString() adminFullName: string;
  @IsEmail() adminEmail: string;
  @IsString() adminPhone: string;
  
  // Step 2: Settings
  @IsString() themeColor: string;
  @IsArray() workDays: string[];
  @IsString() shiftStartTime: string;
  @IsString() shiftEndTime: string;
  @IsString() attendanceMethod: string;

  // Organizational Structure
  @IsArray() departments: string[];
  @IsArray() roles: string[];

  // Data for future modules (Payroll, Leaves, etc.)
  @IsOptional() @IsString() holidayRegion?: string;
  @IsArray() leavePolicies: string[];
  @IsArray() shifts: string[];
  @IsArray() branches: string[];
  @IsArray() salaryComponents: string[];
  @IsOptional() @IsString() inviteEmails?: string;
}