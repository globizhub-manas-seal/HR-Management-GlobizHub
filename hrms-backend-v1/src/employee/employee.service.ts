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
import { encrypt, decrypt } from '../common/utils/encryption.util';
import { AuditService } from '../audit/audit.service';

const SENSITIVE_FIELDS = [
  'bankName',
  'accountNumber',
  'ifscCode',
  'panNumber',
  'nationalId',
  'pfAccountNumber',
  'uanNumber',
];

function encryptPayload(payload: any) {
  if (!payload) return payload;
  const clone = { ...payload };
  for (const field of SENSITIVE_FIELDS) {
    if (clone[field] !== undefined && clone[field] !== null) {
      clone[field] = encrypt(clone[field]);
    }
  }
  return clone;
}

function decryptEmployee(employee: any) {
  if (!employee) return employee;
  for (const field of SENSITIVE_FIELDS) {
    if (employee[field] !== undefined && employee[field] !== null) {
      employee[field] = decrypt(employee[field]);
    }
  }
  return employee;
}

@Injectable()
export class EmployeeService {
  private resend: Resend;
  
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private auditService: AuditService,
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
        employeeCode: true, // ✅ Ensure the code is fetched for the frontend list
        department: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async inviteEmployee(companyId: string, dto: CreateEmployeeDto, actorId?: string) {
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });

    if (existingEmployee) {
      throw new ConflictException('An employee with this email already exists.');
    }

    // ==========================================
    // --- EMPLOYEE ID GENERATION LOGIC ---
    // ==========================================
    
    // 1. Fetch Company to get the first prefix (e.g., TCS)
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    // 2. Fetch Department to get the second prefix (if a departmentId is provided)
    let department: any = null;
    const deptId = (dto as any).departmentId;
    if (deptId) {
      department = await this.prisma.department.findUnique({ where: { id: deptId } });
    }

    // 3. Create Prefixes (First 3 alphanumeric letters, uppercase)
    const compPrefix = company.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'EMP';
    const deptPrefix = department ? department.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'GEN' : 'GEN';

    // 4. Find the max sequential number from existing employee codes to avoid duplicate collisions on deletion
    const existingEmployees = await this.prisma.employee.findMany({
      where: {
        companyId,
        employeeCode: { not: null },
      },
      select: { employeeCode: true },
    });

    let maxNum = 0;
    for (const emp of existingEmployees) {
      if (emp.employeeCode) {
        const parts = emp.employeeCode.split('-');
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    // 5. Combine them into the final code (e.g., "TAT-INF-001")
    const sequentialNumber = String(maxNum + 1).padStart(3, '0');
    const generatedEmployeeCode = `${compPrefix}-${deptPrefix}-${sequentialNumber}`;
    // ==========================================

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
        employeeCode: generatedEmployeeCode, // ✅ Injected here
        ...(deptId && { departmentId: deptId }),
      },
    });

    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/set-password?token=${inviteToken}`;

    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'TeamHub HRMS <onboarding@resend.dev>';
      await this.resend.emails.send({
        from: fromEmail,
        to: dto.email,
        subject: 'Welcome to the Team! Set your password',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #10b981;">Welcome to TeamHub, ${dto.firstName}!</h2>
            <p>You have been invited to join your company's HRMS workspace.</p>
            <p>Your official Employee ID is: <strong>${generatedEmployeeCode}</strong></p>
            <p>Please click the secure link below to set your permanent password and log in.</p>
            <a href="${magicLink}" style="display: inline-block; padding: 10px 20px; margin-top: 15px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Set My Password</a>
            <p style="margin-top: 30px; font-size: 12px; color: #888;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
      });
      console.log(`✅ Onboarding invitation email sent to ${dto.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send onboarding invitation email via Resend:', emailError);
      // We log the error but do not throw, so the creation process completes successfully.
    }

    await this.auditService.logAction(
      companyId,
      actorId || null,
      'CREATE',
      'Employee',
      newEmployee.id,
      null,
      { email: newEmployee.email, role: newEmployee.role, employeeCode: newEmployee.employeeCode },
    );

    const { password, inviteToken: hiddenToken, ...result } = newEmployee;
    return result;
  }

  async updateEmployee(companyId: string, employeeId: string, dto: UpdateEmployeeDto, actorId?: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId: companyId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found in your workspace');
    }

    const encryptedData = encryptPayload(dto);

    const updated = await this.prisma.employee.update({
      where: { id: employeeId },
      data: encryptedData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    await this.auditService.logAction(
      companyId,
      actorId || null,
      'UPDATE',
      'Employee',
      employeeId,
      { firstName: employee.firstName, lastName: employee.lastName, role: employee.role },
      { firstName: updated.firstName, lastName: updated.lastName, role: updated.role },
    );

    return updated;
  }

  async removeEmployee(companyId: string, employeeId: string, actorId?: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId: companyId },
    });

    if (!employee) {
      throw new ConflictException('Employee not found in your workspace');
    }

    const deleted = await this.prisma.employee.delete({
      where: { id: employeeId },
    });

    await this.auditService.logAction(
      companyId,
      actorId || null,
      'DELETE',
      'Employee',
      employeeId,
      { email: employee.email, name: `${employee.firstName} ${employee.lastName}` },
      null,
    );

    return deleted;
  }

  // ==========================================
  // EMPLOYEE SELF-SERVICE
  // ==========================================

  async updateMyProfile(employeeId: string, data: any, file?: Express.Multer.File) { 
    delete data.id;
    delete data.companyId;
    delete data.departmentId;
    delete data.roleId;
    delete data.email; 
    delete data.employeeId; 
    delete data.joiningDate;

    if (file) {
      data.profilePhoto = await this.s3Service.uploadFile(file, 'profile-photos');
    }

    if (data.bloodGroup === "") {
      data.bloodGroup = null;
    } else if (data.bloodGroup) {
      const mapping: Record<string, string> = {
        "O+": "O_POS", "O-": "O_NEG",
        "A+": "A_POS", "A-": "A_NEG",
        "B+": "B_POS", "B-": "B_NEG",
        "AB+": "AB_POS", "AB-": "AB_NEG",
      };
      if (mapping[data.bloodGroup]) {
        data.bloodGroup = mapping[data.bloodGroup];
      }
    }

    if (data.gender === "") {
      data.gender = null;
    }

    const encryptedData = encryptPayload(data);

    const updated = await this.prisma.employee.update({
      where: { id: employeeId },
      data: encryptedData,
    });

    await this.auditService.logAction(
      updated.companyId,
      employeeId,
      'UPDATE',
      'Employee',
      employeeId,
      { info: 'Self Profile Update (fields modified)' },
      { info: 'Self Profile Update Complete' },
    );

    return decryptEmployee(updated);
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
      data: { ...data, employeeId },
    });
  }

  async addSkill(employeeId: string, data: { name: string; proficiencyLevel: string }) {
    return this.prisma.employeeSkill.create({
      data: { ...data, employeeId },
    });
  }

  async addEmploymentHistory(employeeId: string, data: { companyName: string; jobTitle: string; startDate: Date; endDate?: Date; reasonForLeaving?: string }) {
    return this.prisma.employmentHistory.create({
      data: { ...data, employeeId },
    });
  }

  async processEmployeeExit(employeeId: string, data: { exitDate: Date; reason: string; notes?: string }) {
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
    return decryptEmployee(employee);
  }

  async removeSkill(employeeId: string, skillId: string) {
    const skill = await this.prisma.employeeSkill.findFirst({
      where: { id: skillId, employeeId },
    });
    if (!skill) throw new NotFoundException('Skill not found for this employee');
    
    return this.prisma.employeeSkill.delete({ where: { id: skillId } });
  }

  async removeEmergencyContact(employeeId: string, contactId: string) {
    const contact = await this.prisma.emergencyContact.findFirst({
      where: { id: contactId, employeeId },
    });
    if (!contact) throw new NotFoundException('Emergency contact not found');

    return this.prisma.emergencyContact.delete({ where: { id: contactId } });
  }
}