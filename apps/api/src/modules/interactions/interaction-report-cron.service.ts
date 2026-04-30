import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { InteractionService } from "./interaction.service";
import { PrismaService } from "../../common/prisma.service";

const VN_TIMEZONE = "Asia/Ho_Chi_Minh";
const VN_OFFSET = "+07:00";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function toDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function getWindow(period: "weekly" | "monthly", now = new Date()) {
  const to = toDateKey(now);
  const start = new Date(now);
  start.setDate(start.getDate() - (period === "weekly" ? 6 : 29));
  return { from: toDateKey(start), to };
}

function msUntilNextVnRun(now = new Date(), hour = 0, minute = 10) {
  const vnNow = new Date(now.toLocaleString("en-US", { timeZone: VN_TIMEZONE }));
  const next = new Date(vnNow);
  next.setHours(hour, minute, 0, 0);
  if (next <= vnNow) next.setDate(next.getDate() + 1);
  return next.getTime() - vnNow.getTime();
}

@Injectable()
export class InteractionReportCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InteractionReportCronService.name);
  private dailyInterval: NodeJS.Timeout | null = null;
  private initialTimeout: NodeJS.Timeout | null = null;
  private lastRunAt: string | null = null;
  private enabled = true;

  constructor(
    private readonly interactionService: InteractionService,
    private readonly prisma: PrismaService
  ) {}

  onModuleInit() {
    this.enabled = process.env.ENABLE_USAGE_REPORT_SCHEDULER !== "false";
    if (!this.enabled) {
      this.logger.log("Usage report scheduler is disabled by env.");
      return;
    }

    const delay = msUntilNextVnRun();
    this.logger.log(`Scheduler armed. First run in ${Math.round(delay / 1000)}s`);

    this.initialTimeout = setTimeout(() => {
      void this.runScheduledJob();
      this.dailyInterval = setInterval(() => {
        void this.runScheduledJob();
      }, ONE_DAY_MS);
    }, delay);

    void this.runScheduledJob();
  }

  onModuleDestroy() {
    if (this.initialTimeout) clearTimeout(this.initialTimeout);
    if (this.dailyInterval) clearInterval(this.dailyInterval);
  }

  getStatus() {
    return {
      enabled: this.enabled,
      timezone: VN_TIMEZONE,
      lastRunAt: this.lastRunAt
    };
  }

  private async runScheduledJob() {
    this.lastRunAt = new Date().toISOString();
    await this.generateIfMissing("weekly");
    await this.generateIfMissing("monthly");
  }

  private async generateIfMissing(period: "weekly" | "monthly") {
    const window = getWindow(period);
    const key = `${period}:${window.from}:${window.to}`;

    const existed = await this.prisma.usageReportSnapshot.findUnique({ where: { key } });
    if (existed) return;

    const report = await this.interactionService.getUsageReport(window.from, window.to);
    const pdf = await this.interactionService.getUsageReportPdf(window.from, window.to);

    await this.prisma.usageReportSnapshot.create({
      data: {
        key,
        period,
        rangeFrom: window.from,
        rangeTo: window.to,
        timezone: `${VN_TIMEZONE} (${VN_OFFSET})`,
        reportJson: report as any,
        pdfBase64: pdf.toString("base64")
      }
    });

    this.logger.log(`Generated periodic report snapshot: ${key}`);
  }
}
