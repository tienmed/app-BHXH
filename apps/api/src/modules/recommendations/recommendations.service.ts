import { Injectable, Logger } from "@nestjs/common";

interface RecommendationPreviewInput {
  encounterCode?: string;
  diagnoses?: Array<{ icd: string; label?: string }>;
  draftOrders?: string[];
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly gasUrl = process.env.GAS_WEB_APP_URL;

  async getPreview(input: RecommendationPreviewInput) {
    if (!this.gasUrl) {
      this.logger.warn("GAS_WEB_APP_URL is not defined. Falling back to local/mock data.");
      return this.getLocalFallback(input);
    }

    try {
      const response = await fetch(this.gasUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recommendations-preview",
          ...input
        })
      });

      if (!response.ok) {
        throw new Error(`GAS API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to fetch from GAS: ${(error as Error).message}`);
      return this.getLocalFallback(input);
    }
  }

  /**
   * Fallback logic when Google Sheets is unavailable.
   * In a real pilot, this could read from a locally cached JSON file.
   */
  private getLocalFallback(input: RecommendationPreviewInput) {
    return {
      source: "local-fallback",
      note: "Dữ liệu đang được lấy từ bộ nhớ đệm nội bộ (Offline Mode).",
      diagnoses: input.diagnoses || [],
      recommendations: {
        investigations: [],
        medicationGroups: []
      },
      reimbursementGuard: {
        costComposition: { icd: 30, cls: 40, medications: 30 },
        alerts: [
          {
            severity: "medium",
            title: "Chế độ Ngoại tuyến",
            description: "Hệ thống không kết nối được với Google Sheets. Vui lòng kiểm tra cấu hình GAS_WEB_APP_URL."
          }
        ]
      }
    };
  }
}
