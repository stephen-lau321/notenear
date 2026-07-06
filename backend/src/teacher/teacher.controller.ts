import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { TeacherService } from "./teacher.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";


@ApiTags("老师认证")
@Controller({ path: "teacher", version: "1" })
export class TeacherController {
  constructor(private teacherService: TeacherService) {}

  @Post("apply")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "提交老师认证申请" })
  apply(
    @CurrentUser("id") userId: string,
    @Body() data: {
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
    }
  ) {
    return this.teacherService.apply(userId, data);
  }

  @Get("status")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "查看认证状态" })
  getStatus(@CurrentUser("id") userId: string) {
    return this.teacherService.getStatus(userId);
  }

  @Get("list")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "管理员 - 待审核列表" })
  listPending() {
    return this.teacherService.listPending();
  }

  @Post("verify")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "管理员 - 审核老师" })
  verify(@Body() data: { teacherAuthId: string; approved: boolean; reason?: string }) {
    return this.teacherService.verify(data);
  }
}
