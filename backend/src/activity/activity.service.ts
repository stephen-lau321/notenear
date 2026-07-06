import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { maskAll } from "../common/mask-sensitive";

// Sensitive words (de-tutoring)
const FORBIDDEN_WORDS = [
  "课程", "培训", "教学", "课时", "学费", "试听课", "考级", "集训", "补习", "教培", "K12", "k12",
];

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  private checkContent(title: string, description?: string) {
    const text = `${title} ${description || ""}`;
    for (const word of FORBIDDEN_WORDS) {
      if (text.includes(word)) {
        throw new BadRequestException(
          `内容包含敏感词"${word}"，请使用社交活动语言（如体验、沙龙、分享会等）`
        );
      }
    }
  }

  async create(
    userId: string,
    data: {
      title: string;
      description?: string;
      coverImage?: string;
      eventTime?: string;
      location?: string;
      price?: number;
    },
    autoApprove = false,
  ) {
    this.checkContent(data.title, data.description);

    // Skip daily limit for admin-created activities
    if (!autoApprove) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayCount = await this.prisma.activity.count({
        where: {
          teacherId: userId,
          createdAt: { gte: todayStart },
        },
      });

      if (todayCount >= 3) {
        throw new BadRequestException("每天最多发布 3 条活动");
      }
    }

    return this.prisma.activity.create({
      data: {
        teacherId: userId,
        title: maskAll(data.title),
        description: data.description ? maskAll(data.description) : null,
        coverImage: data.coverImage,
        eventTime: data.eventTime ? new Date(data.eventTime) : null,
        location: data.location,
        price: data.price ?? null,
        status: autoApprove ? "APPROVED" : "PENDING",
      },
    });
  }

  async listByTeacher(teacherId: string, includeAll = false) {
    if (includeAll) {
      // Teacher dashboard: show all including pending
      return this.prisma.activity.findMany({
        where: { teacherId },
        orderBy: { createdAt: "desc" },
      });
    }
    // Public view: only approved
    return this.prisma.activity.findMany({
      where: { teacherId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    return this.prisma.activity.findUnique({
      where: { id },
      include: { teacher: { select: { id: true, nickname: true, avatar: true } } },
    });
  }

  // Admin: list all activities for review
  async listAll(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          teacher: { select: { id: true, nickname: true, avatar: true } },
        },
      }),
      this.prisma.activity.count(),
    ]);
    return { items, total, page, pageSize };
  }
}
