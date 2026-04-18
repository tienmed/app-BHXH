import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { runDecisionEngine } from '@app-bhxh/decision-engine';

export interface RecommendationRequest {
    diagnoses: Array<{ icd: string; label: string; type: "primary" | "secondary" }>;
    draftOrders?: string[];
}

export interface RecommendationResponse {
    source: string;
    timestamp: string;
    diagnoses: any[];
    recommendations: {
        investigations: any[];
        medicationGroups: any[];
    };
    reimbursementGuard: {
        riskScore: number;
        suggestedJustification: string;
        alerts: any[];
    };
}

export interface RecommendationItem {
    type: "CLS" | "MEDICATION";
    code: string;
    name: string;
    note: string;
}

export interface EngineInput {
    diagnoses: any[];
    protocols: Array<{ code: string; items: RecommendationItem[] }>;
    draftOrders?: string[];
    rules: {
        claimRisk: any[];
    };
}

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
                if (!r.applies_to_icd) return true;
                const targetIcds = r.applies_to_icd.split("|").map((s: string) => s.trim());
                
                if (r.condition_type === "MISSING_REQUIRED_EVIDENCE") {
                    return icdCodes.some(code => targetIcds.some((t: string) => code.startsWith(t)));
                }
                return icdCodes.some(code => targetIcds.some((t: string) => code.startsWith(t)));
            })
            .map((r: any) => {
                let requiredEvidenceCode = undefined;
                if (r.condition_type === "MISSING_REQUIRED_EVIDENCE") {
                    if (r.rule_code === "RISK-RESP-01") requiredEvidenceCode = "CLS-TDCN-HO-HAP-KY";
                    else if (r.rule_code === "RISK-MSK-05") requiredEvidenceCode = "CLS-CDHA-DXA";
                    else if (r.rule_code === "RISK-URO-02") requiredEvidenceCode = "CLS-CDHA-SA-HE-NIEC";
                    else if (r.rule_code === "RISK-INF-02") requiredEvidenceCode = "CLS-XN-HBV-DNA|CLS-XN-AST-ALT";
                    else if (r.rule_code === "RISK-EYE-02") requiredEvidenceCode = "CLS-TDCN-NHAN-AP";
                    else if (r.rule_code === "RISK-ENDOC-04") requiredEvidenceCode = "CLS-XN-AST-ALT";
                    else if (r.rule_code === "RISK-ENDOC-06") requiredEvidenceCode = "CLS-XN-TSH";
                    else if (r.rule_code === "RISK-OBGYN-06") requiredEvidenceCode = "CLS-XN-BETA-HCG";
                    else if (r.rule_code === "RISK-BREAST-03") requiredEvidenceCode = "CLS-CDHA-SA-TUYEN-VU";
                }

                let itemCode = r.applies_to_cls || r.applies_to_drug || undefined;
                
                // If it's a global rule with no specific item, it applies to the whole protocol/ICD
                return {
                    severity: r.severity?.toLowerCase() || "medium",
                    title: r.rule_name,
                    message: r.warning_message,
                    itemCode: itemCode,
                    conditionType: r.condition_type,
                    requiredEvidenceCode: requiredEvidenceCode || r.condition_parameter
                };
            });

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

    public async getMeta() {
        this.loadData();
        const firstHeader = this.cache.headers?.[0];
        const version = firstHeader?.source_version || "2026.01";
        return {
            version,
            source: "local-csv"
        };
    }
}

export const clinicalEngine = new ClinicalEngineService();
