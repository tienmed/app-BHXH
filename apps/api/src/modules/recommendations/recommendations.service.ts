import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { runDecisionEngine, EngineInput, RecommendationItem } from "@app-bhxh/decision-engine";

interface RecommendationPreviewInput {
  encounterCode?: string;
  diagnoses?: Array<{ icd: string; label?: string }>;
  draftOrders?: string[];
}

@Injectable()
export class RecommendationsService implements OnModuleInit {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly seedDir = path.resolve(__dirname, "../../../../../seeds/google-sheets-pilot");
  private cache: any = null;

  async onModuleInit() {
    this.logger.log("Initializing RecommendationsService (CSV Mode)...");
    this.refreshCache();
  }

  private refreshCache() {
    try {
      this.logger.log(`Loading clinical data from ${this.seedDir}`);
      this.cache = {
        icds: this.readCsv("catalog_icd.csv"),
        clss: this.readCsv("catalog_cls.csv"),
        medications: this.readCsv("catalog_medication.csv"),
        mappingsCls: this.readCsv("mapping_icd_cls.csv"),
        mappingsMed: this.readCsv("mapping_icd_medication.csv"),
        rules: this.readCsv("rule_claim_risk.csv")
      };
      this.logger.log(`Loaded ${this.cache.icds.length} ICDs, ${this.cache.clss.length} CLS, ${this.cache.medications.length} Meds.`);
    } catch (error) {
      this.logger.error(`Failed to load CSV data: ${(error as Error).message}`);
    }
  }

  private readCsv(filename: string) {
    const filePath = path.join(this.seedDir, filename);
    if (!fs.existsSync(filePath)) {
      this.logger.error(`File not found: ${filePath}`);
      return [];
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return parse(content, { columns: true, skip_empty_lines: true });
  }

  async getPreview(input: RecommendationPreviewInput) {
    if (!this.cache) this.refreshCache();

    const diagnoses = input.diagnoses || [];
    const icdCodes = diagnoses.map(d => d.icd);

    // 1. Build Protocols (based on ICD mapping)
    const protocolItems: RecommendationItem[] = [];

    // CLS Mappings
    const relatedCls = this.cache.mappingsCls.filter((m: any) => icdCodes.includes(m.icd_code));
    relatedCls.forEach((m: any) => {
      const catalogItem = this.cache.clss.find((c: any) => c.cls_code === m.cls_code);
      protocolItems.push({
        type: "CLS",
        code: m.cls_code,
        name: catalogItem?.cls_name || m.cls_code,
        note: m.note
      });
    });

    // Med Mappings
    const relatedMed = this.cache.mappingsMed.filter((m: any) => icdCodes.includes(m.icd_code));
    relatedMed.forEach((m: any) => {
      const catalogItem = this.cache.medications.find((c: any) => c.drug_code === m.drug_code);
      protocolItems.push({
        type: "MEDICATION",
        code: m.drug_code,
        name: catalogItem?.drug_name || m.drug_code,
        note: m.note
      });
    });

    // 2. Build Claim Risk Rules
    const relevantRules = this.cache.rules
      .filter((r: any) => !r.applies_to_icd || icdCodes.includes(r.applies_to_icd))
      .map((r: any) => ({
        severity: r.severity.toLowerCase(),
        title: r.rule_name,
        message: r.warning_message,
        actionHint: r.recommended_action
      }));

    // 3. Run Engine
    const engineInput: EngineInput = {
      diagnoses,
      protocols: [{ code: "AUTO_GENERATED", items: protocolItems }],
      draftOrders: input.draftOrders, // Pass the doctor's selections
      rules: {
        claimRisk: relevantRules
      }
    };

    const output = await runDecisionEngine(engineInput);

    return {
      source: "local-csv",
      timestamp: new Date().toISOString(),
      diagnoses,
      recommendations: {
        investigations: output.investigations,
        medicationGroups: output.medicationGroups
      },
      reimbursementGuard: {
        riskScore: output.riskScore,
        suggestedJustification: output.suggestedJustification,
        alerts: output.alerts
      }
    };
  }
}
