import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { RecommendationsController } from "./recommendations.controller";
import { RecommendationsService } from "./recommendations.service";

@Module({
  controllers: [RecommendationsController],
  providers: [
    {
      provide: RecommendationsService,
      useClass: RecommendationsService
    },
    PrismaService
  ]
})
export class RecommendationsModule {}
