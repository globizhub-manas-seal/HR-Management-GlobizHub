import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { WorkplaceType } from '../../../generated/prisma/client';

export class CreateJobOfferDto {
  // Monthly Earnings (100% Payroll SalaryStructure Parity)
  @IsNumber()
  @Min(0)
  basicSalary: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  hra?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  conveyanceAllowance?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  medicalAllowance?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  specialAllowance?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  otherAllowances?: number = 0;

  @IsNumber()
  @Min(0)
  grossMonthly: number;

  // Monthly Deductions (100% Payroll SalaryStructure Parity)
  @IsNumber()
  @Min(0)
  @IsOptional()
  pfContribution?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  taxDeduction?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  professionalTax?: number = 0;

  @IsNumber()
  @Min(0)
  netMonthly: number;

  // Annual Totals & Incentives
  @IsNumber()
  @Min(0)
  annualBaseSalary: number;

  @IsNumber()
  @Min(0)
  annualGross: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  annualPerformanceBonus?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  joiningBonus?: number = 0;

  @IsNumber()
  @Min(0)
  totalCtc: number;

  // Budget Exception
  @IsBoolean()
  @IsOptional()
  isBudgetException?: boolean = false;

  @IsString()
  @IsOptional()
  budgetJustification?: string;

  // Offer Terms
  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  designationId?: string;

  @IsDateString()
  @IsNotEmpty()
  joiningDate: string;

  @IsDateString()
  @IsNotEmpty()
  expiryDate: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  probationDurationMonths?: number = 3;

  @IsNumber()
  @Min(0)
  @IsOptional()
  noticePeriodDays?: number = 30;

  @IsString()
  @IsOptional()
  reportingManagerId?: string;

  @IsEnum(WorkplaceType)
  @IsOptional()
  workplaceType?: WorkplaceType = WorkplaceType.ON_SITE;

  @IsString()
  @IsOptional()
  termsAndConditions?: string;
}
