import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    }).then((categories) =>
      categories.map((category) => ({
        ...category,
        type: category.type.toUpperCase(),
      })),
    );
  }
}
