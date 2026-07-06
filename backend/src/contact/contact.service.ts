import { Injectable, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { maskAll } from "../common/mask-sensitive";

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  /** Neighbor sends message to teacher */
  async sendMessage(parentId: string, teacherId: string, message: string) {
    if (!message?.trim()) throw new BadRequestException("请输入留言内容");
    // Find teacher's userId from TeacherAuth
    const teacherAuth = await this.prisma.teacherAuth.findUnique({
      where: { userId: teacherId },
      include: { user: { select: { id: true, phone: true } } },
    });
    if (!teacherAuth || teacherAuth.status !== "APPROVED") {
      throw new BadRequestException("该老师不存在或未通过认证");
    }

    return this.prisma.contactLog.create({
      data: {
        parentId,
        teacherId: teacherAuth.userId,
        message: maskAll(message.trim()),
        fee: 0,
        status: "PENDING",
      },
    });
  }

  /** List messages for current user (neighbor sees sent, teacher sees received) */
  async listMessages(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("用户不存在");

    if (user.role === "TEACHER" || user.role === "ADMIN") {
      return this.prisma.contactLog.findMany({
        where: { teacherId: userId },
        include: {
          parent: {
            select: { id: true, nickname: true, phone: true, residentialArea: true, studentName: true, childAge: true, childGrade: true, experienceType: true, experienceSubjects: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      return this.prisma.contactLog.findMany({
        where: { parentId: userId },
        include: {
          teacher: { select: { id: true, nickname: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }
  }

  /** Teacher replies to a message */
  async reply(contactId: string, teacherId: string, reply: string) {
    if (!reply?.trim()) throw new BadRequestException("请输入回复内容");
    const contact = await this.prisma.contactLog.findUnique({ where: { id: contactId } });
    if (!contact) throw new BadRequestException("留言不存在");
    if (contact.teacherId !== teacherId) throw new ForbiddenException("无权回复此留言");
    return this.prisma.contactLog.update({
      where: { id: contactId },
      data: { reply: maskAll(reply.trim()), repliedAt: new Date(), status: "REPLIED" },
    });
  }

  // ===== Phone Unlock =====

  /** Check if current user can see target user's phone */
  async checkPhoneUnlock(userId: string, targetUserId: string) {
    const unlock = await this.prisma.phoneUnlock.findFirst({
      where: { userId, targetUserId },
    });
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { phone: true, idCardNo: true },
    });
    return {
      unlocked: !!unlock,
      phone: unlock ? target?.phone : target?.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
    };
  }

  /** Neighbor unlocks teacher's phone by uploading ID card */
  async unlockByIdCard(userId: string, targetUserId: string, idCardNo: string) {
    if (!idCardNo || !/^\d{17}[\dXx]$/.test(idCardNo)) {
      throw new BadRequestException("请输入正确的18位身份证号码");
    }
    // Store ID card on user and create unlock record
    await this.prisma.user.update({
      where: { id: userId },
      data: { idCardNo },
    });
    // Check if already unlocked
    const existing = await this.prisma.phoneUnlock.findFirst({
      where: { userId, targetUserId },
    });
    if (existing) {
      const target = await this.prisma.user.findUnique({ where: { id: targetUserId }, select: { phone: true } });
      return { phone: target?.phone, message: "已解锁过该老师手机号" };
    }
    await this.prisma.phoneUnlock.create({
      data: { userId, targetUserId, method: "ID_CARD", pointsCost: 0 },
    });
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId }, select: { phone: true } });
    return { phone: target?.phone, message: "身份证验证成功，已解锁手机号" };
  }

  /** Teacher unlocks parent's phone by spending points */
  async unlockByPoints(teacherId: string, targetUserId: string) {
    const POINTS_COST = 5;
    const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new BadRequestException("用户不存在");
    if ((teacher.points || 0) < POINTS_COST) {
      throw new BadRequestException(`积分不足，当前 ${teacher.points || 0} 分，需要 ${POINTS_COST} 分。每天登录可获得1积分。`);
    }
    // Check already unlocked
    const existing = await this.prisma.phoneUnlock.findFirst({
      where: { userId: teacherId, targetUserId },
    });
    if (existing) {
      const target = await this.prisma.user.findUnique({ where: { id: targetUserId }, select: { phone: true } });
      return { phone: target?.phone, message: "已解锁过该家长手机号" };
    }
    // Deduct points and create unlock
    await this.prisma.user.update({
      where: { id: teacherId },
      data: { points: { decrement: POINTS_COST } },
    });
    await this.prisma.phoneUnlock.create({
      data: { userId: teacherId, targetUserId, method: "POINTS", pointsCost: POINTS_COST },
    });
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId }, select: { phone: true } });
    return { phone: target?.phone, pointsSpent: POINTS_COST, remainingPoints: (teacher.points || 0) - POINTS_COST, message: "已解锁手机号" };
  }

  /** Submit a points purchase request (payment already made via QR scan) */
  async purchasePoints(userId: string, amount: number) {
    if (!amount || amount < 5 || amount > 200) {
      throw new BadRequestException("购买金额需在5-200元之间");
    }
    const pointsToAdd = amount; // 1元 = 1积分
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { points: { increment: pointsToAdd } },
    });
    return {
      message: `成功购买 ${pointsToAdd} 积分！当前积分：${user.points}`,
      points: user.points,
      added: pointsToAdd,
    };
  }

  /** Art connector registration — save services, location, backup claim */
  async registerConnector(userId: string, data: {
    services: string[];
    province?: string; city?: string; district?: string; street?: string; community?: string;
    isBackupTeacher?: boolean;
    backupInstrument?: string;
    backupStreet?: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("用户不存在");
    const area = [data.province, data.city, data.district, data.street, data.community].filter(Boolean).join(" ");
    await this.prisma.user.update({ where: { id: userId }, data: { residentialArea: area || user.residentialArea } });
    const existing = await this.prisma.teacherAuth.findUnique({ where: { userId } });
    if (existing) {
      await this.prisma.teacherAuth.update({ where: { userId }, data: { services: JSON.stringify(data.services), isBackupTeacher: data.isBackupTeacher || false, lastActiveAt: new Date() } });
    } else {
      await this.prisma.teacherAuth.create({ data: { userId, realName: user.nickname || "艺术链接者", status: "APPROVED", teacherType: "HOST", services: JSON.stringify(data.services), isBackupTeacher: data.isBackupTeacher || false, lastActiveAt: new Date() } });
    }
    if (data.isBackupTeacher && data.backupInstrument && data.backupStreet) {
      await this.prisma.backupClaim.create({ data: { userId, streetName: data.backupStreet, instrumentId: data.backupInstrument, instrumentName: data.backupInstrument, status: "WAITING" } });
    }
    return { message: "艺术链接者注册成功", services: data.services };
  }

  async getBackupClaims(userId: string) {
    return this.prisma.backupClaim.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }
}
