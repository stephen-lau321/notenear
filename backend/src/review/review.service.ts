import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, claimId: string, rating: number, content?: string) {
    return this.prisma.review.create({
      data: { authorId, claimId, rating, content },
      include: { author: { select: { id: true, nickname: true, avatar: true } } },
    });
  }

  async listByClaim(claimId: string, skip = 0, take = 20) {
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { claimId },
        include: { author: { select: { id: true, nickname: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.prisma.review.count({ where: { claimId } }),
    ]);
    const avg = await this.prisma.review.aggregate({
      where: { claimId },
      _avg: { rating: true },
    });
    return { items, total, averageRating: avg._avg.rating ?? 0 };
  }
}
