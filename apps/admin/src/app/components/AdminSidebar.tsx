"use client";

interface AdminSidebarProps {
  status: string;
}

export function AdminSidebar({ status }: AdminSidebarProps) {
  return (
    <aside className="adminRail">
      <div className="brand fade-1">
        <span className="eyebrow">Hệ thống quản trị</span>
        <h1>CDS Dashboard Admin</h1>
        <p>Theo dõi hoạt động web bác sĩ &amp; điều phối feedback</p>
      </div>

      <nav className="navCluster">
        <div className="navItem" onClick={() => void window.scrollTo({ top: 0, behavior: "smooth" })}>
          <strong>Bảng điều khiển</strong>
          <span>Dashboard Home</span>
        </div>
        <div
          className="navItem"
          onClick={() => document.querySelector("#feedback-moderation")?.scrollIntoView({ behavior: "smooth" })}
        >
          <strong>Feedback</strong>
          <span>Moderation Queue</span>
        </div>
      </nav>

      <section className="surface statusPanel">
        <div className="surfaceHeader">
          <span className="eyebrow">HỆ THỐNG</span>
        </div>
        <p className="statusText">{status}</p>
        <div className="systemMeta">
          <span className="tag">GAS Active</span>
          <span className="tag">Pilot v1.2</span>
        </div>
      </section>
    </aside>
  );
}
