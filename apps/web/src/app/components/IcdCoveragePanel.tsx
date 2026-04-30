"use client";

import { useEffect, useState } from "react";

type CoverageRow = { icdGroup: string; totalIcd: number; percent: number };

type CoverageResponse = {
  totalIcd: number;
  byGroup: CoverageRow[];
  timezone: string;
};

export function IcdCoveragePanel() {
  const [data, setData] = useState<CoverageResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCoverage() {
      setLoading(true);
      try {
        const res = await fetch(`/api/icd/metrics`);
        const json = (await res.json()) as CoverageResponse;
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    void loadCoverage();
  }, []);

  return (
    <section className="doctorPanel fade-2" style={{ marginTop: 16 }}>
      <div className="doctorPanelHeader">
        <h2>Độ phủ dữ liệu ICD</h2>
        <span>{data?.timezone || "Asia/Ho_Chi_Minh"}</span>
      </div>

      {loading ? <p className="doctorStatus">Đang tải thống kê ICD...</p> : null}

      {!loading && data ? (
        <>
          <p className="doctorStatus">Tổng ICD đã có dữ liệu: <strong>{data.totalIcd}</strong></p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 8 }}>
            {data.byGroup.map((row) => (
              <div key={row.icdGroup} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
                <strong style={{ textTransform: "uppercase" }}>{row.icdGroup}</strong>
                <div>{row.totalIcd} ICD</div>
                <div style={{ color: "#666", fontSize: 13 }}>{row.percent}% tổng số ICD</div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
