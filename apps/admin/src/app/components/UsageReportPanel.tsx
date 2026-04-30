"use client";

import { useEffect, useMemo, useState } from "react";

type SchedulerStatus = {
  enabled: boolean;
  timezone: string;
  lastRunAt: string | null;
};

type Snapshot = {
  key: string;
  period: "weekly" | "monthly";
  rangeFrom: string;
  rangeTo: string;
  timezone: string;
  createdAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export function UsageReportPanel() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduler, setScheduler] = useState<SchedulerStatus | null>(null);

  useEffect(() => {
    async function run() {
      setLoading(true);
      try {
        const [snapshotRes, schedulerRes] = await Promise.all([
          fetch(`${API_BASE}/interactions/report/snapshots?period=${period}`),
          fetch(`${API_BASE}/interactions/report/scheduler-status`)
        ]);
        const data = await snapshotRes.json();
        const schedulerData = await schedulerRes.json();
        setSnapshots(Array.isArray(data) ? data : []);
        setScheduler(schedulerData || null);
      } catch {
        setSnapshots([]);
        setScheduler(null);
      } finally {
        setLoading(false);
      }
    }
    void run();
  }, [period]);

  const visibleSnapshots = useMemo(() => snapshots.slice(0, 3), [snapshots]);

  const triggerReport = async () => {
    await fetch(`${API_BASE}/interactions/report?period=${period}`);
    const res = await fetch(`${API_BASE}/interactions/report/snapshots?period=${period}`);
    setSnapshots(await res.json());
  };

  return (
    <section className="surface usagePanelCompact">
      <h3>Báo cáo sử dụng định kỳ</h3>
      {scheduler ? (
        <p className="usageMeta">
          Scheduler: <strong>{scheduler.enabled ? "Bật" : "Tắt"}</strong> · TZ: {scheduler.timezone} · Chạy gần nhất: {scheduler.lastRunAt ? new Date(scheduler.lastRunAt).toLocaleString("vi-VN") : "chưa có"}
        </p>
      ) : null}
      <div className="feedbackToolbar" style={{ marginBottom: 8 }}>
        <button className={period === "weekly" ? "isActive" : ""} type="button" onClick={() => setPeriod("weekly")}>Tuần</button>
        <button className={period === "monthly" ? "isActive" : ""} type="button" onClick={() => setPeriod("monthly")}>Tháng</button>
        <button type="button" onClick={() => void triggerReport()}>Làm mới ngay</button>
      </div>
      {loading ? <p>Đang tải...</p> : null}
      <div className="tableScroll">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Kỳ</th>
              <th style={{ textAlign: "left" }}>Khoảng ngày</th>
              <th style={{ textAlign: "left" }}>Tạo lúc</th>
              <th style={{ textAlign: "left" }}>PDF</th>
            </tr>
          </thead>
          <tbody>
            {visibleSnapshots.map((row) => (
              <tr key={row.key}>
                <td>{row.period}</td>
                <td>{row.rangeFrom} → {row.rangeTo}</td>
                <td>{new Date(row.createdAt).toLocaleString("vi-VN")}</td>
                <td>
                  <a href={`${API_BASE}/interactions/report/snapshots/pdf?key=${encodeURIComponent(row.key)}`} target="_blank" rel="noreferrer">
                    Tải PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
