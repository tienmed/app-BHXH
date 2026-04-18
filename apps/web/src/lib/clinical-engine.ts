import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { runDecisionEngine } from '@app-bhxh/decision-engine';
import type { 
    RecommendationRequest, 
    RecommendationResponse, 
    RecommendationItem, 
    EngineInput 
} from '@app-bhxh/shared-types';

class ClinicalEngineService {
    private cache: any = null;

    private getSeedsPath() {
        // Vercel deployment path for files inside apps/web/src/data-seeds
        return path.join(process.cwd(), 'src/data-seeds');
    }

    private loadData() {
        if (this.cache) return;

        const seedsPath = this.getSeedsPath();
        this.cache = {
            icds: this.readCsv(path.join(seedsPath, 'catalog_icd.csv')),
            clss: this.readCsv(path.join(seedsPath, 'catalog_cls.csv')),
            medications: this.readCsv(path.join(seedsPath, 'catalog_medication.csv')),
            mappingsCls: this.readCsv(path.join(seedsPath, 'mapping_icd_cls.csv')),
            mappingsMed: this.readCsv(path.join(seedsPath, 'mapping_icd_medication.csv')),
            rules: this.readCsv(path.join(seedsPath, 'rule_claim_risk.csv')),
            headers: this.readCsv(path.join(seedsPath, 'protocol_header.csv')),
        };
    }

    private readCsv(filePath: string) {
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return [];
        }
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            relax_column_count: true,
            trim: true
        });
    }

    public async getPreview(input: RecommendationRequest): Promise<RecommendationResponse> {
        this.loadData();

        const diagnoses = input.diagnoses || [];
        const icdCodes = diagnoses.map(d => d.icd);

        // 1. Build Protocols
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

        // Handle additional draftOrders
        if (input.draftOrders) {
            input.draftOrders.forEach(code => {
                const isAlreadyAdded = protocolItems.some(item => item.code === code);
                if (!isAlreadyAdded) {
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
        const relevantRules = this.cache.rules
            .filter((r: any) => {
                if (r.condition_type === "MISSING_REQUIRED_EVIDENCE") {
                    if (!r.applies_to_icd) return false;
                    return icdCodes.some(code => code.startsWith(r.applies_to_icd));
                }
                if (!r.applies_to_icd) return true;
                return icdCodes.some(code => code.startsWith(r.applies_to_icd));
            })
            .map((r: any) => ({
                severity: r.severity?.toLowerCase() || "medium",
                title: r.rule_name,
                message: r.warning_message,
                itemCode: r.target_item_code
            }));

        // 3. Run Engine
        const engineInput: EngineInput = {
            diagnoses,
            protocols: [{ code: "AUTO_GENERATED", items: protocolItems }],
            draftOrders: input.draftOrders,
            rules: {
                claimRisk: relevantRules
            }
        };

        const output = await runDecisionEngine(engineInput);

        return {
            source: "vercel-standalone-csv",
            timestamp: new Date().toISOString(),
            diagnoses,
            recommendations: {
                investigations: output.investigations.map(item => ({ ...item, code: item.code || item.name })),
                medicationGroups: output.medicationGroups.map(item => ({ ...item, code: item.code || item.name }))
            },
            reimbursementGuard: {
                riskScore: output.riskScore,
                suggestedJustification: output.suggestedJustification,
                alerts: output.alerts
            }
        };
    }

    public async searchCatalog(q: string, type: "CLS" | "MEDICATION") {
        this.loadData();
        const query = q.toLowerCase();

        if (type === "CLS") {
            return this.cache.clss
                .filter((c: any) => 
                    (c.cls_name?.toLowerCase().includes(query)) || 
                    (c.cls_code?.toLowerCase().includes(query))
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
                    (m.drug_name?.toLowerCase().includes(query)) || 
                    (m.drug_code?.toLowerCase().includes(query))
                )
                .slice(0, 10)
                .map((m: any) => ({
                    type: "MEDICATION",
                    code: m.drug_code,
                    name: m.drug_name,
                    note: m.active_ingredient || ""
                }));
        }
    }
}

export const clinicalEngine = new ClinicalEngineService();
