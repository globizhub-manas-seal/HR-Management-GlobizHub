import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export enum LoanType {
  SALARY_ADVANCE = 'SALARY_ADVANCE',
  PERSONAL_LOAN = 'PERSONAL_LOAN',
  EMERGENCY_LOAN = 'EMERGENCY_LOAN',
}

export class LoanRequestDto {
  /** Admins may file on behalf of an employee; employees always self */
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsEnum(LoanType)
  type: LoanType;

  @IsNumber()
  @IsPositive()
  principalAmount: number;

  @IsNumber()
  @Min(1)
  tenureMonths: number;

  /** Optional reason / purpose note */
  @IsOptional()
  @IsString()
  reason?: string;

  /** Month (1-12) the payroll deduction should start from */
  @IsOptional()
  @IsNumber()
  @Min(1)
  deductionStartMonth?: number;

  @IsOptional()
  @IsNumber()
  deductionStartYear?: number;
}

export class LoanRejectionDto {
  @IsString()
  @MinLength(3)
  rejectionReason: string;
}

export class LoanRepaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class LoanSettingsDto {
  @IsOptional()
  loanAllowSalaryAdvance?: boolean;

  @IsOptional()
  loanAllowPersonalLoan?: boolean;

  @IsOptional()
  loanAllowEmergencyLoan?: boolean;

  @IsOptional()
  @IsNumber()
  loanMaxAmount?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(1)
  loanMaxTenureMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  loanDefaultInterestRate?: number;

  @IsOptional()
  loanAutoDeductFromPayroll?: boolean;
}
