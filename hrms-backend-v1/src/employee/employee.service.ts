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
import { S3Service } from '../s3/s3.service';

@Injectable()
export class EmployeeService {
  private resend: Resend;
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {
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
  async updateMyProfile(employeeId: string, data: any, file?: Express.Multer.File) { // <-- Added 'file' here!
    // Strip out fields the employee shouldn't be able to change themselves
    delete data.id;
    delete data.companyId;
    delete data.departmentId;
    delete data.roleId;
    delete data.email; 
    delete data.employeeId; 
    delete data.joiningDate;

    // If a file was uploaded, upload it to S3 and save the returned S3 URL
    if (file) {
      data.profilePhoto = await this.s3Service.uploadFile(file, 'profile-photos');
    }

    // Normalize blood group and gender from string values to Prisma enum values or null
    if (data.bloodGroup === "") {
      data.bloodGroup = null;
    } else if (data.bloodGroup) {
      const mapping: Record<string, string> = {
        "O+": "O_POS",
        "O-": "O_NEG",
        "A+": "A_POS",
        "A-": "A_NEG",
        "B+": "B_POS",
        "B-": "B_NEG",
        "AB+": "AB_POS",
        "AB-": "AB_NEG",
      };
      if (mapping[data.bloodGroup]) {
        data.bloodGroup = mapping[data.bloodGroup];
      }
    }

    if (data.gender === "") {
      data.gender = null;
    }

    return this.prisma.employee.update({
      where: { id: employeeId },
      data: data,
    });
  }

  async getMyDevices(employeeId: string) {
    return this.prisma.employeeDevice.findMany({
      where: { employeeId },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async registerMyDevice(employeeId: string, deviceName: string, deviceIdentifier: string) {
    return this.prisma.employeeDevice.upsert({
      where: { deviceIdentifier },
      update: { lastUsedAt: new Date(), deviceName },
      create: {
        employeeId,
        deviceName,
        deviceIdentifier,
        status: 'APPROVED',
      },
    });
  }

  async revokeMyDevice(employeeId: string, deviceId: string) {
    return this.prisma.employeeDevice.deleteMany({
      where: { id: deviceId, employeeId },
    });
  }

  async updateMyNotifications(employeeId: string, data: any) {
    delete data.id;
    delete data.employeeId;

    return this.prisma.notificationSettings.upsert({
      where: { employeeId },
      update: data,
      create: {
        employeeId,
        ...data,
      },
    });
  }


  // ==========================================
  // EMPLOYEE LIFECYCLE & DETAILS
  // ==========================================

  async addEmergencyContact(employeeId: string, data: { name: string; relationship: string; phone: string; email?: string; isPrimary?: boolean }) {
    return this.prisma.emergencyContact.create({
      data: {
        ...data,
        employeeId,
      },
    });
  }

  async addSkill(employeeId: string, data: { name: string; proficiencyLevel: string }) {
    return this.prisma.employeeSkill.create({
      data: {
        ...data,
        employeeId,
      },
    });
  }

  async addEmploymentHistory(employeeId: string, data: { companyName: string; jobTitle: string; startDate: Date; endDate?: Date; reasonForLeaving?: string }) {
    return this.prisma.employmentHistory.create({
      data: {
        ...data,
        employeeId,
      },
    });
  }

  async processEmployeeExit(employeeId: string, data: { exitDate: Date; reason: string; notes?: string }) {
    // Upsert ensures we create it if it doesn't exist, or update it if it does
    return this.prisma.employeeExit.upsert({
      where: { employeeId },
      update: {
        exitDate: new Date(data.exitDate),
        reason: data.reason,
        exitInterviewNotes: data.notes,
      },
      create: {
        employeeId,
        exitDate: new Date(data.exitDate),
        reason: data.reason,
        exitInterviewNotes: data.notes,
      },
    });
  }

  async findEmployeeById(companyId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: {
        skills: true,
        emergencyContacts: true,
      },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found in your workspace');
    }
    return employee;
  }

  async removeSkill(employeeId: string, skillId: string) {
    // Check if skill belongs to employee
    const skill = await this.prisma.employeeSkill.findFirst({
      where: { id: skillId, employeeId },
    });
    if (!skill) {
      throw new NotFoundException('Skill not found for this employee');
    }
    return this.prisma.employeeSkill.delete({
      where: { id: skillId },
    });
  }

  async removeEmergencyContact(employeeId: string, contactId: string) {
    // Check if contact belongs to employee
    const contact = await this.prisma.emergencyContact.findFirst({
      where: { id: contactId, employeeId },
    });
    if (!contact) {
      throw new NotFoundException('Emergency contact not found for this employee');
    }
    return this.prisma.emergencyContact.delete({
      where: { id: contactId },
    });
  }
}