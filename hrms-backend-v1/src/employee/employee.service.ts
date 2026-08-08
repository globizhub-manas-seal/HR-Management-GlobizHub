import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import * as bcrypt from 'bcrypt'; 
import { Resend } from 'resend';
import { randomBytes } from 'crypto';

@Injectable()
export class EmployeeService {
  private resend: Resend;
  constructor(private prisma: PrismaService) {
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
        role: true, 
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
      throw new ConflictException('An employee with this email already exists.');
    }

    const tempPassword = await bcrypt.hash('Welcome123!', 10);
    const inviteToken = randomBytes(32).toString('hex');

    const newEmployee = await this.prisma.employee.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        role: dto.role,
        password: tempPassword,
        companyId: companyId,
        inviteToken: inviteToken, 
      },
    });

    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/set-password?token=${inviteToken}`;

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

  async updateEmployee(companyId: string, employeeId: string, dto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId: companyId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found in your workspace');
    }

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

  async removeEmployee(companyId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId: companyId },
    });

    if (!employee) {
      throw new ConflictException('Employee not found in your workspace');
    }

    return this.prisma.employee.delete({
      where: { id: employeeId },
    });
  }

  // --- NEW: UPDATE OWN PROFILE ---
  async updateMyProfile(employeeId: string, data: any) {
    // Strip out fields the employee shouldn't be able to change themselves
    delete data.id;
    delete data.companyId;
    delete data.departmentId;
    delete data.roleId;
    delete data.email; 
    delete data.employeeId; 
    delete data.joiningDate;

    return this.prisma.employee.update({
      where: { id: employeeId },
      data: data,
    });
  }
}