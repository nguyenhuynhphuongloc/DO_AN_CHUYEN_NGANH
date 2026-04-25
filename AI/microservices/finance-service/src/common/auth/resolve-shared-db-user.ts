import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthenticatedUser } from './authenticated-user.interface';

export type SharedDbUser = {
  id: number;
  email: string;
  currency: string | null;
};

export async function resolveSharedDbUser(
  prisma: PrismaService,
  user: AuthenticatedUser,
): Promise<SharedDbUser> {
  const parsedUserId = Number.parseInt(user.userId, 10);
  const candidates = await prisma.$queryRaw<SharedDbUser[]>`
    SELECT id, email, currency::text AS currency
    FROM public.users
    WHERE email = ${user.email}
      OR (${Number.isInteger(parsedUserId)} = TRUE AND id = ${parsedUserId})
    ORDER BY CASE WHEN id = ${parsedUserId} THEN 0 ELSE 1 END
    LIMIT 1
  `;
  const candidate = candidates[0];

  if (!candidate) {
    throw new ForbiddenException('Authenticated user does not exist in the shared finance database');
  }

  return candidate;
}
