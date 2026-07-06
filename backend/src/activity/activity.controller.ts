import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { ActivityService } from "./activity.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("活动")
@Controller({ path: "activities", version: "1" })
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Post()
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "发布活动（管理员可设置 autoApprove 直接通过）" })
  create(
    @CurrentUser("id") userId: string,
    @Body() data: {
      title: string;
      description?: string;
      coverImage?: string;
      eventTime?: string;
      location?: string;
      price?: number;
      autoApprove?: boolean;
    }
  ) {
    return this.activityService.create(userId, data, data.autoApprove);
  }

  @Get("teacher/:teacherId")
  @ApiOperation({ summary: "查看老师的所有活动（公开仅已审核）" })
  listByTeacher(
    @Param("teacherId") teacherId: string,
    @Query("all") all?: string
  ) {
    return this.activityService.listByTeacher(teacherId, all === "1");
  }

  @Get("my")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "查看自己的所有活动（含待审核）" })
  listMyActivities(@CurrentUser("id") userId: string) {
    return this.activityService.listByTeacher(userId, true);
  }

  @Get(":id")
  @ApiOperation({ summary: "查看活动详情" })
  getById(@Param("id") id: string) {
    return this.activityService.getById(id);
  }
}
