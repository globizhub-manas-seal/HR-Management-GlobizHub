require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('../dist/generated/prisma/client');
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
      const users = await prisma.platformUser.findMany({
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
      console.log('\n--- Platform Staff / Super Admins ---');
      console.table(users);
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

      const user = await prisma.platformUser.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (!user) {
        console.error(`Error: User with email "${email}" not found.`);
        process.exit(1);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.platformUser.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      console.log(`\n Successfully updated password for "${user.email}"!`);
      break;
    }

    case 'set-email': {
      const oldEmail = args[1];
      const newEmail = args[2];
      if (!oldEmail || !newEmail) {
        console.error('Usage: node scripts/manage-superadmin.js set-email <oldEmail> <newEmail>');
        process.exit(1);
      }

      const user = await prisma.platformUser.findUnique({
        where: { email: oldEmail.toLowerCase().trim() },
      });
      if (!user) {
        console.error(`Error: User with email "${oldEmail}" not found.`);
        process.exit(1);
      }

      const existing = await prisma.platformUser.findUnique({
        where: { email: newEmail.toLowerCase().trim() },
      });
      if (existing) {
        console.error(`Error: Email "${newEmail}" is already used by another platform account.`);
        process.exit(1);
      }

      await prisma.platformUser.update({
        where: { id: user.id },
        data: { email: newEmail.toLowerCase().trim() },
      });

      console.log(`\n Successfully changed email from "${oldEmail}" to "${newEmail}"!`);
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

      const existing = await prisma.platformUser.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (existing) {
        console.error(`Error: User with email "${email}" already exists.`);
        process.exit(1);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.platformUser.create({
        data: {
          email: email.toLowerCase().trim(),
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

      console.log(`\n Successfully created new Super Admin:`);
      console.table([newUser]);
      break;
    }

    default:
      console.log(`
Usage:
  node scripts/manage-superadmin.js list
  node scripts/manage-superadmin.js create <email> <password> [firstName] [lastName]
  node scripts/manage-superadmin.js set-password <email> <newPassword>
  node scripts/manage-superadmin.js set-email <oldEmail> <newEmail>
`);
  }
}

main()
  .catch((err) => {
    console.error('Operation failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
