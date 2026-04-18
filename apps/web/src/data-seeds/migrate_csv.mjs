import fs from 'fs';
import path from 'path';

const seedsDir = process.cwd();

function parseCsv(content) {
  const lines = content.replace(/\r\n/g, "\n").split("\n").filter(l => l.trim());
  if (lines.length === 0) return [];
  
  const headers = parseCsvLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    rows.push(row);
  }
  return { headers, rows };
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function writeCsv(filename, headers, rows) {
  const escape = (val) => {
    let s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h] ?? "")).join(","));
  }
  
  fs.writeFileSync(path.join(seedsDir, filename), lines.join("\n"), "utf-8");
  console.log(`Migrated ${filename}`);
}

// 1. catalog_medication.csv
{
  const file = 'catalog_medication.csv';
  const { headers, rows } = parseCsv(fs.readFileSync(path.join(seedsDir, file), "utf-8"));
  
  const newCols = ["max_duration_days", "max_quantity_per_rx", "requires_monitoring_cls", "contraindicated_icd"];
  for (const col of newCols) if (!headers.includes(col)) headers.push(col);
  
  rows.forEach(r => {
    // Basic heuristics based on code
    const code = r.drug_code;
    let maxDur = "30";
    let mon = "";
    
    if (code.includes('ABX') || code.includes('FOSFOMYCIN') || code.includes('CIPROFLOXACIN')) maxDur = "10";
    if (code.includes('OXYMETAZOLINE') || code.includes('DICLOFENAC')) maxDur = "5";
    if (code.includes('NSAID')) maxDur = "14";
    if (code.includes('STATIN')) { mon = "CLS-XN-AST-ALT"; maxDur = "30"; }
    if (code.includes('ACEI') || code.includes('ARB')) { mon = "CLS-XN-CREATININE"; maxDur = "30"; }
    
    r["max_duration_days"] = r["max_duration_days"] || maxDur;
    r["max_quantity_per_rx"] = r["max_quantity_per_rx"] || "90";
    r["requires_monitoring_cls"] = r["requires_monitoring_cls"] || mon;
    r["contraindicated_icd"] = r["contraindicated_icd"] || "";
  });
  writeCsv(file, headers, rows);
}

// 2. catalog_cls.csv
{
  const file = 'catalog_cls.csv';
  const { headers, rows } = parseCsv(fs.readFileSync(path.join(seedsDir, file), "utf-8"));
  
  const newCols = ["min_repeat_interval_days", "requires_red_flag", "restricted_specialty"];
  for (const col of newCols) if (!headers.includes(col)) headers.push(col);
  
  rows.forEach(r => {
    const code = r.cls_code;
    let minRepeat = "0";
    let redFlag = "FALSE";
    let spec = "";
    
    // Parse old interval
    const intervalTxt = String(r.repeat_interval || "").toLowerCase();
    if (intervalTxt.includes('6 tháng')) minRepeat = "150";
    else if (intervalTxt.includes('3 tháng')) minRepeat = "80";
    else if (intervalTxt.includes('1 tháng')) minRepeat = "25";
    
    if (code.includes('MRI') || code.includes('CT')) redFlag = "TRUE";
    if (code.includes('EEG') || code.includes('DIEN-CO') || code.includes('HO-HAP-KY')) spec = "SPECIALIST_ONLY";
    
    r["min_repeat_interval_days"] = r["min_repeat_interval_days"] || minRepeat;
    r["requires_red_flag"] = r["requires_red_flag"] || redFlag;
    r["restricted_specialty"] = r["restricted_specialty"] || spec;
  });
  writeCsv(file, headers, rows);
}

// 3. mapping_icd_cls.csv
{
  const file = 'mapping_icd_cls.csv';
  const { headers, rows } = parseCsv(fs.readFileSync(path.join(seedsDir, file), "utf-8"));
  
  if (!headers.includes("evidence_level")) headers.push("evidence_level");
  
  rows.forEach(r => {
    // recommended = Class I, suggested = Class IIa
    let ev = "IIa";
    if (r.mapping_type === "recommended") ev = "I";
    else if (r.mapping_type === "preferred") ev = "I";
    r["evidence_level"] = r["evidence_level"] || ev;
  });
  writeCsv(file, headers, rows);
}

// 4. mapping_icd_medication.csv
{
  const file = 'mapping_icd_medication.csv';
  const { headers, rows } = parseCsv(fs.readFileSync(path.join(seedsDir, file), "utf-8"));
  
  if (!headers.includes("evidence_level")) headers.push("evidence_level");
  
  rows.forEach(r => {
    let ev = "IIa";
    if (r.mapping_type === "recommended") ev = "I";
    else if (r.mapping_type === "preferred") ev = "I";
    r["evidence_level"] = r["evidence_level"] || ev;
  });
  writeCsv(file, headers, rows);
}

// 5. rule_claim_risk.csv
{
  const file = 'rule_claim_risk.csv';
  const { headers, rows } = parseCsv(fs.readFileSync(path.join(seedsDir, file), "utf-8"));
  
  if (!headers.includes("condition_type")) headers.push("condition_type");
  if (!headers.includes("condition_parameter")) headers.push("condition_parameter");
  
  rows.forEach(r => {
    const expr = r.condition_expression || "";
    let cType = "CUSTOM";
    let cParam = expr;
    
    if (expr.includes('repeat_within')) {
        cType = "REPEAT_INTERVAL_VIOLATION";
        cParam = expr.replace(/\D/g, '');
    } else if (expr.includes('prolonged') || expr.includes('duration_exceeds')) {
        cType = "MAX_DURATION_VIOLATION";
    } else if (expr.includes('without')) {
        cType = "MISSING_REQUIRED_EVIDENCE";
    }
    
    r["condition_type"] = r["condition_type"] || cType;
    r["condition_parameter"] = r["condition_parameter"] || cParam;
  });
  writeCsv(file, headers, rows);
}
