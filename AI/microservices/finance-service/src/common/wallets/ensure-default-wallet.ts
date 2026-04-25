import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';

export async function ensureDefaultWallet(
  prisma: PrismaService,
  userId: number,
  currency: string | null | undefined,
) {
  const existingWallets = await prisma.wallet.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });

  if (existingWallets.length === 0) {
    return prisma.wallet.create({
      data: {
        userId,
        name: 'Default Wallet',
        walletType: 'cash',
        currency: currency ?? 'VND',
        balance: new Decimal(0),
        isDefault: true,
      },
    });
  }

  const defaultWallet = existingWallets.find((wallet) => wallet.isDefault);
  if (defaultWallet) {
    return defaultWallet;
  }

  const fallbackWallet = existingWallets[0];
  return prisma.wallet.update({
    where: { id: fallbackWallet.id },
    data: { isDefault: true },
  });
}
