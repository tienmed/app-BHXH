"use client";

import { useEffect, useState } from "react";

type OverviewState = {
  pendingFeedback: number;
  approvedFeedback: number;
  rejectedFeedback: number;
  weeklyReports: number;
  monthlyReports: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

async function countFeedback(status: string): Promise<number> {
  const res = await fetch(`/api/google-sheets/doctor-feedback?status=${status}&limit=200`, { cache: "no-store" });
  if (!res.ok) return 0;
  const payload = await res.json();
  if (Array.isArray(payload)) return payload.length;
  if (Array.isArray(payload?.rows)) return payload.rows.length;
  return 0;
}

async function countSnapshots(period: "weekly" | "monthly"): Promise<number> {
  const res = await fetch(`${API_BASE}/interactions/report/snapshots?period=${period}`, { cache: "no-store" });
  if (!res.ok) return 0;
  const payload = await res.json();
  return Array.isArray(payload) ? payload.length : 0;
}

export function OperationsOverview() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewState>({
    pendingFeedback: 0,
    approvedFeedback: 0,
    rejectedFeedback: 0,
    weeklyReports: 0,
    monthlyReports: 0
  });

  useEffect(() => {
    async function run() {
      setLoading(true);
      const [pendingFeedback, approvedFeedback, rejectedFeedback, weeklyReports, monthlyReports] = await Promise.all([
        countFeedback("pending"),
        countFeedback("approved"),
        countFeedback("rejected"),
        countSnapshots("weekly"),
        countSnapshots("monthly")
      ]);
      setOverview({ pendingFeedback, approvedFeedback, rejectedFeedback, weeklyReports, monthlyReports });
      setLoading(false);
    }
    void run();
  }, []);

  return (
    <section className="surface" style={{ marginTop: 20 }}>
      <div className="surfaceHeader">
        <span className="eyebrow">OPERATIONS METRICS</span>
        <h2>Tổng quan điều hành</h2>
      </div>
      {loading ? <p>Đang tải chỉ số vận hành...</p> : null}
      <div className="opsMetricsGrid">
        <div className="opsMetricCard"><strong>{overview.pendingFeedback}</strong><p>Feedback chờ duyệt</p></div>
        <div className="opsMetricCard"><strong>{overview.approvedFeedback}</strong><p>Feedback đã duyệt</p></div>
        <div className="opsMetricCard"><strong>{overview.rejectedFeedback}</strong><p>Feedback từ chối</p></div>
        <div className="opsMetricCard"><strong>{overview.weeklyReports}</strong><p>Báo cáo tuần</p></div>
        <div className="opsMetricCard"><strong>{overview.monthlyReports}</strong><p>Báo cáo tháng</p></div>
      </div>
    </section>
  );
}
