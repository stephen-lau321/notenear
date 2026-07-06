import { Injectable, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  /** Register with email + password */
  async register(email: string, password: string, role?: string) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException("请输入有效的邮箱地址");
    if (!password || password.length < 6) throw new BadRequestException("密码至少6位");
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException("该邮箱已注册");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role || "PARENT",
        points: 1, // welcome points
      },
    });
    return { token: this.generateToken(user.id, user.role), user: { id: user.id, email: user.email, role: user.role, points: user.points } };
  }

  /** Login with email + password */
  async login(email: string, password: string) {
    if (!email || !password) throw new BadRequestException("请输入邮箱和密码");
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new BadRequestException("邮箱或密码错误");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new BadRequestException("邮箱或密码错误");

    // Daily login points
    const today = new Date().toISOString().slice(0, 10);
    const lastLogin = user.updatedAt?.toISOString().slice(0, 10);
    if (lastLogin !== today) {
      await this.prisma.user.update({ where: { id: user.id }, data: { points: { increment: 1 } } });
    }
    const updated = await this.prisma.user.findUnique({ where: { id: user.id } });
    return { token: this.generateToken(user.id, user.role), user: { id: user.id, email: user.email, role: user.role, nickname: user.nickname, phone: user.phone, points: updated!.points } };
  }

  // Keep phone login for backward compatibility
  async phoneLogin(phone: string, code: string) {
    if (code !== "888888") throw new BadRequestException("验证码错误");
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) user = await this.prisma.user.create({ data: { phone, role: "PARENT" } });
    return { token: this.generateToken(user.id, user.role), user: { id: user.id, phone: user.phone, role: user.role, nickname: user.nickname, points: user.points } };
  }

  async neighborRegister(data: any) {
    if (!data.phone || !/^1\d{10}$/.test(data.phone)) throw new BadRequestException("请输入正确的手机号");
    const area = [data.province, data.city, data.district, data.street, data.community].filter(Boolean).join(" ");
    let user = await this.prisma.user.findUnique({ where: { phone: data.phone } });
    const updateData = { residentialArea: area, experienceType: data.experienceType, experienceSubjects: data.experienceSubjects, age: data.age, selfGender: data.selfGender, studentName: data.studentName, childGender: data.childGender, childAge: data.childAge, childGrade: data.childGrade, school: data.school };
    if (user) { user = await this.prisma.user.update({ where: { phone: data.phone }, data: updateData }); }
    else { user = await this.prisma.user.create({ data: { ...updateData, phone: data.phone, role: "PARENT", points: 1 } }); }
    return { token: this.generateToken(user.id, user.role), user: { id: user.id, phone: user.phone, role: user.role, nickname: user.nickname, points: user.points } };
  }

  private generateToken(userId: string, role: string): string {
    return this.jwtService.sign({ sub: userId, role });
  }
}
