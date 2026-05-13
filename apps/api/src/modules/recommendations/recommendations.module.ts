import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { RecommendationsController } from "./recommendations.controller";
import { RecommendationsService } from "./recommendations.service";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [AiModule],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    PrismaService
  ]
})
export class RecommendationsModule {}
