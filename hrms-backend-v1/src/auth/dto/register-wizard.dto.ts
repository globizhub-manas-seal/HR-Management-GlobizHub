import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';

export class RegisterWizardDto {
  @IsString() companyName: string;
  @IsString() @IsOptional() industry?: string;
  @IsString() @IsOptional() companySize?: string;
  @IsEmail() email: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() website?: string;
  
  // Missing Company Details
  @IsString() @IsOptional() gstin?: string;
  @IsString() @IsOptional() pan?: string;
  @IsString() @IsOptional() cin?: string;
  
  // Missing Admin Details
  @IsString() adminFirstName: string;
  @IsString() adminLastName: string;
  @IsEmail() adminEmail: string;
  @IsString() @IsOptional() adminPhone?: string;
  @IsString() @IsOptional() adminPassword?: string;
  @IsString() @IsOptional() timeZone?: string;

  
 
  
  
  

  @IsArray() @IsString({ each: true }) @IsOptional() departments?: string[];
  @IsArray() @IsString({ each: true }) @IsOptional() roles?: string[];
  @IsArray() @IsString({ each: true }) @IsOptional() salaryComponents?: string[];
  @IsArray() @IsString({ each: true }) @IsOptional() leavePolicies?: string[];
  @IsArray() @IsString({ each: true }) @IsOptional() shifts?: string[];
  @IsArray() @IsString({ each: true }) @IsOptional() branches?: string[];
  
  @IsString() @IsOptional() holidayRegion?: string;
  @IsString() @IsOptional() inviteEmails?: string;
  
  @IsString() @IsOptional() themeColor?: string;
  @IsArray() @IsString({ each: true }) @IsOptional() workDays?: string[];
  @IsString() @IsOptional() shiftStartTime?: string;
  @IsString() @IsOptional() shiftEndTime?: string;
  @IsString() @IsOptional() attendanceMethod?: string;
}