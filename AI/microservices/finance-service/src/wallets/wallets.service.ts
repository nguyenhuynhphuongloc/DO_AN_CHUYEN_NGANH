import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { AuthenticatedUser } from 'src/common/auth/authenticated-user.interface';
import { resolveSharedDbUser } from 'src/common/auth/resolve-shared-db-user';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser) {
    const dbUser = await resolveSharedDbUser(this.prisma, user);
    const wallets = await this.prisma.wallet.findMany({
      where: { userId: dbUser.id },
      include: {
        transactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return wallets.map((wallet) => ({
      ...wallet,
      id: String(wallet.id),
      userId: String(wallet.userId),
      balance: Number(wallet.balance),
      transactions: wallet.transactions.map((transaction) => ({
        ...transaction,
        id: String(transaction.id),
        userId: String(transaction.userId),
        categoryId: String(transaction.categoryId),
        walletId: transaction.walletId !== null ? String(transaction.walletId) : null,
        receiptId: transaction.receiptId !== null ? String(transaction.receiptId) : null,
        amount: Number(transaction.amount),
        transactionDate: transaction.date,
      })),
    }));
  }

  async create(user: AuthenticatedUser, body: CreateWalletDto) {
    const dbUser = await resolveSharedDbUser(this.prisma, user);
    const wallet = await this.prisma.wallet.create({
      data: {
        userId: dbUser.id,
        name: body.name,
        balance: new Decimal(body.initialBalance),
        currency: body.currency ?? 'VND',
        walletType: 'cash',
        isDefault: false,
      },
    });

    return {
      ...wallet,
      id: String(wallet.id),
      userId: String(wallet.userId),
      balance: Number(wallet.balance),
    };
  }
}
