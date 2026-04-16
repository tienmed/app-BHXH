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
  draftOrders?: string[]; // IDs of items current selected by doctor
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
  riskScore: number; // 0-100
  suggestedJustification: string;
}

/**
 * Lõi công cụ ra quyết định (Decision Engine)
 * Nhận dữ liệu đã được truy vấn từ DB hoặc CSV và thực hiện tổng hợp khuyến cáo.
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
        investigations: input.draftOrders || Array.from(investigationMap.keys()),
        medications: input.draftOrders || Array.from(medicationMap.keys())
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

  // 3. Tính toán Risk Score (0-100) dựa trên Cảnh báo
  // Nếu có draftOrders, ta chỉ tính rủi ro cho những gì đã chọn.
  // Nếu không, ta tính rủi ro tiềm năng của tất cả gợi ý.
  let riskScore = 0;
  alerts.forEach(alert => {
    if (alert.severity === "high") riskScore += 40;
    else if (alert.severity === "medium") riskScore += 20;
    else riskScore += 10;
  });
  riskScore = Math.min(riskScore, 100);

  // 4. Tổng hợp Suggested Justification
  const justifications: string[] = [];
  const itemsToJustify = input.draftOrders && input.draftOrders.length > 0
    ? input.draftOrders.map(code => investigationMap.get(code) || medicationMap.get(code)).filter(Boolean)
    : [...Array.from(investigationMap.values()), ...Array.from(medicationMap.values())];

  itemsToJustify.forEach((item: any) => {
    if (item?.note) justifications.push(`${item.name}: ${item.note}`);
  });

  const suggestedJustification = justifications.length > 0
    ? "Căn cứ y học: " + justifications.join("; ")
    : "Chỉ định theo phác đồ nội khoa ngoại trú.";

  return {
    investigations: Array.from(investigationMap.values()),
    medicationGroups: Array.from(medicationMap.values()),
    alerts,
    riskScore,
    suggestedJustification
  };
}
