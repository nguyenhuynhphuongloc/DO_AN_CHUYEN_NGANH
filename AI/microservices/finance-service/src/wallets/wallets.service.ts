import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findAll() {
    const wallets = await this.prisma.wallet.findMany({
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

  async create(body: CreateWalletDto) {
    const defaultUserId = this.configService.get<string>('FINANCE_DEFAULT_USER_ID');
    if (!defaultUserId) {
      throw new InternalServerErrorException('FINANCE_DEFAULT_USER_ID is required to create wallets');
    }

    const wallet = await this.prisma.wallet.create({
      data: {
        userId: defaultUserId,
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
