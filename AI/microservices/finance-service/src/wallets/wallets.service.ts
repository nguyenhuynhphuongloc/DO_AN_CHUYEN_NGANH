import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { AuthenticatedUser } from 'src/common/auth/authenticated-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser) {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId: user.userId },
      include: {
        transactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return wallets.map((wallet) => ({
      ...wallet,
      balance: Number(wallet.balance),
      transactions: wallet.transactions.map((transaction) => ({
        ...transaction,
        amount: Number(transaction.amount),
      })),
    }));
  }

  async create(user: AuthenticatedUser, body: CreateWalletDto) {
    const wallet = await this.prisma.wallet.create({
      data: {
        userId: user.userId,
        name: body.name,
        balance: new Decimal(body.initialBalance),
        currency: body.currency ?? 'VND',
        walletType: 'cash',
        isDefault: false,
      },
    });

    return {
      ...wallet,
      balance: Number(wallet.balance),
    };
  }
}
