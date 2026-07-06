import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StreetClaimService {
  constructor(private prisma: PrismaService) {}

  async claim(
    userId: string,
    data: {
      instrumentName: string;
      streetName: string;
      communityName?: string;
      district?: string;
      city?: string;
      province?: string;
      lat?: number;
      lng?: number;
    }
  ) {
    const teacher = await this.prisma.teacherAuth.findUnique({
      where: { userId },
    });
    if (!teacher || teacher.status !== "APPROVED") {
      throw new BadRequestException("请先完成老师认证");
    }

    // 在读学生最多2个据点，正式老师最多3个
    const isStudent = teacher.isStudent === true;
    const MAX_CLAIMS = isStudent ? 2 : 3;
    const claimLabel = isStudent ? "陪练" : "音乐主理人";
    const teacherActiveClaims = await this.prisma.streetClaim.findMany({
      where: { teacherId: teacher.id, status: "ACTIVE" },
    });
    if (teacherActiveClaims.length >= MAX_CLAIMS) {
      throw new BadRequestException(
        `每位${claimLabel}最多认领 ${MAX_CLAIMS} 个音乐据点。如需更换，请联系管理员释放现有认领。`
      );
    }

    // GPS proximity check: 在读学生(陪练)可跨城市，正式老师需在10km内
    if (!isStudent && teacherActiveClaims.length > 0 && data.lat != null && data.lng != null) {
      const withinRange = teacherActiveClaims.some((c) => {
        if (c.lat == null || c.lng == null) return true;
        const dist = this.haversineKm(data.lat!, data.lng!, c.lat, c.lng);
        return dist <= 10;
      });
      if (!withinRange) {
        throw new BadRequestException(
          "新增据点需与已有据点相距不超过10公里。如需跨区域认领，请联系管理员。"
        );
      }
    }

    let instrument = await this.prisma.instrument.findFirst({
      where: { name: data.instrumentName },
    });
    if (!instrument) {
      instrument = await this.prisma.instrument.create({
        data: { name: data.instrumentName },
      });
    }

    // Check unique constraint: one street+instrument combo = one teacher
    const existing = await this.prisma.streetClaim.findFirst({
      where: {
        streetName: data.streetName,
        communityName: data.communityName || null,
        instrumentId: instrument.id,
        status: "ACTIVE",
      },
    });
    if (existing) {
      throw new BadRequestException(
        "\"" + data.streetName + "\"的\"" + data.instrumentName + "\"已被认领，请选择其他乐器或其他街道"
      );
    }

    return this.prisma.streetClaim.create({
      data: {
        teacherId: teacher.id,
        instrumentId: instrument.id,
        streetName: data.streetName,
        communityName: data.communityName || null,
        streetRaw: null,
        district: data.district,
        city: data.city,
        province: data.province,
        lat: data.lat,
        lng: data.lng,
      },
      include: { instrument: true },
    });
  }

  // Haversine distance (km) between two lat/lng points
  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async findNearby(lat: number, lng: number, radiusMeters: number, mode?: string) {
    const radiusKm = radiusMeters / 1000;

    const allClaims = await this.prisma.streetClaim.findMany({
      where: { status: "ACTIVE", teacher: { isBackupTeacher: false } },
      include: {
        instrument: true,
        teacher: {
          include: {
            user: { select: { id: true, nickname: true, avatar: true } },
          },
        },
      },
    });

    // Filter by Haversine distance
    const nearby = allClaims.filter((c) => {
      if (c.lat == null || c.lng == null) return false;
      return this.haversineKm(lat, lng, c.lat, c.lng) <= radiusKm;
    });

    // Sort by distance (closest first)
    nearby.sort((a, b) => {
      const dA = a.lat != null && a.lng != null ? this.haversineKm(lat, lng, a.lat, a.lng) : Infinity;
      const dB = b.lat != null && b.lng != null ? this.haversineKm(lat, lng, b.lat, b.lng) : Infinity;
      return dA - dB;
    });

    return nearby;
  }

  async search(query: string, lat?: number, lng?: number, mode?: string) {
        // If mode is "online", return all (no location filter)
    if (mode === "online") return this.prisma.streetClaim.findMany({
      where: { status: "ACTIVE", teacher: { isBackupTeacher: false }, OR: [{ streetName: { contains: query } }, { instrument: { name: { contains: query } } }, { teacher: { user: { nickname: { contains: query } } } }] },
      include: { instrument: true, teacher: { include: { user: { select: { id: true, nickname: true, avatar: true } } } } },
      take: 50,
    });
    const results = await this.prisma.streetClaim.findMany({
      where: {
        status: "ACTIVE",
        teacher: { isBackupTeacher: false },
        OR: [
          { streetName: { contains: query } },
          { instrument: { name: { contains: query } } },
          { teacher: { user: { nickname: { contains: query } } } },
        ],
      },
      include: {
        instrument: true,
        teacher: {
          include: {
            user: { select: { id: true, nickname: true, avatar: true } },
          },
        },
      },
      take: 50,
    });

    // If location provided, filter to 3km and sort by distance
    if (lat != null && lng != null) {
      const filtered = results.filter((c) => {
        if (c.lat == null || c.lng == null) return false;
        return this.haversineKm(lat, lng, c.lat, c.lng) <= 3;
      });
      filtered.sort((a, b) => {
        const dA = a.lat != null && a.lng != null ? this.haversineKm(lat, lng, a.lat, a.lng) : Infinity;
        const dB = b.lat != null && b.lng != null ? this.haversineKm(lat, lng, b.lat, b.lng) : Infinity;
        return dA - dB;
      });
      return filtered;
    }

    return results;
  }

  async getById(id: string) {
    const claim = await this.prisma.streetClaim.findUnique({
      where: { id },
      include: {
        instrument: true,
        teacher: {
          include: {
            user: { select: { id: true, nickname: true, avatar: true } },
          },
        },
      },
    });
    if (!claim) throw new NotFoundException("认领记录不存在");
    return claim;
  }

  /** Teacher requests release (needs admin approval) */
  async releaseOwnClaim(userId: string, claimId: string) {
    const teacher = await this.prisma.teacherAuth.findUnique({ where: { userId } });
    if (!teacher) throw new NotFoundException("未找到导师认证信息");
    const claim = await this.prisma.streetClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException("认领记录不存在");
    if (claim.teacherId !== teacher.id) throw new BadRequestException("无权释放他人的认领");
    if (claim.releaseRequested) throw new BadRequestException("已提交释放申请，等待管理员审核");

    await this.prisma.streetClaim.update({
      where: { id: claimId },
      data: { releaseRequested: true },
    });
    return { message: "释放申请已提交，等待管理员审核" };
  }

  /** Teacher requests modification (max 1 per year) */
  async modifyClaim(userId: string, claimId: string, data: {
    instrumentName?: string; streetName?: string; district?: string; city?: string;
  }) {
    const teacher = await this.prisma.teacherAuth.findUnique({ where: { userId } });
    if (!teacher) throw new NotFoundException("未找到导师认证信息");
    const claim = await this.prisma.streetClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException("认领记录不存在");
    if (claim.teacherId !== teacher.id) throw new BadRequestException("无权修改他人的认领");
    if (claim.modifyStatus === "PENDING") throw new BadRequestException("已有修改申请等待审核");

    // Yearly limit check
    const thisYear = new Date().getFullYear();
    const yearlyCount = claim.lastModifyYear === thisYear ? claim.modifyCount : 0;
    if (yearlyCount >= 1) throw new BadRequestException("每年仅可修改1次，今年已用完");

    await this.prisma.streetClaim.update({
      where: { id: claimId },
      data: { modifyData: JSON.stringify(data), modifyStatus: "PENDING" },
    });
    return { message: "修改申请已提交，等待管理员审核" };
  }

  /** Admin: approve modification */
  async approveModify(claimId: string) {
    const claim = await this.prisma.streetClaim.findUnique({ where: { id: claimId } });
    if (!claim || !claim.modifyData) throw new NotFoundException("无待审核的修改");
    const data = JSON.parse(claim.modifyData);
    const thisYear = new Date().getFullYear();
    const yearlyCount = claim.lastModifyYear === thisYear ? claim.modifyCount : 0;

    // Update the claim with new data
    await this.prisma.streetClaim.update({
      where: { id: claimId },
      data: {
        streetName: data.streetName || claim.streetName,
        district: data.district || claim.district,
        city: data.city || claim.city,
        modifyData: null,
        modifyStatus: "APPROVED",
        modifyCount: yearlyCount + 1,
        lastModifyYear: thisYear,
      },
    });
    // Also update instrument if changed
    if (data.instrumentName) {
      let inst = await this.prisma.instrument.findFirst({ where: { name: data.instrumentName } });
      if (!inst) inst = await this.prisma.instrument.create({ data: { name: data.instrumentName } });
      await this.prisma.streetClaim.update({ where: { id: claimId }, data: { instrumentId: inst.id } });
    }
    return { message: "修改已通过" };
  }

  /** Admin: reject modification */
  async rejectModify(claimId: string) {
    await this.prisma.streetClaim.update({
      where: { id: claimId },
      data: { modifyData: null, modifyStatus: "REJECTED" },
    });
    return { message: "修改已驳回" };
  }

  /** Admin: approve release */
  async approveRelease(claimId: string) {
    const claim = await this.prisma.streetClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException("认领不存在");
    await this.prisma.streetClaim.update({
      where: { id: claimId },
      data: { status: "RELEASED", releasedAt: new Date(), releaseRequested: false },
    });
    // Check for backup
    const backup = await this.prisma.backupClaim.findFirst({
      where: { streetName: claim.streetName, instrumentId: claim.instrumentId, status: "WAITING" },
      orderBy: { createdAt: "asc" },
    });
    if (backup) {
      await this.prisma.backupClaim.update({ where: { id: backup.id }, data: { status: "ACTIVATED", activatedAt: new Date() } });
    }
    return { message: "已释放，候补已通知" };
  }

  /** Admin: reject release */
  async rejectRelease(claimId: string) {
    await this.prisma.streetClaim.update({
      where: { id: claimId },
      data: { releaseRequested: false },
    });
    return { message: "释放申请已驳回" };
  }

  /** Admin: list pending modifications and releases */
  async listPendingModifications() {
    return this.prisma.streetClaim.findMany({
      where: {
        OR: [{ modifyStatus: "PENDING" }, { releaseRequested: true }],
      },
      include: {
        instrument: true,
        teacher: { include: { user: { select: { id: true, nickname: true, phone: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
