import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    // Initialize Resend with the API key from your .env or fallback for test environments
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key');
  }

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    try {
      await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com', // Must be a verified domain in your Resend dashboard
        to: email,
        subject: 'Reset Your Password - HRMS',
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
      console.log(`✅ Password reset email sent to ${email}`);
    } catch (error) {
      console.error(
        '❌ Failed to send password reset email via Resend:',
        error,
      );
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
