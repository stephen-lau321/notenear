import { Controller, Post, Get, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { ContactService } from "./contact.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("邻里交流")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller({ path: "contact", version: "1" })
export class ContactController {
  constructor(private contactService: ContactService) {}

  @Post("message")
  @ApiOperation({ summary: "邻居给老师留言" })
  sendMessage(
    @CurrentUser("id") userId: string,
    @Body() data: { teacherId: string; message: string }
  ) {
    return this.contactService.sendMessage(userId, data.teacherId, data.message);
  }

  @Get("messages")
  @ApiOperation({ summary: "查看我的留言列表" })
  listMessages(@CurrentUser("id") userId: string) {
    return this.contactService.listMessages(userId);
  }

  @Post("message/:id/reply")
  @ApiOperation({ summary: "老师回复留言" })
  reply(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body("reply") reply: string
  ) {
    return this.contactService.reply(id, userId, reply);
  }

  @Get("phone-check/:targetUserId")
  @ApiOperation({ summary: "检查是否已解锁目标用户手机号" })
  checkPhone(
    @CurrentUser("id") userId: string,
    @Param("targetUserId") targetUserId: string
  ) {
    return this.contactService.checkPhoneUnlock(userId, targetUserId);
  }

  @Post("unlock-phone/idcard")
  @ApiOperation({ summary: "邻居上传身份证解锁老师手机号" })
  unlockByIdCard(
    @CurrentUser("id") userId: string,
    @Body() data: { targetUserId: string; idCardNo: string }
  ) {
    return this.contactService.unlockByIdCard(userId, data.targetUserId, data.idCardNo);
  }

  @Post("unlock-phone/points")
  @ApiOperation({ summary: "老师消耗积分解锁家长手机号" })
  unlockByPoints(
    @CurrentUser("id") userId: string,
    @Body() data: { targetUserId: string }
  ) {
    return this.contactService.unlockByPoints(userId, data.targetUserId);
  }

  @Post("buy-points")
  @ApiOperation({ summary: "扫码付款后购买积分" })
  buyPoints(
    @CurrentUser("id") userId: string,
    @Body() data: { amount: number }
  ) {
    return this.contactService.purchasePoints(userId, data.amount);
  }

  @Post("connector/register")
  @ApiOperation({ summary: "艺术链接者注册（服务+位置+候补）" })
  registerConnector(
    @CurrentUser("id") userId: string,
    @Body() data: any
  ) {
    return this.contactService.registerConnector(userId, data);
  }

  @Get("backup-claims")
  @ApiOperation({ summary: "查看我的候补认领" })
  getBackupClaims(@CurrentUser("id") userId: string) {
    return this.contactService.getBackupClaims(userId);
  }
}
