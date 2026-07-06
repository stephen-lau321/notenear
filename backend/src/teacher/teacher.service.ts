import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  async apply(
    userId: string,
    data: {
      realName: string;
      idCardFront?: string;
      idCardBack?: string;
      idCardNo?: string;
      instrumentNames: string[];
      gender?: string;
      graduationSchool?: string;
      major?: string;
      experienceYears?: string;
      teacherType?: string;
      graduationCert?: string;
      teacherCert?: string;
      experienceItems?: string;
      highestDegree?: string;
      isStudent?: boolean;
    }
  ) {
    const existing = await this.prisma.teacherAuth.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new BadRequestException("您已提交过认证申请");
    }

    // 身份证号唯一性检查
    if (data.idCardNo) {
      const idCardExists = await this.prisma.teacherAuth.findUnique({
        where: { idCardNo: data.idCardNo },
      });
      if (idCardExists) {
        throw new BadRequestException(
          "该身份证号已被其他账号使用。一个身份证号只能认证一个音乐主理人账号。如有疑问请联系管理员。"
        );
      }
    }

    const isStudentFlag = data.isStudent === true;

    // 更新用户角色
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: data.teacherType === "HOST" ? ("PARENT" as any) : ("TEACHER" as any) },
    });

    // 创建认证记录
    const auth = await this.prisma.teacherAuth.create({
      data: {
        userId,
        realName: data.realName,
        idCardFront: data.idCardFront,
        idCardBack: data.idCardBack,
        idCardNo: data.idCardNo,
        gender: data.gender,
        graduationSchool: data.graduationSchool,
        highestDegree: data.highestDegree,
        major: data.major,
        experienceYears: isStudentFlag ? "在读" : data.experienceYears,
        graduationCert: data.graduationCert,
        teacherCert: data.teacherCert,
        experienceItems: data.experienceItems,
        isStudent: isStudentFlag,
      },
    });

    // 创建或关联乐器
    for (const name of data.instrumentNames) {
      let instrument = await this.prisma.instrument.findFirst({
        where: { name },
      });
      if (!instrument) {
        instrument = await this.prisma.instrument.create({ data: { name } });
      }
    }

    return auth;
  }

  async getStatus(userId: string) {
    return this.prisma.teacherAuth.findUnique({
      where: { userId },
      include: { streetClaims: { include: { instrument: true } } },
    });
  }

  async listPending() {
    return this.prisma.teacherAuth.findMany({
      where: { status: "PENDING" },
      include: { user: true },
    });
  }

  async verify(data: { teacherAuthId: string; approved: boolean; reason?: string }) {
    return this.prisma.teacherAuth.update({
      where: { id: data.teacherAuthId },
      data: {
        status: data.approved ? "APPROVED" : "REJECTED",
        verifiedAt: data.approved ? new Date() : undefined,
      },
    });
  }
}
