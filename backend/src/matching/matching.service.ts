import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DemandService } from "../demand/demand.service";

@Injectable()
export class MatchingService {
  constructor(
    private prisma: PrismaService,
    private demandService: DemandService
  ) {}

  /** 为需求匹配老师 */
  async matchDemand(demandId: string) {
    const demand = await this.demandService.getById(demandId);
    if (!demand) throw new Error("需求不存在");
    if (!demand.instrument) throw new Error("需求未识别到乐器，无法匹配");

    // 找到所有匹配乐器的活跃认领
    const claims = await this.prisma.streetClaim.findMany({
      where: {
        status: "ACTIVE",
        instrument: { name: demand.instrument },
        teacher: { status: "APPROVED", isBackupTeacher: false },
      },
      include: {
        instrument: true,
        teacher: {
          include: {
            user: { select: { id: true, nickname: true, avatar: true, phone: true } },
          },
        },
      },
    });

    if (claims.length === 0) return { demandId, matches: [], message: "无匹配的老师" };

    // 获取最新评分
    const latestScore = demand.scores?.[0];
    const qualityScore = latestScore ? latestScore.totalScore / 100 : 0.5;

    // 计算每个claim的匹配分
    const matchResults = claims.map((claim) => {
      const instrumentScore = 1.0; // 这里已按乐器精确筛选

      // 位置分：同城市+同区得分更高
      let proximityScore = 0.3; // default
      if (demand.city && claim.city && demand.city === claim.city) {
        proximityScore += 0.3;
        if (demand.district && claim.district && demand.district === claim.district) {
          proximityScore += 0.3;
        }
      }

      // 老师活跃度：已有认领数量、是否有活动
      const teacherActivity = 0.5; // 默认中等

      const compositeScore = parseFloat(
        (
          instrumentScore * 0.4 +
          proximityScore * 0.25 +
          qualityScore * 0.2 +
          teacherActivity * 0.15
        ).toFixed(2)
      );

      return {
        claimId: claim.id,
        teacherId: claim.teacherId,
        teacherName: claim.teacher.user.nickname,
        instrument: claim.instrument.name,
        street: claim.streetName,
        city: claim.city,
        score: compositeScore,
      };
    });

    // 按分数排序
    matchResults.sort((a, b) => b.score - a.score);

    // 保存匹配记录
    const topMatches = matchResults.slice(0, 5);
    const records = [];
    for (const m of topMatches) {
      const record = await this.prisma.matchRecord.create({
        data: {
          demandId,
          claimId: m.claimId,
          teacherId: m.teacherId,
          score: m.score,
          status: "PENDING",
        },
      });
      records.push(record);
    }

    // 更新需求状态
    await this.demandService.updateStatus(demandId, "MATCHED");

    // 给匹配到的老师发通知
    for (const m of topMatches) {
      const claim = claims.find(c => c.id === m.claimId);
      const teacherUserId = claim?.teacher.user.id;
      if (teacherUserId) {
        await this.prisma.notification.create({
          data: {
            userId: teacherUserId,
            type: "NEW_MATCH",
            title: `新的学生需求匹配`,
            body: `有一个${demand.instrument}学生在${demand.city || "未知城市"}${demand.street || ""}附近等你！`,
            data: JSON.stringify({ demandId, matchId: records.find(r => r.claimId === m.claimId)?.id }),
          },
        });
      }
    }

    return {
      demandId,
      totalCandidates: claims.length,
      matches: matchResults.slice(0, 5),
      records,
    };
  }

  /** 老师查看自己的匹配 */
  async getMyMatches(userId: string) {
    const teacher = await this.prisma.teacherAuth.findUnique({
      where: { userId },
    });
    if (!teacher) throw new Error("未找到老师认证");

    return this.prisma.matchRecord.findMany({
      where: { teacherId: teacher.id },
      include: {
        demand: {
          include: { scores: { orderBy: { createdAt: "desc" }, take: 1 } },
        },
        claim: { include: { instrument: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /** 老师接受/拒绝匹配 */
  async updateMatchStatus(matchId: string, status: string, userId: string) {
    const teacher = await this.prisma.teacherAuth.findUnique({
      where: { userId },
    });
    if (!teacher) throw new Error("未找到老师认证");

    const match = await this.prisma.matchRecord.findUnique({
      where: { id: matchId },
    });
    if (!match || match.teacherId !== teacher.id) {
      throw new Error("无权操作此匹配");
    }

    return this.prisma.matchRecord.update({
      where: { id: matchId },
      data: { status },
    });
  }

  /** 管理员查看所有匹配 */
  async listAll(skip = 0, take = 20) {
    const [items, total] = await Promise.all([
      this.prisma.matchRecord.findMany({
        include: {
          demand: true,
          claim: { include: { instrument: true } },
          teacher: { include: { user: { select: { id: true, nickname: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.prisma.matchRecord.count(),
    ]);
    return { items, total };
  }
}
