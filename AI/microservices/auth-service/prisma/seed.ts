import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'testuser@example.com' },
    update: {
      fullName: 'Test User',
      passwordHash: '123456',
      status: 'active',
      emailVerified: false,
    },
    create: {
      fullName: 'Test User',
      email: 'testuser@example.com',
      passwordHash: '123456',
      status: 'active',
      emailVerified: false,
    },
  });

  const role = await prisma.role.upsert({
    where: { name: 'user' },
    update: {
      description: 'Default user role',
    },
    create: {
      name: 'user',
      description: 'Default user role',
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
