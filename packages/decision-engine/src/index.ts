export interface RecommendationItem {
  type: string; // CLS, MEDICATION
  code: string;
  name: string;
  note?: string;
  rationale?: string;
}

export interface ClaimAlert {
  severity: "high" | "medium" | "low";
  title: string;
  message: string;
  actionHint?: string;
}

export interface EngineInput {
  diagnoses: Array<{ icd: string; label?: string }>;
  protocols: Array<{
    code: string;
    items: RecommendationItem[];
  }>;
  rules: {
    claimRisk: ClaimAlert[];
    costComposition?: any;
  };
}

export interface EngineOutput {
  investigations: RecommendationItem[];
  medicationGroups: RecommendationItem[];
  alerts: ClaimAlert[];
}

/**
 * Lõi công cụ ra quyết định (Decision Engine)
 * Nhận dữ liệu đã được truy vấn từ DB và thực hiện tổng hợp khuyến cáo.
 */
export function runDecisionEngine(input: EngineInput): EngineOutput {
  const investigationMap = new Map<string, RecommendationItem>();
  const medicationMap = new Map<string, RecommendationItem>();
  const alerts = [...input.rules.claimRisk];

  // 1. Duyệt qua các giao thức phù hợp để lấy gợi ý
  for (const protocol of input.protocols) {
    for (const item of protocol.items) {
      if (item.type === "CLS") {
        investigationMap.set(item.code, item);
      } else if (item.type === "MEDICATION") {
        medicationMap.set(item.code, item);
      }
    }
  }

  return {
    investigations: Array.from(investigationMap.values()),
    medicationGroups: Array.from(medicationMap.values()),
    alerts
  };
}
