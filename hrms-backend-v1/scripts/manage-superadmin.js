require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
let PrismaClient;
try {
  ({ PrismaClient } = require('../dist/generated/prisma/client'));
} catch {
  ({ PrismaClient } = require('../generated/prisma/client'));
}
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  switch (command) {
    case 'list': {
      const platformUsers = await prisma.platformUser.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });
      console.log('\n--- 1. Platform Super Admins (/platform-admin/login) ---');
      if (platformUsers.length === 0) {
        console.log('No Platform Super Admins found.');
      } else {
        console.table(platformUsers);
      }

      const workspaceAdmins = await prisma.employee.findMany({
        where: {
          role: { in: ['SUPER_ADMIN', 'OWNER', 'HR_HEAD'] },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          employmentStatus: true,
          company: { select: { id: true, name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });
      console.log('\n--- 2. Workspace / Company Admins (/login) ---');
      if (workspaceAdmins.length === 0) {
        console.log('No Workspace Admins found.');
      } else {
        console.table(
          workspaceAdmins.map((a) => ({
            id: a.id,
            email: a.email,
            name: `${a.firstName} ${a.lastName}`,
            role: a.role,
            status: a.employmentStatus,
            company: a.company?.name || a.company?.id,
          })),
        );
      }
      break;
    }

    case 'set-password': {
      const email = args[1];
      const newPassword = args[2];
      if (!email || !newPassword) {
        console.error('Usage: node scripts/manage-superadmin.js set-password <email> <newPassword>');
        process.exit(1);
      }
      if (newPassword.length < 8) {
        console.error('Error: Password must be at least 8 characters long.');
        process.exit(1);
      }

      const cleanEmail = email.toLowerCase().trim();
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      let updatedCount = 0;

      // Try platform user first
      const platformUser = await prisma.platformUser.findUnique({
        where: { email: cleanEmail },
      });
      if (platformUser) {
        await prisma.platformUser.update({
          where: { id: platformUser.id },
          data: { password: hashedPassword, isActive: true },
        });
        console.log(`\n Successfully updated password and set isActive=true for Platform Super Admin: "${cleanEmail}"!`);
        console.log(`   Login URL: http://localhost:3000/platform-admin/login (or http://localhost:3000/login)`);
        updatedCount++;
      }

      // Also try employee
      const employee = await prisma.employee.findUnique({
        where: { email: cleanEmail },
      });
      if (employee) {
        await prisma.employee.update({
          where: { id: employee.id },
          data: {
            password: hashedPassword,
            employmentStatus: 'ACTIVE',
            inviteToken: null,
          },
        });
        console.log(`\n Successfully updated password and activated Workspace User: "${cleanEmail}" (Role: ${employee.role})!`);
        console.log(`   Login URL: http://localhost:3000/login`);
        updatedCount++;
      }

      if (updatedCount === 0) {
        console.error(`Error: No platform user or employee found with email "${email}".`);
        process.exit(1);
      }
      break;
    }

    case 'verify': {
      const email = args[1];
      const password = args[2];
      if (!email || !password) {
        console.error('Usage: node scripts/manage-superadmin.js verify <email> <password>');
        process.exit(1);
      }
      const cleanEmail = email.toLowerCase().trim();
      let found = false;

      const platformUser = await prisma.platformUser.findUnique({ where: { email: cleanEmail } });
      if (platformUser) {
        found = true;
        const match = await bcrypt.compare(password, platformUser.password);
        console.log(`\n--- Platform User Check: ${platformUser.email} ---`);
        console.log(`Role: ${platformUser.role}`);
        console.log(`isActive: ${platformUser.isActive}`);
        console.log(`Password Matches: ${match ? '✅ YES' : '❌ NO'}`);
        console.log(`Login URL: http://localhost:3000/platform-admin/login (or http://localhost:3000/login)`);
      }

      const employee = await prisma.employee.findUnique({
        where: { email: cleanEmail },
        include: { company: true },
      });
      if (employee) {
        found = true;
        const match = await bcrypt.compare(password, employee.password);
        console.log(`\n--- Workspace User Check: ${employee.email} ---`);
        console.log(`Role: ${employee.role}`);
        console.log(`Status: ${employee.employmentStatus}`);
        console.log(`Company: ${employee.company?.name} (Status: ${employee.company?.status})`);
        console.log(`Pending Invite Token: ${Boolean(employee.inviteToken) ? 'YES (blocks login)' : 'NO'}`);
        console.log(`Password Matches: ${match ? '✅ YES' : '❌ NO'}`);
        console.log(`Login URL: http://localhost:3000/login`);
      }

      if (!found) {
        console.log(`\n❌ No account found with email "${cleanEmail}" in PlatformUser or Employee.`);
      }
      break;
    }

    case 'create': {
      const email = args[1];
      const password = args[2];
      const firstName = args[3] || 'Super';
      const lastName = args[4] || 'Admin';

      if (!email || !password) {
        console.error('Usage: node scripts/manage-superadmin.js create <email> <password> [firstName] [lastName]');
        process.exit(1);
      }
      if (password.length < 8) {
        console.error('Error: Password must be at least 8 characters long.');
        process.exit(1);
      }

      const cleanEmail = email.toLowerCase().trim();
      const existing = await prisma.platformUser.findUnique({
        where: { email: cleanEmail },
      });
      if (existing) {
        console.error(`Error: User with email "${email}" already exists.`);
        process.exit(1);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.platformUser.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'SUPER_ADMIN',
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });

      console.log(`\n Successfully created new Platform Super Admin:`);
      console.table([newUser]);
      break;
    }

    case 'create-workspace-admin': {
      const email = args[1];
      const password = args[2];
      const firstName = args[3] || 'Admin';
      const lastName = args[4] || 'User';

      if (!email || !password) {
        console.error('Usage: node scripts/manage-superadmin.js create-workspace-admin <email> <password> [firstName] [lastName]');
        process.exit(1);
      }
      if (password.length < 8) {
        console.error('Error: Password must be at least 8 characters long.');
        process.exit(1);
      }

      const cleanEmail = email.toLowerCase().trim();
      const existingEmployee = await prisma.employee.findUnique({
        where: { email: cleanEmail },
      });

      const hashedPassword = await bcrypt.hash(password, 10);

      if (existingEmployee) {
        const updated = await prisma.employee.update({
          where: { id: existingEmployee.id },
          data: {
            role: 'SUPER_ADMIN',
            password: hashedPassword,
            employmentStatus: 'ACTIVE',
          },
        });
        console.log(`\n Successfully promoted existing employee "${cleanEmail}" to Workspace SUPER_ADMIN!`);
        break;
      }

      // Find first company
      const company = await prisma.company.findFirst({
        orderBy: { createdAt: 'asc' },
      });

      if (!company) {
        console.error('Error: No company found in the database. Please register a company first.');
        process.exit(1);
      }

      const newAdmin = await prisma.employee.create({
        data: {
          companyId: company.id,
          email: cleanEmail,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'SUPER_ADMIN',
          employmentStatus: 'ACTIVE',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          employmentStatus: true,
          companyId: true,
        },
      });

      console.log(`\n Successfully created new Workspace Super Admin for company "${company.name}":`);
      console.table([newAdmin]);
      break;
    }

    default:
      console.log(`
HRMS Account Management CLI
===========================
Usage:
  node scripts/manage-superadmin.js list
  node scripts/manage-superadmin.js verify <email> <password>
  node scripts/manage-superadmin.js set-password <email> <newPassword>
  node scripts/manage-superadmin.js create <email> <password> [firstName] [lastName]
  node scripts/manage-superadmin.js create-workspace-admin <email> <password> [firstName] [lastName]
`);
  }
}

main()
  .catch((err) => {
    console.error('Operation failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
