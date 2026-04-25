import { CategoryType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultUserId = process.env.FINANCE_DEFAULT_USER_ID;

  if (!defaultUserId) {
    console.log('FINANCE_DEFAULT_USER_ID is not set. Skipping finance seed.');
    return;
  }

  const parsedUserId = Number.parseInt(defaultUserId, 10);
  if (!Number.isInteger(parsedUserId)) {
    throw new Error('FINANCE_DEFAULT_USER_ID must be an integer that matches the shared finance database');
  }

  const categories = [
    { name: 'Food', type: CategoryType.EXPENSE, icon: 'utensils' },
    { name: 'Transport', type: CategoryType.EXPENSE, icon: 'car' },
    { name: 'Shopping', type: CategoryType.EXPENSE, icon: 'shopping-bag' },
    { name: 'Salary', type: CategoryType.INCOME, icon: 'wallet' },
    { name: 'Other Income', type: CategoryType.INCOME, icon: 'badge-dollar-sign' },
  ];

  for (const category of categories) {
    const existing = await prisma.category.findFirst({
      where: {
        userId: parsedUserId,
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
        userId: parsedUserId,
        name: category.name,
        type: category.type,
        icon: category.icon,
        isDefault: true,
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
