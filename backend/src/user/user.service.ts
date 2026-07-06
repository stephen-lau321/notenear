import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacherAuth: true },
    });
  }

  async updateProfile(
    userId: string,
    data: { nickname?: string; avatar?: string; residentialArea?: string; studentName?: string; experienceLevel?: string; childGender?: string; childAge?: string; childGrade?: string; experienceType?: string; experienceSubjects?: string }
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}
