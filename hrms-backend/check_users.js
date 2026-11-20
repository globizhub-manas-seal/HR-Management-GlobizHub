const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function main() {
  console.log('--- PLATFORM USERS ---');
  const platformUsers = await prisma.platformUser.findMany({
    select: { id: true, email: true, role: true, isActive: true },
  });
  console.log(JSON.stringify(platformUsers, null, 2));

  console.log('--- RECENT EMPLOYEES ---');
  const employees = await prisma.employee.findMany({
    take: 10,
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      company: { select: { id: true, name: true, status: true } },
    },
  });
  console.log(JSON.stringify(employees, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

