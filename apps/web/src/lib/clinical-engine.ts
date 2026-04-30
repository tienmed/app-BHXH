import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { runDecisionEngine } from '@app-bhxh/decision-engine';
import { buildClaimRiskRulesWithStats } from '@app-bhxh/domain';

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
        const { rules: relevantRules, stats: ruleStats } = buildClaimRiskRulesWithStats(this.cache.rules, icdCodes);
        console.info(
            `[clinical-engine] rule stats input=${ruleStats.inputRows} output=${ruleStats.outputRules} excludedMissingEvidenceWithoutIcd=${ruleStats.excludedMissingEvidenceWithoutIcd} normalizedSeverity=${ruleStats.normalizedSeverityCount} emptyTitle=${ruleStats.emptyTitleCount} emptyMessage=${ruleStats.emptyMessageCount}`
        );
        if (ruleStats.normalizedSeverityCount > 0 || ruleStats.emptyTitleCount > 0 || ruleStats.emptyMessageCount > 0) {
            console.warn(
                `[clinical-engine] rule quality warning normalizedSeverity=${ruleStats.normalizedSeverityCount} emptyTitle=${ruleStats.emptyTitleCount} emptyMessage=${ruleStats.emptyMessageCount}`
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

    public async getIcdCoverage() {
        this.loadData();

        const groupMap: Array<{ label: string; match: RegExp }> = [
            { label: "Nội", match: /(nội|tuần hoàn|hô hấp|tiêu hóa|nội tiết|thần kinh|thận|tiết niệu|truyền nhiễm)/i },
            { label: "Ngoại", match: /(ngoại|chấn thương|cơ xương khớp|phẫu thuật)/i },
            { label: "Sản", match: /(sản|phụ khoa|thai|obgyn)/i },
            { label: "Nhi", match: /(nhi|trẻ em|pedi)/i },
            { label: "TMH", match: /(tai mũi họng|tmh)/i },
            { label: "Mắt", match: /(mắt|nhãn khoa|eye)/i },
            { label: "Da liễu", match: /(da liễu|da)/i },
        ];

        const activeIcds = this.cache.icds.filter((x: any) => String(x.is_active || "").toUpperCase() !== "FALSE");
        const totalIcd = activeIcds.length;
        const counters = new Map<string, number>();

        for (const icd of activeIcds) {
            const chapter = String(icd.chapter || "");
            const found = groupMap.find((g) => g.match.test(chapter));
            const key = found?.label || "Khác";
            counters.set(key, (counters.get(key) || 0) + 1);
        }

        const byGroup = Array.from(counters.entries())
            .map(([icdGroup, total]) => ({
                icdGroup,
                totalIcd: total,
                percent: totalIcd > 0 ? Number(((total / totalIcd) * 100).toFixed(1)) : 0,
            }))
            .sort((a, b) => b.totalIcd - a.totalIcd);

        return {
            totalIcd,
            byGroup,
            timezone: "Asia/Ho_Chi_Minh",
            source: "local-csv",
        };
    }
}

export const clinicalEngine = new ClinicalEngineService();
