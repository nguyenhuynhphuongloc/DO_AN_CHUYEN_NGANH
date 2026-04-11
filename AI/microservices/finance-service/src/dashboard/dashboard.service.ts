import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/auth/authenticated-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: AuthenticatedUser) {
    const [walletCount, transactionCount, walletAggregate, groupedTransactions, recentTransactions] =
      await Promise.all([
        this.prisma.wallet.count({
          where: { userId: user.userId },
        }),
        this.prisma.transaction.count({
          where: { userId: user.userId },
        }),
        this.prisma.wallet.aggregate({
          where: { userId: user.userId },
          _sum: { balance: true },
        }),
        this.prisma.transaction.groupBy({
          where: { userId: user.userId },
          by: ['type'],
          _sum: {
            amount: true,
          },
        }),
        this.prisma.transaction.findMany({
          where: { userId: user.userId },
          take: 5,
          include: {
            category: true,
            wallet: true,
          },
          orderBy: {
            transactionDate: 'desc',
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
        type: transaction.type.toUpperCase(),
        amount: Number(transaction.amount),
        wallet: {
          ...transaction.wallet,
          balance: Number(transaction.wallet.balance),
        },
        category: transaction.category
          ? {
              ...transaction.category,
              type: transaction.category.type.toUpperCase(),
            }
          : transaction.category,
      })),
    };
  }
}
