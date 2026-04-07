import { Engine, RuleProperties } from "json-rules-engine";

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
    dynamicRules?: any[];
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
export async function runDecisionEngine(input: EngineInput): Promise<EngineOutput> {
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

  // 2. Chạy Dynamic Rule Engine
  if (input.rules.dynamicRules && input.rules.dynamicRules.length > 0) {
    const engine = new Engine();
    
    for (const ruleDef of input.rules.dynamicRules) {
      engine.addRule(ruleDef as RuleProperties);
    }

    const facts = {
      patient: {
        diagnoses: input.diagnoses.map(d => d.icd),
        investigations: Array.from(investigationMap.keys()),
        medications: Array.from(medicationMap.keys())
      }
    };

    const runResult = await engine.run(facts);
    
    // Thu thập cảnh báo từ rules bị vi phạm
    runResult.events.forEach(event => {
      if (event.type === "block" || event.type === "warning") {
        alerts.push({
          severity: event.type === "block" ? "high" : "medium",
          title: "Quy tắc BHXH",
          message: event.params?.message ? String(event.params.message) : "Phát hiện vi phạm quy tắc chỉ định.",
        });
      }
    });
  }

  return {
    investigations: Array.from(investigationMap.values()),
    medicationGroups: Array.from(medicationMap.values()),
    alerts
  };
}
