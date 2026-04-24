import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthenticatedUser } from './authenticated-user.interface';

export async function resolveSharedDbUser(prisma: PrismaService, user: AuthenticatedUser) {
  const parsedUserId = Number.parseInt(user.userId, 10);
  const orFilters: Array<{ id?: number; email?: string }> = [{ email: user.email }];

  if (Number.isInteger(parsedUserId)) {
    orFilters.unshift({ id: parsedUserId });
  }

  const candidate = await prisma.user.findFirst({
    where: {
      OR: orFilters,
    },
  });

  if (!candidate) {
    throw new ForbiddenException('Authenticated user does not exist in the shared finance database');
  }

  return candidate;
}
