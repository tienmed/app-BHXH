"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type FeedbackStatus = "pending" | "approved" | "rejected";

type FeedbackRow = {
  id?: string;
  icdCode?: string;
  diagnosisCode?: string;
  note?: string;
  feedback?: string;
  status?: FeedbackStatus;
  createdAt?: string;
  updatedAt?: string;
};

type FeedbackPayload = FeedbackRow[] | { rows?: FeedbackRow[] };

function normalizeRows(payload: FeedbackPayload): FeedbackRow[] {
  return Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : [];
}

function normalizeStatus(value?: string): FeedbackStatus {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

export function FeedbackModerationPanel() {
  const [status, setStatus] = useState<"all" | FeedbackStatus>("pending");
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => rows.filter((row) => normalizeStatus(row.status) === "pending").length,
    [rows]
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = status === "all" ? "" : `?status=${status}`;
      const response = await fetch(`/api/google-sheets/doctor-feedback${query}`, { cache: "no-store" });
      const payload = (await response.json()) as FeedbackPayload & { message?: string };
      if (!response.ok) {
        throw new Error(payload?.message || "Không tải được feedback.");
      }
      setRows(normalizeRows(payload));
    } catch (loadError) {
      setRows([]);
      setError(loadError instanceof Error ? loadError.message : "Lỗi chưa xác định");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const resolveFeedback = async (row: FeedbackRow, action: Exclude<FeedbackStatus, "pending">) => {
    if (!row.id) {
      setError("Feedback không có định danh để xử lý.");
      return;
    }

    setSubmittingId(row.id);
    setError(null);
    const reason = action === "rejected" ? "Từ chối bởi quản trị viên" : "";
    try {
      const response = await fetch("/api/google-sheets/doctor-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, status: action, reason })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload?.message || "Không cập nhật được feedback");
      }

      await loadRows();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không cập nhật được feedback");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <section id="feedback-moderation" className="surface" style={{ marginTop: 20 }}>
      <div className="surfaceHeader">
        <span className="eyebrow">FEEDBACK MODERATION</span>
        <h2>Duyệt / Từ chối phản hồi từ web bác sĩ</h2>
      </div>
      <p>
        Tồn đọng cần xử lý: <strong>{pendingCount}</strong>
      </p>
      <div className="feedbackToolbar">
        <button className={status === "pending" ? "isActive" : ""} type="button" onClick={() => setStatus("pending")}>Chờ duyệt</button>
        <button className={status === "approved" ? "isActive" : ""} type="button" onClick={() => setStatus("approved")}>Đã duyệt</button>
        <button className={status === "rejected" ? "isActive" : ""} type="button" onClick={() => setStatus("rejected")}>Đã từ chối</button>
        <button className={status === "all" ? "isActive" : ""} type="button" onClick={() => setStatus("all")}>Tất cả</button>
        <button type="button" onClick={() => void loadRows()}>Làm mới</button>
      </div>
      {loading ? <p>Đang tải dữ liệu feedback...</p> : null}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {!loading && rows.length === 0 ? <p>Chưa có feedback trong bộ lọc hiện tại.</p> : null}

      <div className="tableScroll"><table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>ICD</th>
            <th style={{ textAlign: "left" }}>Nội dung</th>
            <th style={{ textAlign: "left" }}>Trạng thái</th>
            <th style={{ textAlign: "left" }}>Thời gian</th>
            <th style={{ textAlign: "left" }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rowStatus = normalizeStatus(row.status);
            const rowKey = row.id || `${row.diagnosisCode || row.icdCode || "feedback"}-${index}`;
            const disableActions = rowStatus !== "pending" || !row.id || submittingId === row.id;

            return (
              <tr key={rowKey}>
                <td>{row.icdCode || row.diagnosisCode || "-"}</td>
                <td>{row.note || row.feedback || "-"}</td>
                <td>{rowStatus}</td>
                <td>{row.createdAt ? new Date(row.createdAt).toLocaleString("vi-VN") : "-"}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" disabled={disableActions} onClick={() => void resolveFeedback(row, "approved")}>Duyệt</button>
                    <button type="button" disabled={disableActions} onClick={() => void resolveFeedback(row, "rejected")}>Từ chối</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
    </section>
  );
}
