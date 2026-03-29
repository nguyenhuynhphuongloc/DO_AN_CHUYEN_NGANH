import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

function toDatabaseTransactionType(type: 'INCOME' | 'EXPENSE') {
  return type.toLowerCase();
}

function formatOverspendAmount(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const transactions = await this.prisma.transaction.findMany({
      include: {
        wallet: true,
        category: true,
      },
      orderBy: { transactionDate: 'desc' },
    });

    return transactions.map((transaction) => ({
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
    }));
  }

  async create(body: CreateTransactionDto) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: body.walletId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: body.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const currentBalance = Number(wallet.balance);
    const balanceDelta = body.type === 'INCOME' ? body.amount : -body.amount;
    const overspendAmount = body.type === 'EXPENSE' ? Math.max(body.amount - currentBalance, 0) : 0;

    const [, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: body.walletId },
        data: {
          balance: {
            increment: new Decimal(balanceDelta),
          },
        },
      }),
      this.prisma.transaction.create({
        data: {
          userId: wallet.userId,
          walletId: body.walletId,
          categoryId: body.categoryId,
          type: toDatabaseTransactionType(body.type),
          amount: new Decimal(body.amount),
          description: body.description,
          source: body.source,
          merchantName: body.merchantName,
          transactionDate: new Date(body.transactionDate),
        },
        include: {
          wallet: true,
          category: true,
        },
      }),
    ]);

    return {
      ...transaction,
      type: transaction.type.toUpperCase(),
      amount: Number(transaction.amount),
      warning:
        overspendAmount > 0
          ? `Bạn đã chi tiêu vượt mức ${formatOverspendAmount(overspendAmount)} VND. Vui lòng kiểm tra lại thu chi sau khi hoàn tất hoá đơn.`
          : null,
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
    };
  }
}
