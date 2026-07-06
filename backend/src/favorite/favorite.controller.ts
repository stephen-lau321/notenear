import { Controller, Get, Post, Param, Req } from "@nestjs/common";
import { FavoriteService } from "./favorite.service";

@Controller("favorites")
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post(":claimId")
  toggle(@Req() req: any, @Param("claimId") claimId: string) {
    return this.favoriteService.toggle(req.user.id, claimId);
  }

  @Get()
  listMy(@Req() req: any) {
    return this.favoriteService.listMy(req.user.id);
  }

  @Get("check/:claimId")
  check(@Req() req: any, @Param("claimId") claimId: string) {
    return this.favoriteService.isFavorited(req.user.id, claimId);
  }
}
