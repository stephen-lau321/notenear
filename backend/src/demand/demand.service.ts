import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ScoringService } from "../scoring/scoring.service";
import { CreateDemandDto } from "./dto/create-demand.dto";

@Injectable()
export class DemandService {
  constructor(
    private prisma: PrismaService,
    private scoring: ScoringService
  ) {}

  async create(dto: CreateDemandDto) {
    const demand = await this.prisma.studentDemand.create({
      data: {
        source: dto.source || "XHS",
        sourceUrl: dto.sourceUrl,
        content: dto.content,
        instrument: dto.instrument,
        city: dto.city,
        district: dto.district,
        street: dto.street,
        budget: dto.budget,
        postTimeText: dto.postTimeText,
        hoursAgo: dto.hoursAgo,
        commentCount: dto.commentCount ?? 0,
        accountSignals: dto.accountSignals
          ? JSON.stringify(dto.accountSignals)
          : null,
        rawData: dto.rawData ? JSON.stringify(dto.rawData) : null,
        status: "NEW",
      },
    });

    // 自动评分
    const result = this.scoring.score({
      content: dto.content,
      instrument: dto.instrument,
      city: dto.city,
      street: dto.street,
      district: dto.district,
      hoursAgo: dto.hoursAgo,
      commentCount: dto.commentCount ?? 0,
      accountSignals: dto.accountSignals,
      budget: dto.budget,
    });

    await this.prisma.scoreHistory.create({
      data: {
        demandId: demand.id,
        totalScore: result.totalScore,
        grade: result.grade,
        timeliness: result.detail.timeliness,
        completeness: result.detail.completeness,
        authenticity: result.detail.authenticity,
        competition: result.detail.competition,
        budget: result.detail.budget,
        action: result.action,
      },
    });

    // 更新需求状态
    const updatedDemand = await this.prisma.studentDemand.update({
      where: { id: demand.id },
      data: { status: "SCORED" },
    });

    return {
      demand: updatedDemand,
      score: result,
    };
  }

  async list(params: {
    city?: string;
    instrument?: string;
    status?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.city) where.city = { contains: params.city };
    if (params.instrument) where.instrument = { contains: params.instrument };

    const [items, total] = await Promise.all([
      this.prisma.studentDemand.findMany({
        where,
        include: { scores: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
        skip: params.skip ?? 0,
        take: Math.min(params.take ?? 20, 50),
      }),
      this.prisma.studentDemand.count({ where }),
    ]);

    return { items, total };
  }

  async getById(id: string) {
    return this.prisma.studentDemand.findUnique({
      where: { id },
      include: {
        scores: { orderBy: { createdAt: "desc" } },
        matches: {
          include: {
            claim: { include: { instrument: true } },
            teacher: { include: { user: { select: { id: true, nickname: true, avatar: true, phone: true } } } },
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.studentDemand.update({
      where: { id },
      data: { status },
    });
  }

  /** 重新评分（管理员触发） */
  async rescore(id: string) {
    const demand = await this.prisma.studentDemand.findUnique({
      where: { id },
    });
    if (!demand) throw new Error("需求不存在");

    const result = this.scoring.score({
      content: demand.content,
      instrument: demand.instrument,
      city: demand.city,
      street: demand.street,
      district: demand.district,
      hoursAgo: demand.hoursAgo,
      commentCount: demand.commentCount,
      accountSignals: demand.accountSignals
        ? JSON.parse(demand.accountSignals)
        : null,
      budget: demand.budget,
    });

    await this.prisma.scoreHistory.create({
      data: {
        demandId: demand.id,
        totalScore: result.totalScore,
        grade: result.grade,
        timeliness: result.detail.timeliness,
        completeness: result.detail.completeness,
        authenticity: result.detail.authenticity,
        competition: result.detail.competition,
        budget: result.detail.budget,
        action: result.action,
      },
    });

    return { demand, score: result };
  }
}
