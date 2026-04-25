import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionType as PrismaTransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { AuthenticatedUser } from 'src/common/auth/authenticated-user.interface';
import { resolveSharedDbUser } from 'src/common/auth/resolve-shared-db-user';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

function toDatabaseTransactionType(type: 'INCOME' | 'EXPENSE'): PrismaTransactionType {
  return type === 'INCOME' ? PrismaTransactionType.INCOME : PrismaTransactionType.EXPENSE;
}

function formatOverspendAmount(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser) {
    const dbUser = await resolveSharedDbUser(this.prisma, user);
    const transactions = await this.prisma.transaction.findMany({
      where: { userId: dbUser.id },
      include: {
        wallet: true,
        category: true,
      },
      orderBy: { date: 'desc' },
    });

    return transactions.map((transaction) => ({
      ...transaction,
      id: String(transaction.id),
      userId: String(transaction.userId),
      walletId: transaction.walletId !== null ? String(transaction.walletId) : null,
      categoryId: String(transaction.categoryId),
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
    }));
  }

  async create(user: AuthenticatedUser, body: CreateTransactionDto) {
    const dbUser = await resolveSharedDbUser(this.prisma, user);
    const walletId = Number(body.walletId);
    const categoryId = Number(body.categoryId);

    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.userId !== dbUser.id) {
      throw new ForbiddenException('Wallet does not belong to the authenticated user');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.userId && category.userId !== dbUser.id) {
      throw new ForbiddenException('Category does not belong to the authenticated user');
    }

    const currentBalance = Number(wallet.balance);
    const balanceDelta = body.type === 'INCOME' ? body.amount : -body.amount;
    const overspendAmount = body.type === 'EXPENSE' ? Math.max(body.amount - currentBalance, 0) : 0;

    const transaction = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            increment: new Decimal(balanceDelta),
          },
        },
      });

      return tx.transaction.create({
        data: {
          userId: dbUser.id,
          walletId,
          categoryId,
          receiptId: body.receiptId,
          type: toDatabaseTransactionType(body.type),
          amount: new Decimal(body.amount),
          description: body.description,
          sourceType: body.source,
          sourceRefId: body.sourceRefId,
          merchantName: body.merchantName,
          date: new Date(body.transactionDate),
        },
        include: {
          wallet: true,
          category: true,
        },
      });
    });

    return {
      ...transaction,
      id: String(transaction.id),
      userId: String(transaction.userId),
      walletId: transaction.walletId !== null ? String(transaction.walletId) : null,
      categoryId: String(transaction.categoryId),
      receiptId: transaction.receiptId !== null ? String(transaction.receiptId) : null,
      type: transaction.type.toUpperCase(),
      amount: Number(transaction.amount),
      transactionDate: transaction.date,
      warning:
        overspendAmount > 0
          ? `Ban da chi tieu vuot muc ${formatOverspendAmount(overspendAmount)} VND. Vui long kiem tra lai thu chi sau khi hoan tat hoa don.`
          : null,
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
    };
  }
}
