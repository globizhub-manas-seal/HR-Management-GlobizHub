import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import * as bcrypt from 'bcrypt'; // Make sure to import this!
import { Resend } from 'resend';
import { randomBytes } from 'crypto';

@Injectable()
export class EmployeeService {
  private resend: Resend;
  constructor(private prisma: PrismaService) {
    // Initialize Resend with your API key from the .env file
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async findAllByCompany(companyId: string) {
    return this.prisma.employee.findMany({
      where: { companyId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true, // We will use this for their title/access level
        department: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async inviteEmployee(companyId: string, dto: CreateEmployeeDto) {
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });

    if (existingEmployee) {
      throw new ConflictException(
        'An employee with this email already exists.',
      );
    }

    const tempPassword = await bcrypt.hash('Welcome123!', 10);

    // 1. Generate a secure, random 32-character token
    const inviteToken = randomBytes(32).toString('hex');

    // 2. Create the employee and save the token to their profile
    const newEmployee = await this.prisma.employee.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        role: dto.role,
        password: tempPassword,
        companyId: companyId,
        inviteToken: inviteToken, // Saving the token here!
      },
    });

    // 3. Create the Magic Link
    // When they click this, it will take them to our frontend React app
    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/set-password?token=${inviteToken}`;

    // 4. Send the Email via Resend
    // Note: While testing on Resend's free tier, you must use their 'onboarding@resend.dev' email
    await this.resend.emails.send({
      from: 'TeamHub HRMS <onboarding@resend.dev>',
      to: dto.email,
      subject: 'Welcome to the Team! Set your password',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #10b981;">Welcome to TeamHub, ${dto.firstName}!</h2>
          <p>You have been invited to join your company's HRMS workspace.</p>
          <p>Please click the secure link below to set your permanent password and log in.</p>
          <a href="${magicLink}" style="display: inline-block; padding: 10px 20px; margin-top: 15px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Set My Password</a>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `,
    });

    const { password, inviteToken: hiddenToken, ...result } = newEmployee;
    return result;
  }

  // UPDATE EMPLOYEE
  async updateEmployee(
    companyId: string,
    employeeId: string,
    dto: UpdateEmployeeDto,
  ) {
    // 1. Ensure the employee actually belongs to this company before updating!
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId: companyId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found in your workspace');
    }

    // 2. Perform the update
    return this.prisma.employee.update({
      where: { id: employeeId },
      data: dto,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
      },
    });
  }

  // DEACTIVATE/DELETE EMPLOYEE
  async removeEmployee(companyId: string, employeeId: string) {
    // 1. Verify ownership
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId: companyId },
    });

    if (!employee) {
      throw new ConflictException('Employee not found in your workspace');
    }

    // 2. Delete the record (For V1 we will hard-delete, later we can switch to soft-delete/deactivate)
    return this.prisma.employee.delete({
      where: { id: employeeId },
    });
  }
}
