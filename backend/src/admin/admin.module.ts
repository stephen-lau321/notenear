import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { StreetClaimModule } from "../street-claim/street-claim.module";

@Module({
  imports: [StreetClaimModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
