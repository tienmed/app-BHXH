import { Body, Controller, Get, Post, Inject, Query } from "@nestjs/common";
import { RecommendationsService } from "./recommendations.service";

interface RecommendationPreviewInput {
  encounterCode?: string;
  diagnoses?: Array<{ icd: string; label?: string }>;
  draftOrders?: string[];
}

@Controller("recommendations")
export class RecommendationsController {
  constructor(@Inject(RecommendationsService) private readonly recommendationsService: RecommendationsService) { }

  @Post("preview")
  async preview(@Body() input: RecommendationPreviewInput = {}) {
    const result = await this.recommendationsService.getPreview(input);
    return {
      receivedInput: input,
      ...result,
      note: "Results generated from CSV-backed Decision Engine."
    };
  }

  @Get("meta")
  async getMeta() {
    return this.recommendationsService.getMeta();
  }

  @Get("search")
  async search(@Query("q") q: string, @Query("type") type: "CLS" | "MEDICATION") {
    return this.recommendationsService.searchCatalog(q, type);
  }
}
