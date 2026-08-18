-- Store the company-level image used as the header on generated payslips.
ALTER TABLE "CompanySettings"
ADD COLUMN "payslipHeaderUrl" TEXT;
