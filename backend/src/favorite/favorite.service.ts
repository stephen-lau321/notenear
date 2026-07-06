import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FavoriteService {
  constructor(private prisma: PrismaService) {}

  async toggle(userId: string, claimId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_claimId: { userId, claimId } },
    });
    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    await this.prisma.favorite.create({ data: { userId, claimId } });
    return { favorited: true };
  }

  async listMy(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        claim: {
          include: {
            instrument: true,
            teacher: {
              include: { user: { select: { id: true, nickname: true, avatar: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async isFavorited(userId: string, claimId: string) {
    const fav = await this.prisma.favorite.findUnique({
      where: { userId_claimId: { userId, claimId } },
    });
    return { favorited: !!fav };
  }
}
