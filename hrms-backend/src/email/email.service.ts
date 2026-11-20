import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Central email delivery through Resend with full delivery logging.
 *
 * - Every send attempt is recorded in the EmailLog table (platform admins can
 *   inspect it from the monitoring console).
 * - When no real Resend API key is configured, emails are recorded as
 *   SIMULATED instead of throwing — registration / invites keep working in
 *   development and the OTP is surfaced through the dev debug channel.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private readonly isPlaceholderKey: boolean;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.RESEND_API_KEY || '';
    this.isPlaceholderKey =
      !apiKey || apiKey.startsWith('re_placeholder') || apiKey === 're_your-resend-api-key-here';
    this.resend = new Resend(this.isPlaceholderKey ? 're_placeholder_key' : apiKey);
  }

  private async logEmail(
    to: string,
    subject: string,
    type: string,
    status: 'SENT' | 'FAILED' | 'SIMULATED',
    error?: string,
    companyId?: string,
  ) {
    try {
      await this.prisma.emailLog.create({
        data: { to, subject, type, status, error: error || null, companyId: companyId || null },
      });
    } catch (e: any) {
      this.logger.warn(`Failed to write email log: ${e?.message}`);
    }
  }

  private async deliver(params: {
    from: string;
    to: string;
    subject: string;
    html: string;
    type: string;
    companyId?: string;
    throwOnError?: boolean;
  }): Promise<boolean> {
    const { from, to, subject, html, type, companyId, throwOnError } = params;

    if (this.isPlaceholderKey) {
      this.logger.log(
        `[EMAIL SIMULATED] type=${type} to=${to} subject="${subject}" (no RESEND_API_KEY configured)`,
      );
      await this.logEmail(to, subject, type, 'SIMULATED', undefined, companyId);
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({ from, to, subject, html });
      if (error) {
        this.logger.warn(`Resend API error for ${type} to ${to}: ${error.message}`);
        await this.logEmail(to, subject, type, 'FAILED', error.message, companyId);
        if (throwOnError) {
          throw new InternalServerErrorException(error.message || 'Failed to send email');
        }
        return false;
      }
      await this.logEmail(to, subject, type, 'SENT', undefined, companyId);
      return true;
    } catch (error: any) {
      this.logger.warn(`Failed to send ${type} email to ${to}: ${error?.message}`);
      await this.logEmail(to, subject, type, 'FAILED', String(error?.message || error), companyId);
      if (throwOnError) {
        if (error instanceof InternalServerErrorException) throw error;
        throw new InternalServerErrorException('Failed to send email');
      }
      return false;
    }
  }

  private fromEmail(): string {
    return (
      process.env.RESEND_FROM_EMAIL ||
      process.env.SENDER_EMAIL ||
      'GlobizHR <onboarding@resend.dev>'
    );
  }

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    await this.deliver({
      from: this.fromEmail(),
      to: email,
      subject: 'Reset Your Password - HRMS',
      type: 'PASSWORD_RESET',
      throwOnError: true,
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #0f172a;">Password Reset Request</h2>
            <p>We received a request to reset your password for your HRMS account.</p>
            <p>Click the button below to choose a new password. <strong>This link expires in 15 minutes.</strong></p>

            <a href="${resetUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0; font-weight: bold;">
              Reset Password
            </a>

            <p style="color: #64748b; font-size: 14px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
              If you didn't request this, please safely ignore this email. Your password will remain unchanged.
            </p>
          </div>
        `,
    });
  }

  async sendRegistrationOtpEmail(email: string, otp: string) {
    await this.deliver({
      from: this.fromEmail(),
      to: email,
      subject: `${otp} is your GlobizHR Verification Code`,
      type: 'REGISTRATION_OTP',
      html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #0f172a; color: #ffffff; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">GlobizHR</h1>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">Organization Setup Verification</p>
            </div>
            <div style="padding: 32px 28px;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Verify Your Email Address</h2>
              <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                Welcome to GlobizHR! Use the 6-digit verification code below to verify your email address and continue setting up your organization:
              </p>
              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0056fd; font-family: monospace;">${otp}</span>
              </div>
              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
                This code will expire in <strong>10 minutes</strong>. If you did not initiate this setup request, you can safely ignore this email.
              </p>
            </div>
            <div style="background-color: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
              © ${new Date().getFullYear()} GlobizHR. All rights reserved.
            </div>
          </div>
        `,
    });
  }

  async sendEmployeeInvitationEmail(
    email: string,
    firstName: string,
    employeeCode: string | null,
    inviteToken: string,
    companyId?: string,
  ) {
    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/set-password?token=${inviteToken}`;
    await this.deliver({
      from: this.fromEmail(),
      to: email,
      subject: 'Welcome to the Team! Set your password',
      type: 'EMPLOYEE_INVITE',
      companyId,
      html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Welcome to GlobizHR, ${firstName}!</h2>
            <p>You have been invited to join your company's HRMS workspace.</p>
            ${employeeCode ? `<p>Your official Employee ID is: <strong>${employeeCode}</strong></p>` : `<p>Your official Employee ID will be assigned upon completion and verification of your onboarding checklist.</p>`}
            <p>Please click the secure link below to set your permanent password and complete your onboarding.</p>
            <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; margin-top: 15px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Set Password & Start Onboarding</a>
            <p style="margin-top: 30px; font-size: 12px; color: #888;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
    });
  }

  /**
   * P-18: Server-side payslip email dispatch
   */
  async sendPayslipEmail(params: {
    email: string;
    employeeName: string;
    month: number;
    year: number;
    netSalary: number;
    companyName: string;
    breakdown: any;
    portalUrl?: string;
    companyId?: string;
  }) {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthName = monthNames[params.month - 1] || `Month ${params.month}`;
    const earnings = params.breakdown?.earnings || {};
    const deductions = params.breakdown?.deductions || {};
    const viewUrl =
      params.portalUrl ||
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/workspace/my-payslips`;

    return this.deliver({
      from: this.fromEmail(),
      to: params.email,
      subject: `Your Payslip for ${monthName} ${params.year} - ${params.companyName}`,
      type: 'PAYSLIP',
      companyId: params.companyId,
      html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0f172a; color: #ffffff; padding: 24px 32px;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700;">${params.companyName}</h1>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 14px;">Salary Statement for ${monthName} ${params.year}</p>
            </div>

            <div style="padding: 32px;">
              <p style="font-size: 15px; margin-top: 0;">Dear <strong>${params.employeeName}</strong>,</p>
              <p style="font-size: 14px; color: #475569;">Your salary for the month of <strong>${monthName} ${params.year}</strong> has been processed and credited.</p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px 20px; margin: 24px 0;">
                <div style="font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Net Salary Pay</div>
                <div style="font-size: 28px; font-weight: 800; color: #059669; margin-top: 4px;">₹${params.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
                <thead>
                  <tr style="background-color: #f1f5f9; text-align: left;">
                    <th style="padding: 10px 12px; border: 1px solid #e2e8f0; width: 50%;">Earnings</th>
                    <th style="padding: 10px 12px; border: 1px solid #e2e8f0; width: 50%;">Deductions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 8px 12px; border: 1px solid #e2e8f0; vertical-align: top;">
                      <div>Basic Salary: ₹${(earnings.basic || 0).toLocaleString('en-IN')}</div>
                      ${earnings.hra ? `<div>HRA: ₹${earnings.hra.toLocaleString('en-IN')}</div>` : ''}
                      ${earnings.conveyance ? `<div>Conveyance: ₹${earnings.conveyance.toLocaleString('en-IN')}</div>` : ''}
                      ${earnings.medical ? `<div>Medical: ₹${earnings.medical.toLocaleString('en-IN')}</div>` : ''}
                      ${earnings.special ? `<div>Special Allowance: ₹${earnings.special.toLocaleString('en-IN')}</div>` : ''}
                      ${earnings.overtimePay ? `<div>Overtime (${earnings.overtimeHours || 0} hrs): ₹${earnings.overtimePay.toLocaleString('en-IN')}</div>` : ''}
                      ${earnings.otherAllowances ? `<div>Other Allowances: ₹${earnings.otherAllowances.toLocaleString('en-IN')}</div>` : ''}
                      <div style="margin-top: 8px; font-weight: 700; border-top: 1px dashed #cbd5e1; padding-top: 4px;">Gross: ₹${(earnings.total || 0).toLocaleString('en-IN')}</div>
                    </td>
                    <td style="padding: 8px 12px; border: 1px solid #e2e8f0; vertical-align: top;">
                      ${deductions.pf ? `<div>Provident Fund (PF): ₹${deductions.pf.toLocaleString('en-IN')}</div>` : ''}
                      ${deductions.tax ? `<div>TDS / Income Tax: ₹${deductions.tax.toLocaleString('en-IN')}</div>` : ''}
                      ${deductions.profTax ? `<div>Professional Tax: ₹${deductions.profTax.toLocaleString('en-IN')}</div>` : ''}
                      ${deductions.lop ? `<div>Loss of Pay (LOP): ₹${deductions.lop.toLocaleString('en-IN')} (${deductions.lopDays || 0} days)</div>` : ''}
                      <div style="margin-top: 8px; font-weight: 700; border-top: 1px dashed #cbd5e1; padding-top: 4px;">Total Deductions: ₹${(deductions.total || 0).toLocaleString('en-IN')}</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="${viewUrl}" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">
                  View & Download Full Payslip
                </a>
              </div>

              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
                This is a system generated communication. Please reach out to your HR/Payroll department for any inquiries.
              </p>
            </div>
          </div>
        `,
    });
  }
}
