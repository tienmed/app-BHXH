import fs from 'fs';
import path from 'path';

const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzfgoGvVv2hjHvLZ6pKOAr2728Q3DJ2MoprrPvKzUVLmRNlK8zMywn5u6s7P7mYhsvS/exec";
const SEED_DIR = 'c:\\Users\\Thinkpad X280\\.gemini\\App BHXH\\seeds\\google-sheets-pilot';

function readCSV(filename) {
    const filepath = path.join(SEED_DIR, filename);
    if (!fs.existsSync(filepath)) return [];
    
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    
    const header = lines[0].split(',').map(h => h.trim());
    const dataParts = lines.slice(1).map(line => {
        const parts = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                parts.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current);
        return parts;
    });

    return dataParts.map(parts => {
        const obj = {};
        header.forEach((h, i) => {
            let val = (parts[i] || '').trim();
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1);
            }
            obj[h] = val;
        });
        return obj;
    });
}

async function postBatch(items, actionBuilder, label) {
    const BATCH_SIZE = 5;
    for (let i = 0 ; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        console.log(`Pushing ${label} batch ${i/BATCH_SIZE + 1}/${Math.ceil(items.length/BATCH_SIZE)}...`);
        await Promise.all(batch.map(async (item) => {
            try {
                const payload = actionBuilder(item);
                const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }).then(r => r.json());
                console.log(`[${label}] ${item.code || item.icdCode} | ${res.ok ? "OK" : "ERROR"} | ${res.message || res.error}`);
            } catch (err) {
                console.error(`[${label}] Failed:`, err.message);
            }
        }));
    }
}

async function sync() {
    console.log("=== STARTING FAST GOOGLE SHEETS SYNC ===");
    const icdsRaw = readCSV('catalog_icd.csv');
    const clssRaw = readCSV('catalog_cls.csv');
    const medsRaw = readCSV('catalog_medication.csv');
    const mappingCls = readCSV('mapping_icd_cls.csv');
    const mappingMed = readCSV('mapping_icd_medication.csv');
    const protocols = readCSV('protocol_header.csv');
    const rules = readCSV('rule_claim_risk.csv');
    const costs = readCSV('rule_cost_composition.csv');

    // 1. CLS
    const clss = clssRaw.map(item => ({
        kind: 'cls',
        code: item.cls_code,
        name: item.cls_name,
        group: item.cls_group,
        unit: item.unit,
        defaultFrequency: item.default_frequency,
        sourceRef: item.source_ref,
        action: 'create-catalog-entry'
    }));
    await postBatch(clss, item => item, "CLS");

    // 2. Meds
    const meds = medsRaw.map(item => ({
        kind: 'medication',
        code: item.drug_code,
        name: item.drug_name,
        group: item.drug_group,
        route: item.route,
        strength: item.strength,
        isBhytCovered: item.is_bhyt_covered === 'TRUE',
        sourceRef: item.source_ref,
        action: 'create-catalog-entry'
    }));
    await postBatch(meds, item => item, "MED");

    // 3. Bundles
    const bundles = icdsRaw.map(icd => {
        const specialtyKey = icd.source_ref.includes('-') ? icd.source_ref.split('-')[1] : '';
        const protocol = protocols.find(p => p.protocol_code.startsWith(specialtyKey) || p.specialty_code.includes(specialtyKey)) || protocols[0] || {};
        const cost = costs.find(c => c.scope_code === protocol.protocol_code) || {};
        const icdMappingsCls = mappingCls.filter(m => m.icd_code === icd.icd_code);
        const icdMappingsMed = mappingMed.filter(m => m.icd_code === icd.icd_code);
        const icdRules = rules.filter(r => r.applies_to_icd === icd.icd_code);
        const primaryRule = icdRules[0] || {};

        return {
            action: 'create-icd-rule-bundle',
            icdCode: icd.icd_code,
            icdName: icd.icd_name,
            chapter: icd.chapter,
            sourceVersion: icd.source_ref,
            protocolName: protocol.protocol_name || 'Nội khoa ngoại trú',
            protocolStatus: protocol.status || 'active',
            protocolOwner: protocol.owner_name || 'Clinical Council',
            icdRatioMax: parseInt(cost.icd_ratio_max) || 30,
            clsRatioMax: parseInt(cost.cls_ratio_max) || 50,
            drugRatioMax: parseInt(cost.drug_ratio_max) || 40,
            clsCodes: icdMappingsCls.map(m => m.cls_code),
            clsSelections: icdMappingsCls.map(m => ({ code: m.cls_code, selection: m.mapping_type, note: m.note })),
            drugCodes: icdMappingsMed.map(m => m.drug_code),
            drugSelections: icdMappingsMed.map(m => ({ code: m.drug_code, selection: m.mapping_type, note: m.note })),
            severity: primaryRule.severity || 'low',
            warningMessage: primaryRule.warning_message || '',
            recommendedAction: primaryRule.recommended_action || ''
        };
    });
    await postBatch(bundles, item => item, "BUNDLE");

    console.log("=== COMPLETED FAST GOOGLE SHEETS SYNC ===");
}

sync().catch(console.error);
