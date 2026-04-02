import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/auth/authenticated-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthenticatedUser) {
    return this.prisma.category.findMany({
      where: {
        OR: [
          { isSystem: true },
          { userId: user.userId },
          { userId: null },
        ],
      },
      orderBy: { name: 'asc' },
    }).then((categories) =>
      categories.map((category) => ({
        ...category,
        type: category.type.toUpperCase(),
      })),
    );
  }
}
