import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StreetClaimService } from "../street-claim/street-claim.service";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private claimService: StreetClaimService) {}

  // ===== Dashboard Stats =====
    async getDashboardStats() {
    const [
      totalUsers,
      totalTeachers,
      approvedTeachers,
      pendingTeachers,
      totalClaims,
      totalActivities,
      pendingActivities,
      totalPageViews,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: "TEACHER" } }),
      this.prisma.teacherAuth.count({ where: { status: "APPROVED" } }),
      this.prisma.teacherAuth.count({ where: { status: "PENDING" } }),
      this.prisma.streetClaim.count({ where: { status: "ACTIVE" } }),
      this.prisma.activity.count(),
      this.prisma.activity.count({ where: { status: "PENDING" } }),
      this.prisma.pageView.count(),
    ]);

    // Instrument distribution
    const instrumentDist = await this.prisma.instrument.findMany({
      include: { _count: { select: { claims: true } } },
    });

    // Gender distribution
    const approvedTeacherAuths = await this.prisma.teacherAuth.findMany({
      where: { status: "APPROVED" },
      select: { gender: true },
    });
    const maleCount = approvedTeacherAuths.filter((t) => t.gender === "男").length;
    const femaleCount = approvedTeacherAuths.filter((t) => t.gender === "女").length;

    // Street distribution
    const streetGroups = await this.prisma.streetClaim.groupBy({
      by: ["streetName"],
      _count: { id: true },
      where: { status: "ACTIVE" },
      orderBy: { _count: { id: "desc" } },
    });

    // Parent experience distribution
    const parents = await this.prisma.user.findMany({
      where: { role: "PARENT" },
      select: { experienceLevel: true, residentialArea: true },
    });
    const beginnerCount = parents.filter((p) => p.experienceLevel === "0基础").length;
    const experiencedCount = parents.filter((p) => p.experienceLevel && p.experienceLevel !== "0基础").length;

    return {
      totalUsers,
      totalTeachers,
      approvedTeachers,
      pendingTeachers,
      totalClaims,
      totalActivities,
      pendingActivities,
      totalPageViews,
      instrumentDistribution: instrumentDist.map((i) => ({
        name: i.name,
        count: i._count.claims,
      })),
      genderDistribution: { male: maleCount, female: femaleCount },
      streetDistribution: streetGroups.map((s) => ({
        street: s.streetName,
        count: s._count.id,
      })),
      parentStats: {
        beginnerCount,
        experiencedCount,
        totalParents: parents.length,
      },
    };
  }

  // ===== User List =====
  async listUsers(role?: string, page = 1, pageSize = 50) {
    const where = role ? { role } : {};
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { teacherAuth: { select: { realName: true, status: true, teacherType: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  // ===== Teacher Review =====
  async listPendingTeachers() {
    return this.prisma.teacherAuth.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { id: true, nickname: true, phone: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async reviewTeacher(authId: string, approved: boolean, reason?: string) {
    return this.prisma.teacherAuth.update({
      where: { id: authId },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        verifiedAt: approved ? new Date() : null,
      },
      include: {
        user: { select: { id: true, nickname: true, phone: true } },
      },
    });
  }

  // ===== Activity Review =====
  async listPendingActivities() {
    return this.prisma.activity.findMany({
      where: { status: "PENDING" },
      include: {
        teacher: { select: { id: true, nickname: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async reviewActivity(activityId: string, approved: boolean, reason?: string) {
    return this.prisma.activity.update({
      where: { id: activityId },
      data: { status: approved ? "APPROVED" : "REJECTED" },
      include: {
        teacher: { select: { id: true, nickname: true } },
      },
    });
  }

  // ===== Claims Management =====
  async listAllClaims(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.streetClaim.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          instrument: true,
          teacher: {
            include: { user: { select: { id: true, nickname: true, phone: true } } },
          },
        },
      }),
      this.prisma.streetClaim.count(),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  
  // ===== Duplicate Detection for multi-account prevention =====
  async getPotentialDuplicates() {
    // Find teachers with same real name but different user accounts
    const teacherAuths = await this.prisma.teacherAuth.findMany({
      include: {
        user: { select: { id: true, phone: true, nickname: true } },
        streetClaims: {
          where: { status: "ACTIVE" },
          include: { instrument: true },
        },
      },
    });

    // Group by real name
    const nameGroups = new Map<string, typeof teacherAuths>();
    for (const t of teacherAuths) {
      const key = t.realName;
      if (!nameGroups.has(key)) nameGroups.set(key, []);
      nameGroups.get(key)!.push(t);
    }

    // Flag groups with same name but different users
    const duplicates: any[] = [];
    for (const [, group] of nameGroups) {
      if (group.length > 1) {
        duplicates.push({
          reason: "相同姓名多账号",
          realName: group[0].realName,
          accounts: group.map((t) => ({
            userId: t.user.id,
            phone: t.user.phone,
            nickname: t.user.nickname,
            status: t.status,
            idCardNo: t.idCardNo || "未填写",
            claims: t.streetClaims.map((c) => ({
              street: c.streetName,
              instrument: c.instrument.name,
            })),
          })),
          confidence: group.some((t) =>
            group.some(
              (o) => o.idCardNo && t.idCardNo && o.idCardNo === t.idCardNo && o.userId !== t.userId
            )
          )
            ? "high"
            : group.every((t) => t.status === "APPROVED")
              ? "medium"
              : "low",
        });
      }
    }

    // Additional: ID-card-based detection (same ID card, possibly different names due to typos)
    const withIdCard = teacherAuths.filter((t) => t.idCardNo);
    const idCardGroups = new Map<string, typeof teacherAuths>();
    for (const t of withIdCard) {
      const key = t.idCardNo!;
      if (!idCardGroups.has(key)) idCardGroups.set(key, []);
      idCardGroups.get(key)!.push(t);
    }

    const idCardDuplicates: any[] = [];
    for (const [idCard, group] of idCardGroups) {
      if (group.length > 1) {
        // Only add if not already captured by name-based detection
        const uniqueUserIds = new Set(group.map((t) => t.userId));
        if (uniqueUserIds.size > 1) {
          idCardDuplicates.push({
            reason: "相同身份证号多账号（高危）",
            realName: group[0].realName,
            idCardNo: idCard.slice(0, 6) + "****" + idCard.slice(-4), // mask middle digits
            accounts: group.map((t) => ({
              userId: t.user.id,
              phone: t.user.phone,
              nickname: t.user.nickname,
              status: t.status,
              claims: t.streetClaims.map((c) => ({
                street: c.streetName,
                instrument: c.instrument.name,
              })),
            })),
            confidence: "high",
          });
        }
      }
    }

    return [...idCardDuplicates, ...duplicates];
  }

  async releaseClaim(claimId: string) {
    return this.prisma.streetClaim.update({
      where: { id: claimId },
      data: { status: "RELEASED", releasedAt: new Date() },
    });
  }

  // ===== Delegation to StreetClaimService =====
  async listModifications() { return this.claimService.listPendingModifications(); }
  async approveModify(id: string) { return this.claimService.approveModify(id); }
  async rejectModify(id: string) { return this.claimService.rejectModify(id); }
  async approveRelease(id: string) { return this.claimService.approveRelease(id); }
  async rejectRelease(id: string) { return this.claimService.rejectRelease(id); }
}
