import { Injectable } from "@nestjs/common";
import { promises as fs } from "fs";
import path from "path";
import { PrismaService } from "../../common/prisma.service";

const VN_TIMEZONE = "Asia/Ho_Chi_Minh";
const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const ICD_GROUP_RULES: Array<{ name: string; prefixes: string[] }> = [
  { name: "noi", prefixes: ["A", "B", "E", "I", "J", "K", "N", "R"] },
  { name: "ngoai", prefixes: ["S", "T", "M"] },
  { name: "san", prefixes: ["O"] },
  { name: "phu", prefixes: ["N7", "N8", "N9"] },
  { name: "nhi", prefixes: ["P", "Q"] },
  { name: "mat", prefixes: ["H0", "H1", "H2", "H3", "H4", "H5"] },
  { name: "tai-mui-hong", prefixes: ["H6", "H7", "H8", "H9", "J3"] },
  { name: "da-lieu", prefixes: ["L"] }
];

type UsageReport = {
  timezone: string;
  from: string;
  to: string;
  totalCalls: number;
  trendByDay: Array<{ date: string; totalCalls: number; dateDisplay: string }>;
  topIcd: Array<{ icdCode: string; totalCalls: number }>;
  topGroups: Array<{ icdGroup: string; totalCalls: number }>;
  byAction: Array<{ action: string; totalCalls: number }>;
};

type FeedbackCsvRow = {
  createdAt: string;
  icdCode: string;
  icdName: string;
  feedbackType: string;
  targetType: string;
  targetName: string;
  note: string;
  doctorId: string;
};

const FEEDBACK_CSV_COLUMNS: Array<keyof FeedbackCsvRow> = [
  "createdAt",
  "icdCode",
  "icdName",
  "feedbackType",
  "targetType",
  "targetName",
  "note",
  "doctorId"
];
const FEEDBACK_CSV_PATH = path.join(process.cwd(), "data", "doctor_feedback.csv");

function csvEscape(input: string) {
  return `"${String(input ?? "").replaceAll("\"", "\"\"")}"`;
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}

function toDateKey(input: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(input);
}

export function toDateDisplay(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${day}-${month}-${year}`;
}

export function inferIcdGroup(icdCode: string | null | undefined) {
  const normalized = (icdCode || "").toUpperCase().replace(/\./g, "");
  for (const rule of ICD_GROUP_RULES) {
    if (rule.prefixes.some((prefix) => normalized.startsWith(prefix))) {
      return rule.name;
    }
  }
  return "khac";
}

export function ensureDateKey(input: string, fallback: string) {
  return DATE_KEY_REGEX.test(input) ? input : fallback;
}

export function buildPdfContent(report: UsageReport) {
  const lines = [
    "BAO CAO SU DUNG APP BHXH",
    `Ky bao cao: ${report.from} -> ${report.to}`,
    `Mui gio: ${report.timezone}`,
    `Tong luot goi: ${report.totalCalls}`,
    "Top nhom ICD",
    ...report.topGroups.slice(0, 10).map((x, i) => `${i + 1}. ${x.icdGroup}: ${x.totalCalls}`),
    "Top ICD",
    ...report.topIcd.slice(0, 10).map((x, i) => `${i + 1}. ${x.icdCode}: ${x.totalCalls}`)
  ];

  const escaped = lines.map((line) => line.split("\\").join("\\\\").split("(").join("\\(").split(")").join("\\)")).join("\n");
  const stream = `BT /F1 10 Tf 40 800 Td (${escaped}) Tj ET`;
  const objs = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj\n`
  ];

  const header = "%PDF-1.4\n";
  let offset = header.length;
  const xrefOffsets = ["0000000000 65535 f "];
  for (const obj of objs) {
    xrefOffsets.push(String(offset).padStart(10, "0") + " 00000 n ");
    offset += obj.length;
  }

  const body = objs.join("");
  const xrefStart = header.length + body.length;
  const xref = `xref\n0 ${objs.length + 1}\n${xrefOffsets.join("\n")}\n`;
  const trailer = `trailer << /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(header + body + xref + trailer, "utf-8");
}

@Injectable()
export class InteractionService {
  constructor(private prisma: PrismaService) { }

  async saveFeedback(payload: any) {
    try {
      const row: FeedbackCsvRow = {
        createdAt: new Date().toISOString(),
        icdCode: String(payload.icdCode || ""),
        icdName: String(payload.icdName || ""),
        feedbackType: String(payload.feedbackType || "general"),
        targetType: String(payload.targetType || "general"),
        targetName: String(payload.targetName || ""),
        note: String(payload.note || ""),
        doctorId: String(payload.doctorId || "anonymous")
      };

      await this.appendFeedbackCsv(row);
      return { ok: true, ...row };
    } catch {
      return { ok: false };
    }
  }

  async trackUsage(payload: any) {
    try {
      if (!this.prisma.icdUsageEvent) return { ok: false };

      const occurredAt = payload.occurredAt ? new Date(payload.occurredAt) : new Date();
      const dateKey = toDateKey(occurredAt);
      const icdCode = payload.icdCode || "unknown";

      return await this.prisma.icdUsageEvent.create({
        data: {
          icdCode,
          icdGroup: payload.icdGroup || inferIcdGroup(icdCode),
          action: payload.action || "search",
          doctorId: payload.doctorId || "anonymous",
          source: payload.source || "web",
          occurredAt,
          dateKey
        }
      });
    } catch {
      return { ok: false };
    }
  }

  async getCoverageByGroup() {
    const rows = await this.prisma.catalogIcd.findMany({ select: { code: true } });
    const byGroup = new Map<string, number>();

    for (const row of rows) {
      const group = inferIcdGroup(row.code);
      byGroup.set(group, (byGroup.get(group) || 0) + 1);
    }

    return {
      totalIcd: rows.length,
      byGroup: Array.from(byGroup.entries())
        .map(([icdGroup, totalIcd]) => ({ icdGroup, totalIcd }))
        .sort((a, b) => b.totalIcd - a.totalIcd),
      timezone: VN_TIMEZONE
    };
  }

  async getUsageReport(fromInput: string, toInput: string): Promise<UsageReport> {
    const today = toDateKey(new Date());
    const from = ensureDateKey(fromInput, today);
    const to = ensureDateKey(toInput, today);

    const records = await this.prisma.icdUsageEvent.groupBy({
      by: ["dateKey", "icdCode", "icdGroup", "action"],
      where: { dateKey: { gte: from, lte: to } },
      _count: { _all: true }
    });

    const byDay = new Map<string, number>();
    const byIcd = new Map<string, number>();
    const byGroup = new Map<string, number>();
    const byAction = new Map<string, number>();

    for (const row of records) {
      const count = row._count._all;
      byDay.set(row.dateKey, (byDay.get(row.dateKey) || 0) + count);
      byIcd.set(row.icdCode, (byIcd.get(row.icdCode) || 0) + count);
      byGroup.set(row.icdGroup, (byGroup.get(row.icdGroup) || 0) + count);
      byAction.set(row.action, (byAction.get(row.action) || 0) + count);
    }

    const sortMap = (m: Map<string, number>) =>
      Array.from(m.entries()).sort((a, b) => b[1] - a[1]);

    return {
      timezone: VN_TIMEZONE,
      from,
      to,
      totalCalls: Array.from(byDay.values()).reduce((sum, x) => sum + x, 0),
      trendByDay: Array.from(byDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, totalCalls]) => ({ date, totalCalls, dateDisplay: toDateDisplay(date) })),
      topIcd: sortMap(byIcd).slice(0, 20).map(([icdCode, totalCalls]) => ({ icdCode, totalCalls })),
      topGroups: sortMap(byGroup).map(([icdGroup, totalCalls]) => ({ icdGroup, totalCalls })),
      byAction: sortMap(byAction).map(([action, totalCalls]) => ({ action, totalCalls }))
    };
  }

  async getUsageReportPdf(from: string, to: string) {
    const report = await this.getUsageReport(from, to);
    return buildPdfContent(report);
  }


  async getReportSnapshots(period?: "weekly" | "monthly") {
    return this.prisma.usageReportSnapshot.findMany({
      where: period ? { period } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        key: true,
        period: true,
        rangeFrom: true,
        rangeTo: true,
        timezone: true,
        createdAt: true
      }
    });
  }

  async getReportSnapshotByKey(key: string) {
    if (!key) return null;
    return this.prisma.usageReportSnapshot.findUnique({ where: { key } });
  }
  async getRecentFeedback(icdCode: string, targetName: string) {
    try {
      const rows = await this.readFeedbackCsv();
      return rows
        .filter((row) =>
          row.icdCode === icdCode &&
          row.targetName === targetName &&
          row.targetType !== "general"
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((row) => ({
          note: row.note,
          doctorId: row.doctorId,
          createdAt: row.createdAt,
          feedbackType: row.feedbackType
        }));
    } catch {
      return [];
    }
  }

  async getFeedbackSummary() {
    try {
      const rows = await this.readFeedbackCsv();
      const byType = new Map<string, number>();
      for (const row of rows) {
        const key = row.feedbackType || "general";
        byType.set(key, (byType.get(key) || 0) + 1);
      }

      const total = rows.length;
      const types = Array.from(byType.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([feedbackType, totalFeedback]) => ({
          feedbackType,
          totalFeedback,
          percent: total > 0 ? Number(((totalFeedback / total) * 100).toFixed(1)) : 0
        }));

      const actionMap: Record<string, string> = {
        risk_bhyt: "Ưu tiên rà soát rule BHYT và điều kiện xuất toán liên quan.",
        missing_evidence: "Ưu tiên bổ sung bằng chứng/giải trình cho các gợi ý bị thiếu context.",
        cost_concern: "Ưu tiên rà soát định mức chi phí và thứ tự ưu tiên gợi ý.",
        missing: "Ưu tiên mở rộng mapping ICD -> CLS/thuốc cho nhóm còn thiếu.",
        need_adjustment: "Ưu tiên tinh chỉnh thứ tự hoặc nội dung gợi ý hiện tại."
      };
      const recommendedActions = types
        .filter((item) => item.feedbackType !== "general" && item.totalFeedback >= 3)
        .slice(0, 3)
        .map((item) => ({
          feedbackType: item.feedbackType,
          recommendation: actionMap[item.feedbackType] || "Ưu tiên đánh giá thủ công theo nhóm phản hồi này."
        }));

      return {
        totalFeedback: total,
        types,
        recommendedActions
      };
    } catch {
      return { totalFeedback: 0, types: [], recommendedActions: [] };
    }
  }

  async getFeedbackSummaryCsv() {
    const summary = await this.getFeedbackSummary();
    const lines = ["feedback_type,total_feedback,percent"];
    for (const item of summary.types || []) {
      lines.push(`${item.feedbackType},${item.totalFeedback},${item.percent}`);
    }
    return lines.join("\n");
  }

  private async ensureFeedbackCsvFile() {
    await fs.mkdir(path.dirname(FEEDBACK_CSV_PATH), { recursive: true });
    try {
      await fs.access(FEEDBACK_CSV_PATH);
    } catch {
      const header = `${FEEDBACK_CSV_COLUMNS.join(",")}\n`;
      await fs.writeFile(FEEDBACK_CSV_PATH, header, "utf-8");
    }
  }

  private async appendFeedbackCsv(row: FeedbackCsvRow) {
    await this.ensureFeedbackCsvFile();
    const line = `${FEEDBACK_CSV_COLUMNS.map((key) => csvEscape(row[key])).join(",")}\n`;
    await fs.appendFile(FEEDBACK_CSV_PATH, line, "utf-8");
  }

  private async readFeedbackCsv() {
    await this.ensureFeedbackCsvFile();
    const raw = await fs.readFile(FEEDBACK_CSV_PATH, "utf-8");
    const lines = raw.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length <= 1) return [];
    return lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const row = Object.fromEntries(
        FEEDBACK_CSV_COLUMNS.map((col, idx) => [col, values[idx] ?? ""])
      ) as FeedbackCsvRow;
      return row;
    });
  }

  async saveDismissal(payload: any) {
    try {
      if (!this.prisma.doctorDismissal) return { ok: false };

      return await this.prisma.doctorDismissal.create({
        data: {
          icdCode: payload.icdCode,
          itemType: payload.itemType,
          itemCode: payload.itemCode || payload.itemName,
          itemName: payload.itemName,
          reason: payload.reason,
          doctorId: payload.doctorId || "anonymous"
        }
      });
    } catch {
      return { ok: false };
    }
  }
}
