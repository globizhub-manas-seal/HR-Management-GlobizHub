// src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterWizardDto } from './dto/register-wizard.dto';
import { SetPasswordDto } from './dto/set-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerWizard(dto: RegisterWizardDto) {
    // 1. Check if the admin email is already registered
    const existingUser = await this.prisma.employee.findUnique({
      where: { email: dto.adminEmail },
    });
    if (existingUser) {
      throw new ConflictException('Admin email already exists');
    }

    // 2. Hash a default password for the MVP
    const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);

    // 3. Split the full name into first and last
    const nameParts = dto.adminFullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Admin';

    // 4. THE MASSIVE TRANSACTION
    // We create the Company, the Settings, the Departments, the Roles, and the Admin Employee all at once!
    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        industry: dto.industry,
        size: dto.companySize,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        
        // Auto-create related settings
        settings: {
          create: {
            themeColor: dto.themeColor,
            workDays: dto.workDays,
            shiftStartTime: dto.shiftStartTime,
            shiftEndTime: dto.shiftEndTime,
            attendanceMethod: dto.attendanceMethod,
          },
        },
        
        // Auto-create all standard departments
        departments: {
          create: dto.departments.map((deptName) => ({ name: deptName })),
        },
        
        // Auto-create all standard roles
        roles: {
          create: dto.roles.map((roleName) => ({ name: roleName })),
        },

        // Auto-create the Super Admin employee
        employees: {
          create: {
            firstName,
            lastName,
            email: dto.adminEmail,
            phone: dto.adminPhone,
            password: hashedPassword,
            role: 'SUPER_ADMIN',
          },
        },
      },
      include: {
        employees: true, // Return the newly created employee so we can log them in
      },
    });

    const newAdmin = company.employees[0];

    // Note: The extra arrays (leavePolicies, branches, shifts, etc.) from the DTO 
    // are successfully received! We will create the Prisma tables for those in our upcoming Payroll/Leave modules.

    // 5. Generate their JWT token to log them in automatically
    const payload = { sub: newAdmin.id, email: newAdmin.email, companyId: company.id, role: newAdmin.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      message: 'Workspace successfully configured!',
    };
  }

  // ... KEEP YOUR EXISTING login() FUNCTION EXACTLY AS IT IS BELOW ...
  async login(email: string, pass: string) {
    const user = await this.prisma.employee.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id, email: user.email, companyId: user.companyId, role: user.role };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  async getProfile(employeeId: string) {
    const profile = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        company: {
          include: {
            settings: true,
            departments: true,
            roles: true,
          },
        },
      },
    });

    if (!profile) {
      throw new UnauthorizedException('User not found');
    }

    return profile;
  }

  async setPassword(dto: SetPasswordDto) {
    // 1. Find the employee by their unique invite token
    const employee = await this.prisma.employee.findUnique({
      where: { inviteToken: dto.token },
    });

    if (!employee) {
      throw new UnauthorizedException('Invalid or expired invitation token');
    }

    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Update the password and clear the token so it can't be used again
    const updatedEmployee = await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        password: hashedPassword,
        inviteToken: null, 
      },
    });

    // 4. Generate a JWT token so they are logged in instantly
    const payload = { sub: updatedEmployee.id, email: updatedEmployee.email, companyId: updatedEmployee.companyId, role: updatedEmployee.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      message: 'Password set successfully!',
    };
  }
}