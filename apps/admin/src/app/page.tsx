"use client";

import { AdminSidebar } from "./components/AdminSidebar";
import { HeroHeader } from "./components/HeroHeader";
import { UsageReportPanel } from "./components/UsageReportPanel";
import { FeedbackModerationPanel } from "./components/FeedbackModerationPanel";
import { OperationsOverview } from "./components/OperationsOverview";

export default function AdminHome() {
  return (
    <div className="adminShell">
      <AdminSidebar status="Admin vận hành: theo dõi hoạt động bác sĩ + duyệt feedback" />

      <main className="adminContent fade-up">
        <HeroHeader />
        <OperationsOverview />
        <FeedbackModerationPanel />
        <UsageReportPanel />
      </main>
    </div>
  );
}
