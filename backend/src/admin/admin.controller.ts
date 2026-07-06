import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AdminService } from "./admin.service";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("管理后台")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles("ADMIN")
@Controller({ path: "admin", version: "1" })
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get("users")
  @ApiOperation({ summary: "用户列表（按角色筛选）" })
  listUsers(@Query("role") role?: string, @Query("page") page?: number) {
    return this.adminService.listUsers(role, page || 1);
  }

  @Get("dashboard")
  @ApiOperation({ summary: "数据看板" })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get("duplicates")
  @ApiOperation({ summary: "疑似多账号注册检测" })
  getPotentialDuplicates() {
    return this.adminService.getPotentialDuplicates();
  }

  // ===== 老师审核 =====
  @Get("teachers/pending")
  @ApiOperation({ summary: "待审核老师列表" })
  listPendingTeachers() {
    return this.adminService.listPendingTeachers();
  }

  @Post("teachers/review")
  @ApiOperation({ summary: "审核老师" })
  reviewTeacher(
    @Body() data: { authId: string; approved: boolean; reason?: string }
  ) {
    return this.adminService.reviewTeacher(data.authId, data.approved, data.reason);
  }

  // ===== 活动审核 =====
  @Get("activities/pending")
  @ApiOperation({ summary: "待审核活动列表" })
  listPendingActivities() {
    return this.adminService.listPendingActivities();
  }

  @Post("activities/review")
  @ApiOperation({ summary: "审核活动" })
  reviewActivity(
    @Body() data: { activityId: string; approved: boolean; reason?: string }
  ) {
    return this.adminService.reviewActivity(data.activityId, data.approved, data.reason);
  }

  // ===== 认领管理 =====
  @Get("claims")
  @ApiOperation({ summary: "所有认领记录" })
  listClaims(@Query("page") page?: number, @Query("pageSize") pageSize?: number) {
    return this.adminService.listAllClaims(page || 1, pageSize || 20);
  }

  @Post("claims/:id/release")
  @ApiOperation({ summary: "解除认领" })
  releaseClaim(@Param("id") id: string) {
    return this.adminService.releaseClaim(id);
  }

  @Get("claims/modifications")
  @ApiOperation({ summary: "待审核的认领修改/释放" })
  listModifications() {
    return this.adminService.listModifications();
  }

  @Post("claims/:id/approve-modify")
  @ApiOperation({ summary: "通过认领修改" })
  approveModify(@Param("id") id: string) {
    return this.adminService.approveModify(id);
  }

  @Post("claims/:id/reject-modify")
  @ApiOperation({ summary: "驳认领修改" })
  rejectModify(@Param("id") id: string) {
    return this.adminService.rejectModify(id);
  }

  @Post("claims/:id/approve-release")
  @ApiOperation({ summary: "通过释放申请" })
  approveRelease(@Param("id") id: string) {
    return this.adminService.approveRelease(id);
  }

  @Post("claims/:id/reject-release")
  @ApiOperation({ summary: "驳回释放申请" })
  rejectRelease(@Param("id") id: string) {
    return this.adminService.rejectRelease(id);
  }
}
