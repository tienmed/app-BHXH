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
  itemCode?: string; // Code of the item this alert applies to
  conditionType?: string; // From CSV: REPEAT_INTERVAL_VIOLATION, MISSING_REQUIRED_EVIDENCE, etc.
  requiredEvidenceCode?: string; // Codes required to avoid this alert
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
          itemCode: event.params?.itemCode as string | undefined
        });
      }
    });
  }

  // 3. Tính toán Risk Score (0-100) dựa trên Cảnh báo
  let riskScore = 0;

  const triggeredAlerts = alerts.filter(alert => {
    // Handle pipe-separated codes: "CODE1|CODE2"
    const codes = alert.itemCode ? alert.itemCode.split("|").map(s => s.trim()) : [];
    const isAnyCodeSelected = codes.some(code => input.draftOrders?.includes(code));
    
    if (alert.conditionType === "MISSING_REQUIRED_EVIDENCE") {
      if (alert.requiredEvidenceCode) {
        const reqCodes = alert.requiredEvidenceCode.split("|").map(s => s.trim());
        const hasEvidence = reqCodes.some(code => input.draftOrders?.includes(code));
        const isTriggerItemSelected = alert.itemCode ? alert.itemCode.split("|").some(c => input.draftOrders?.includes(c.trim())) : true;
        return isTriggerItemSelected && !hasEvidence;
      }
      // Fallback if no explicit required evidence: trigger if NONE of the itemCodes are selected
      return codes.length > 0 && !isAnyCodeSelected;
    }
    
    // Default: Trigger if any code is selected (or no itemCode = global)
    return alert.itemCode ? isAnyCodeSelected : true;
  });

  // Calculate risk score from all triggered alerts
  triggeredAlerts.forEach(alert => {
    const isMissing = alert.conditionType === "MISSING_REQUIRED_EVIDENCE";
    
    // Missing evidence is a risk, but we weight it slightly differently 
    // or keep it same if it's high severity.
    if (alert.severity === "high") riskScore += 30;
    else if (alert.severity === "medium") riskScore += 15;
    else riskScore += 5;
  });

  riskScore = Math.min(riskScore, 100);

  // 4. Tổng hợp Suggested Justification
  const justifications: string[] = [];
  const itemsToJustify = input.draftOrders && input.draftOrders.length > 0
    ? input.draftOrders.map(code => investigationMap.get(code) || medicationMap.get(code)).filter(Boolean)
    : [...Array.from(investigationMap.values()), ...Array.from(medicationMap.values())];

  const formatNoteHierarchical = (note: string) => {
    if (!note) return "";
    
    // Split points for CLS and MED
    const keywords = [
      "Mục đích:", "Muc dich:", 
      "Ưu tiên:", "Uu tien:",
      "Lặp lại:", "Lap lai:",
      "Tác dụng phụ:", "Tac dung phu:",
      "Tương tác:", "Tuong tac:"
    ];
    
    let result = note;
    keywords.forEach(kw => {
      // Use regex to find keyword and add a newline + indentation
      // We look for keyword either at start of string or after a period/semicolon/space
      const regex = new RegExp(`(?<=[.;!\\s]|^)(${kw})`, 'g');
      result = result.replace(regex, '\n    + $1');
    });
    
    return result.trim();
  };

  itemsToJustify.forEach((item: any) => {
    if (item?.note) {
      const formattedNote = formatNoteHierarchical(item.note);
      justifications.push(`- ${item.name}:\n    ${formattedNote}`);
    }
  });

  const suggestedJustification = justifications.length > 0
    ? "Căn cứ y học:\n" + justifications.join("\n\n")
    : "Chỉ định theo phác đồ nội khoa ngoại trú.";

  return {
    investigations: Array.from(investigationMap.values()),
    medicationGroups: Array.from(medicationMap.values()),
    alerts: triggeredAlerts,
    riskScore,
    suggestedJustification
  };
}
