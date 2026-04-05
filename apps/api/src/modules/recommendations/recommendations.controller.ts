import { Body, Controller, Post } from "@nestjs/common";
import { RecommendationsService } from "./recommendations.service";

interface RecommendationPreviewInput {
  encounterCode?: string;
  diagnoses?: Array<{ icd: string; label?: string }>;
  draftOrders?: string[];
}

@Controller("recommendations")
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post("preview")
  async preview(@Body() input: RecommendationPreviewInput = {}) {
    const result = await this.recommendationsService.getPreview(input);
    return {
      receivedInput: input,
      ...result,
      note: "Results generated from PostgreSQL-backed Decision Engine (Stage 3)."
    };
  }
}
