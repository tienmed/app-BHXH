import { Injectable } from "@nestjs/common";
import { googleSheetsWorkbookTemplate } from "./google-sheets-template";
import { PrismaService } from "../../common/prisma.service";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

interface GoogleSheetsPreviewInput {
  workbookId?: string;
  workbookName?: string;
  sheets?: Array<{
    name: string;
    columns: string[];
    rowCount?: number;
  }>;
}

@Injectable()
export class ImportsService {
  constructor(private prisma: PrismaService) {}

  getGoogleSheetsTemplate() {
    return googleSheetsWorkbookTemplate;
  }

  async importSeedData() {
    const SEED_PATH = "c:\\Users\\Thinkpad X280\\.gemini\\App BHXH\\seeds\\google-sheets-pilot";

    // 1. Create a master ImportDataset for this seed run
    const dataset = await this.prisma.importDataset.create({
      data: {
        datasetType: "seed-pilot",
        datasetVersion: "1.0.0",
        approvalStatus: "approved",
        importedBy: "system-seed"
      }
    });

    // 2. Import ICD Catalog
    const icdData = this.readCsv(path.join(SEED_PATH, "catalog_icd.csv"));
    await this.prisma.catalogIcd.createMany({
      data: icdData.map((row: any) => ({
        code: row.icd_code,
        label: row.icd_name,
        datasetId: dataset.id
      }))
    });

    // 3. Import CLS Catalog
    const clsData = this.readCsv(path.join(SEED_PATH, "catalog_cls.csv"));
    await this.prisma.catalogCls.createMany({
      data: clsData.map((row: any) => ({
        code: row.cls_code,
        label: row.cls_name,
        datasetId: dataset.id
      }))
    });

    // 4. Import Medication Catalog
    const medData = this.readCsv(path.join(SEED_PATH, "catalog_medication.csv"));
    await this.prisma.catalogMedication.createMany({
      data: medData.map((row: any) => ({
        code: row.drug_code,
        label: row.drug_name,
        datasetId: dataset.id
      }))
    });

    // 5. Import Mappings
    const icdClsMappingData = this.readCsv(path.join(SEED_PATH, "mapping_icd_cls.csv"));
    await this.prisma.icdClsMapping.createMany({
      data: icdClsMappingData.map((row: any) => ({
        icdCode: row.icd_code,
        clsCode: row.cls_code,
        mappingNote: row.note
      }))
    });

    const icdMedMappingData = this.readCsv(path.join(SEED_PATH, "mapping_icd_medication.csv"));
    await this.prisma.icdMedicationMapping.createMany({
      data: icdMedMappingData.map((row: any) => ({
        icdCode: row.icd_code,
        medCode: row.drug_code,
        mappingNote: row.note
      }))
    });

    // 6. Import Protocols
    const protocolHeaderData = this.readCsv(path.join(SEED_PATH, "protocol_header.csv"));
    const protocolItemData = this.readCsv(path.join(SEED_PATH, "protocol_item.csv"));

    for (const header of protocolHeaderData) {
      const pSet = await this.prisma.protocolSet.create({
        data: {
          name: header.protocol_name,
          description: `Imported protocol ${header.protocol_code}`
        }
      });

      const pVersion = await this.prisma.protocolVersion.create({
        data: {
          protocolSetId: pSet.id,
          datasetId: dataset.id,
          sourceVersion: header.source_version,
          careSetting: header.care_setting,
          specialtyCode: header.specialty_code,
          effectiveFrom: header.effective_from ? new Date(header.effective_from) : null,
          status: "active"
        }
      });

      const itemsForThisProtocol = protocolItemData.filter((item: any) => item.protocol_code === header.protocol_code);
      await this.prisma.protocolItem.createMany({
        data: itemsForThisProtocol.map((item: any) => ({
          protocolVersionId: pVersion.id,
          itemType: item.item_type.toUpperCase(),
          catalogCode: item.item_code,
          priority: parseInt(item.sort_order) || 0,
          note: item.condition_note
        }))
      });
    }

    // 7. Import Rules (Claim Risk)
    const riskRuleData = this.readCsv(path.join(SEED_PATH, "rule_claim_risk.csv"));
    const riskRuleSet = await this.prisma.claimRiskRuleSet.create({
      data: { name: "Pilot Claim Risk Rule Set" }
    });

    await this.prisma.claimRiskRule.createMany({
      data: riskRuleData.map((row: any) => ({
        ruleSetId: riskRuleSet.id,
        datasetId: dataset.id,
        severity: row.severity,
        conditionExpression: row.condition_expression,
        warningMessage: row.warning_message,
        recommendedAction: row.recommended_action
      }))
    });

    // 8. Import Rules (Cost Composition)
    const costRuleData = this.readCsv(path.join(SEED_PATH, "rule_cost_composition.csv"));
    const costRuleSet = await this.prisma.costCompositionRuleSet.create({
      data: { name: "Pilot Cost Composition Rule Set" }
    });

    await this.prisma.costCompositionRule.createMany({
      data: costRuleData.map((row: any) => ({
        ruleSetId: costRuleSet.id,
        datasetId: dataset.id,
        targetScope: row.scope_type,
        targetValue: row.scope_code,
        limitPercent: parseFloat(row.cls_ratio_max) || 0, // Simplified for pilot
        status: "active"
      }))
    });

    return {
      status: "success",
      datasetId: dataset.id,
      counts: {
        icd: icdData.length,
        cls: clsData.length,
        medication: medData.length,
        mappings: icdClsMappingData.length + icdMedMappingData.length,
        protocols: protocolHeaderData.length,
        rules: riskRuleData.length + costRuleData.length
      }
    };
  }

  private readCsv(filePath: string) {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return [];
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return parse(content, {
      columns: true,
      skip_empty_lines: true
    });
  }

  previewGoogleSheetsImport(input: GoogleSheetsPreviewInput) {
    const templateTabs = googleSheetsWorkbookTemplate.tabs;
    const providedSheets = input.sheets ?? [];
    const providedByName = new Map(providedSheets.map((sheet) => [sheet.name, sheet]));

    const tabResults = templateTabs.map((tab) => {
      const provided = providedByName.get(tab.name);

      if (!provided) {
        return {
          tab: tab.name,
          status: "missing",
          missingColumns: tab.requiredColumns,
          rowCount: 0
        };
      }

      const missingColumns = tab.requiredColumns.filter((column) => !provided.columns.includes(column));

      return {
        tab: tab.name,
        status: missingColumns.length === 0 ? "ready" : "invalid",
        missingColumns,
        rowCount: provided.rowCount ?? 0
      };
    });

    const unexpectedTabs = providedSheets
      .filter((sheet) => !templateTabs.some((tab) => tab.name === sheet.name))
      .map((sheet) => sheet.name);

    const blockingIssues = tabResults.filter((result) => result.status !== "ready").length;

    return {
      workbookId: input.workbookId ?? null,
      workbookName: input.workbookName ?? googleSheetsWorkbookTemplate.workbookName,
      mode: "preview",
      sourceOfTruth: "google-sheets",
      runtimeDatabase: "postgresql",
      readyForImport: blockingIssues === 0,
      blockingIssues,
      unexpectedTabs,
      tabResults,
      nextStep:
        blockingIssues === 0
          ? "Workbook structure is valid for the next normalization step."
          : "Fix missing tabs or missing columns before importing into PostgreSQL."
    };
  }
}
