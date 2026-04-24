import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/auth/authenticated-user.interface';
import { resolveSharedDbUser } from 'src/common/auth/resolve-shared-db-user';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: AuthenticatedUser) {
    const dbUser = await resolveSharedDbUser(this.prisma, user);
    const [walletCount, transactionCount, walletAggregate, groupedTransactions, recentTransactions] =
      await Promise.all([
        this.prisma.wallet.count({
          where: { userId: dbUser.id },
        }),
        this.prisma.transaction.count({
          where: { userId: dbUser.id },
        }),
        this.prisma.wallet.aggregate({
          where: { userId: dbUser.id },
          _sum: { balance: true },
        }),
        this.prisma.transaction.groupBy({
          where: { userId: dbUser.id },
          by: ['type'],
          _sum: {
            amount: true,
          },
        }),
        this.prisma.transaction.findMany({
          where: { userId: dbUser.id },
          take: 5,
          include: {
            category: true,
            wallet: true,
          },
          orderBy: {
            date: 'desc',
          },
        }),
      ]);

    const income = Number(groupedTransactions.find((item) => item.type === 'income')?._sum.amount ?? 0);
    const expense = Number(groupedTransactions.find((item) => item.type === 'expense')?._sum.amount ?? 0);

    return {
      walletCount,
      transactionCount,
      totalBalance: Number(walletAggregate._sum.balance ?? 0),
      totalIncome: income,
      totalExpense: expense,
      recentTransactions: recentTransactions.map((transaction) => ({
        ...transaction,
        id: String(transaction.id),
        userId: String(transaction.userId),
        categoryId: String(transaction.categoryId),
        walletId: transaction.walletId !== null ? String(transaction.walletId) : null,
        receiptId: transaction.receiptId !== null ? String(transaction.receiptId) : null,
        type: transaction.type.toUpperCase(),
        amount: Number(transaction.amount),
        transactionDate: transaction.date,
        wallet: transaction.wallet
          ? {
              ...transaction.wallet,
              id: String(transaction.wallet.id),
              userId: String(transaction.wallet.userId),
              balance: Number(transaction.wallet.balance),
            }
          : null,
        category: transaction.category
          ? {
              ...transaction.category,
              id: String(transaction.category.id),
              userId: transaction.category.userId !== null ? String(transaction.category.userId) : null,
              type: transaction.category.type.toUpperCase(),
            }
          : transaction.category,
      })),
    };
  }
}
