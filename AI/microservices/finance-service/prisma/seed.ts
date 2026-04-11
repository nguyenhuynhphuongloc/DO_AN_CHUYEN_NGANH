import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultUserId = process.env.FINANCE_DEFAULT_USER_ID;

  if (!defaultUserId) {
    console.log('FINANCE_DEFAULT_USER_ID is not set. Skipping finance seed.');
    return;
  }

  const categories = [
    { name: 'Food', type: 'expense', icon: 'utensils' },
    { name: 'Transport', type: 'expense', icon: 'car' },
    { name: 'Shopping', type: 'expense', icon: 'shopping-bag' },
    { name: 'Salary', type: 'income', icon: 'wallet' },
    { name: 'Other Income', type: 'income', icon: 'badge-dollar-sign' },
  ];

  for (const category of categories) {
    const existing = await prisma.category.findFirst({
      where: {
        userId: defaultUserId,
        name: category.name,
      },
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          type: category.type,
          icon: category.icon,
        },
      });
      continue;
    }

    await prisma.category.create({
      data: {
        userId: defaultUserId,
        name: category.name,
        type: category.type,
        icon: category.icon,
        isSystem: true,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
