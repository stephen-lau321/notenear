import { Controller, Get, Post, Param, Query, Req } from "@nestjs/common";
import { MatchingService } from "./matching.service";

@Controller("matching")
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  /** 触发匹配 */
  @Post("match/:demandId")
  matchDemand(@Param("demandId") demandId: string) {
    return this.matchingService.matchDemand(demandId);
  }

  /** 老师查看自己的匹配 */
  @Get("my")
  getMyMatches(@Req() req: any) {
    return this.matchingService.getMyMatches(req.user.id);
  }

  /** 老师接受匹配 */
  @Post(":matchId/accept")
  acceptMatch(@Param("matchId") matchId: string, @Req() req: any) {
    return this.matchingService.updateMatchStatus(matchId, "ACCEPTED", req.user.id);
  }

  /** 老师拒绝匹配 */
  @Post(":matchId/decline")
  declineMatch(@Param("matchId") matchId: string, @Req() req: any) {
    return this.matchingService.updateMatchStatus(matchId, "DECLINED", req.user.id);
  }

  /** 管理员查看所有匹配 */
  @Get()
  listAll(@Query("skip") skip?: string, @Query("take") take?: string) {
    return this.matchingService.listAll(
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 20
    );
  }
}
