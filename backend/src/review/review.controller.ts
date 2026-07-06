import { Controller, Get, Post, Param, Query, Body, Req } from "@nestjs/common";
import { ReviewService } from "./review.service";

@Controller("reviews")
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  create(
    @Req() req: any,
    @Body() body: { claimId: string; rating: number; content?: string }
  ) {
    return this.reviewService.create(req.user.id, body.claimId, body.rating, body.content);
  }

  @Get(":claimId")
  listByClaim(
    @Param("claimId") claimId: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string
  ) {
    return this.reviewService.listByClaim(
      claimId,
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 20
    );
  }
}
