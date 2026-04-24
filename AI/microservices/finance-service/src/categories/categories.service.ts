import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/auth/authenticated-user.interface';
import { resolveSharedDbUser } from 'src/common/auth/resolve-shared-db-user';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser) {
    const dbUser = await resolveSharedDbUser(this.prisma, user);

    return this.prisma.category.findMany({
      where: {
        OR: [{ userId: dbUser.id }, { userId: null }],
      },
      orderBy: { name: 'asc' },
    }).then((categories) =>
      categories.map((category) => ({
        ...category,
        id: String(category.id),
        userId: category.userId !== null ? String(category.userId) : null,
        type: category.type.toUpperCase(),
      })),
    );
  }
}
