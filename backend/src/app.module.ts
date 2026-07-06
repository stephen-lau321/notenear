import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { TeacherModule } from "./teacher/teacher.module";
import { StreetClaimModule } from "./street-claim/street-claim.module";
import { ActivityModule } from "./activity/activity.module";
import { MediaModule } from "./media/media.module";
import { MapModule } from "./map/map.module";
import { ProductModule } from "./product/product.module";
import { OrderModule } from "./order/order.module";
import { InstrumentModule } from "./instrument/instrument.module";
import { AdminModule } from "./admin/admin.module";
import { ContactModule } from "./contact/contact.module";
import { ScoringModule } from "./scoring/scoring.module";
import { DemandModule } from "./demand/demand.module";
import { MatchingModule } from "./matching/matching.module";
import { ReviewModule } from "./review/review.module";
import { FavoriteModule } from "./favorite/favorite.module";
import { NotificationModule } from "./notification/notification.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    TeacherModule,
    StreetClaimModule,
    ActivityModule,
    MediaModule,
    MapModule,
    ProductModule,
    OrderModule,
    InstrumentModule,
    AdminModule,
    ContactModule,
    ScoringModule,
    DemandModule,
    MatchingModule,
    ReviewModule,
    FavoriteModule,
    NotificationModule,
  ],
})
export class AppModule {}
