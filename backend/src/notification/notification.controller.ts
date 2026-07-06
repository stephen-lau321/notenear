import { Controller, Get, Post, Param, Query, Req } from "@nestjs/common";
import { NotificationService } from "./notification.service";

@Controller("notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  listMy(
    @Req() req: any,
    @Query("skip") skip?: string,
    @Query("take") take?: string
  ) {
    return this.notificationService.listMy(
      req.user.id,
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 30
    );
  }

  @Post(":id/read")
  markRead(@Req() req: any, @Param("id") id: string) {
    return this.notificationService.markRead(id, req.user.id);
  }

  @Post("read-all")
  markAllRead(@Req() req: any) {
    return this.notificationService.markAllRead(req.user.id);
  }

  @Get("unread-count")
  getUnreadCount(@Req() req: any) {
    return this.notificationService.getUnreadCount(req.user.id);
  }
}
