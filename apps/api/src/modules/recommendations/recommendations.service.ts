import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { runDecisionEngine, EngineInput, RecommendationItem } from "@app-bhxh/decision-engine";
import { buildClaimRiskRulesWithStats } from "@app-bhxh/domain";

interface RecommendationPreviewInput {
  encounterCode?: string;
  diagnoses?: Array<{ icd: string; label?: string }>;
  draftOrders?: string[];
  sessionProfile?: {
    specialty?: string;
    experience?: string;
    assistMode?: "full" | "concise" | "risk-only";
  };
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
        rules: this.readCsv("rule_claim_risk.csv"),
        protocolHeaders: this.readCsv("protocol_header.csv")
      };
      this.logger.log(`Loaded ${this.cache.icds.length} ICDs, ${this.cache.clss.length} CLS, ${this.cache.medications.length} Meds, ${this.cache.protocolHeaders.length} Protocol Headers.`);
    } catch (error) {
      this.logger.error(`Failed to load CSV data: ${(error as Error).message}`);
    }
  }

  private readCsv(filename: string): any[] {
    const filePath = path.join(this.seedDir, filename);
    if (!fs.existsSync(filePath)) {
      this.logger.warn(`File not found: ${filename}`);
      return [];
    }

    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      return parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
      });
    } catch (error) {
      this.logger.error(`Failed to load CSV data from ${filename}: ${(error as Error).message}`);
      return [];
    }
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

    // Handle additional draftOrders that are not in the recommended list
    if (input.draftOrders) {
      input.draftOrders.forEach(code => {
        const isAlreadyAdded = protocolItems.some(item => item.code === code);
        if (!isAlreadyAdded) {
          // Search in CLS catalog
          const clsItem = this.cache.clss.find((c: any) => c.cls_code === code);
          if (clsItem) {
            protocolItems.push({
              type: "CLS",
              code: clsItem.cls_code,
              name: clsItem.cls_name,
              note: "Chỉ định bổ sung ngoài phác đồ."
            });
            return;
          }
          // Search in Med catalog
          const medItem = this.cache.medications.find((m: any) => m.drug_code === code);
          if (medItem) {
            protocolItems.push({
              type: "MEDICATION",
              code: medItem.drug_code,
              name: medItem.drug_name,
              note: "Thuốc bổ sung ngoài phác đồ."
            });
          }
        }
      });
    }

    // 2. Build Claim Risk Rules
    const { rules: relevantRules, stats: ruleStats } = buildClaimRiskRulesWithStats(this.cache.rules, icdCodes, {
      missingEvidenceRequiresIcd: true
    });
    this.logger.log(
      `Rule stats: input=${ruleStats.inputRows}, output=${ruleStats.outputRules}, excludedMissingEvidenceWithoutIcd=${ruleStats.excludedMissingEvidenceWithoutIcd}, normalizedSeverity=${ruleStats.normalizedSeverityCount}, emptyTitle=${ruleStats.emptyTitleCount}, emptyMessage=${ruleStats.emptyMessageCount}`
    );
    if (ruleStats.normalizedSeverityCount > 0 || ruleStats.emptyTitleCount > 0 || ruleStats.emptyMessageCount > 0) {
      this.logger.warn(
        `Rule quality warning: normalizedSeverity=${ruleStats.normalizedSeverityCount}, emptyTitle=${ruleStats.emptyTitleCount}, emptyMessage=${ruleStats.emptyMessageCount}`
      );
    }

    // 3. Run Engine
    const engineInput: EngineInput = {
      diagnoses,
      protocols: [{ code: "AUTO_GENERATED", items: protocolItems }],
      draftOrders: input.draftOrders,
      rules: {
        claimRisk: relevantRules
      }
    };

    this.logger.log(`Running Engine for ${icdCodes.join(",")} with ${input.draftOrders?.length || 0} selections.`);
    const output = await runDecisionEngine(engineInput);

    const assistMode = input.sessionProfile?.assistMode ?? "full";
    const trimByAssistMode = <T>(items: T[]): T[] => {
      if (assistMode === "concise") return items.slice(0, 3);
      return items;
    };

    const result = {
      source: "local-csv",
      timestamp: new Date().toISOString(),
      diagnoses,
      sessionProfile: input.sessionProfile ?? null,
      recommendations: {
        investigations: trimByAssistMode(output.investigations.map(item => ({ ...item, code: item.code || item.name }))),
        medicationGroups: trimByAssistMode(output.medicationGroups.map(item => ({ ...item, code: item.code || item.name })))
      },
      reimbursementGuard: {
        riskScore: output.riskScore,
        suggestedJustification: output.suggestedJustification,
        alerts: assistMode === "risk-only" ? output.alerts : trimByAssistMode(output.alerts)
      }
    };

    return result;
  }

  getMeta() {
    if (!this.cache) this.refreshCache();
    const latestHeader = this.cache.protocolHeaders[0];
    return {
      version: latestHeader?.source_version || "0.0.0",
      effectiveDate: latestHeader?.effective_from || null,
      source: "local-csv"
    };
  }

  async searchCatalog(query: string, type: "CLS" | "MEDICATION") {
    if (!query || query.length < 2) return [];
    if (!this.cache) this.refreshCache();
    
    const q = query.toLowerCase();
    
    if (type === "CLS") {
      return this.cache.clss
        .filter((c: any) => 
          (c.cls_name?.toLowerCase().includes(q)) || 
          (c.cls_code?.toLowerCase().includes(q))
        )
        .slice(0, 10)
        .map((c: any) => ({
          type: "CLS",
          code: c.cls_code,
          name: c.cls_name,
          note: c.clinical_purpose || ""
        }));
    } else {
      return this.cache.medications
        .filter((m: any) => 
          (m.drug_name?.toLowerCase().includes(q)) || 
          (m.drug_code?.toLowerCase().includes(q))
        )
        .slice(0, 10)
        .map((m: any) => ({
          type: "MEDICATION",
          code: m.drug_code,
          name: m.drug_name,
          note: m.therapeutic_purpose || ""
        }));
    }
  }
}
