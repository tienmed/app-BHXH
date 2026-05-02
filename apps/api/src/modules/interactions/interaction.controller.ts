import { Controller, Get, Post, Body, Query, Inject, Res } from "@nestjs/common";
import { InteractionService } from "./interaction.service";
import { InteractionReportCronService } from "./interaction-report-cron.service";

function toDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function resolveRange(period?: string, from?: string, to?: string) {
  if (from && to) return { from, to };
  const now = new Date();
  const end = toDateKey(now);
  if (period === "weekly") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { from: toDateKey(start), to: end };
  }
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  return { from: toDateKey(start), to: end };
}

@Controller("interactions")
export class InteractionController {
  constructor(
    @Inject(InteractionService) private readonly interactionService: InteractionService,
    @Inject(InteractionReportCronService) private readonly cronService: InteractionReportCronService
  ) { }

  @Post("feedback")
  async submitFeedback(@Body() payload: any) {
    return this.interactionService.saveFeedback(payload);
  }

  @Post("track")
  async trackUsage(@Body() payload: any) {
    return this.interactionService.trackUsage(payload);
  }

  @Get("coverage")
  async getCoverage() {
    return this.interactionService.getCoverageByGroup();
  }

  @Get("report")
  async getReport(
    @Query("period") period?: "weekly" | "monthly",
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    const range = resolveRange(period, from, to);
    return this.interactionService.getUsageReport(range.from, range.to);
  }

  @Get("report/pdf")
  async getReportPdf(
    @Res() res: any,
    @Query("period") period?: "weekly" | "monthly",
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    const range = resolveRange(period, from, to);
    const pdfBuffer = await this.interactionService.getUsageReportPdf(range.from, range.to);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=icd-usage-${range.from}-to-${range.to}.pdf`);
    res.send(pdfBuffer);
  }


  @Get("report/snapshots")
  async getSnapshots(@Query("period") period?: "weekly" | "monthly") {
    return this.interactionService.getReportSnapshots(period);
  }

  @Get("report/snapshots/pdf")
  async downloadSnapshotPdf(
    @Res() res: any,
    @Query("key") key?: string
  ) {
    const snapshot = await this.interactionService.getReportSnapshotByKey(key || "");
    if (!snapshot) {
      res.status(404).send({ message: "Snapshot not found" });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${snapshot.key.replace(/:/g, "-")}.pdf`);
    res.send(Buffer.from(snapshot.pdfBase64, "base64"));
  }


  @Get("report/scheduler-status")
  getSchedulerStatus() {
    return this.cronService.getStatus();
  }

  @Get("feedback")
  async getPeerFeedback(
    @Query("icdCode") icdCode: string,
    @Query("targetName") targetName: string
  ) {
    return this.interactionService.getRecentFeedback(icdCode, targetName);
  }

  @Get("feedback/summary")
  async getFeedbackSummary() {
    return this.interactionService.getFeedbackSummary();
  }

  @Post("dismissal")
  async trackDismissal(@Body() payload: any) {
    return this.interactionService.saveDismissal(payload);
  }
}
