import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { UserService } from "./user.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("用户")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller({ path: "user", version: "1" })
export class UserController {
  constructor(private userService: UserService) {}

  @Get("profile")
  getProfile(@CurrentUser("id") userId: string) {
    return this.userService.getProfile(userId);
  }

  @Patch("profile")
  updateProfile(
    @CurrentUser("id") userId: string,
    @Body() data: {
      nickname?: string; avatar?: string; residentialArea?: string;
      phone?: string;
      studentName?: string; experienceLevel?: string;
      childGender?: string; childAge?: string; childGrade?: string;
      experienceType?: string; experienceSubjects?: string;
      idCardNo?: string; selfGender?: string; selfExperienceYears?: string;
      age?: number; school?: string; experienceFormat?: string;
    }
  ) {
    return this.userService.updateProfile(userId, data);
  }
}
