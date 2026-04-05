import { Module } from "@nestjs/common";
import { HealthModule } from "./modules/health/health.module";
import { ImportsModule } from "./modules/imports/imports.module";
import { PilotModule } from "./modules/pilot/pilot.module";
import { RecommendationsModule } from "./modules/recommendations/recommendations.module";

@Module({
  imports: [HealthModule, PilotModule, RecommendationsModule, ImportsModule]
})
export class AppModule {}
