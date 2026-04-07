"use client";

import type { LoadingState } from "../types";

interface AdminSidebarProps {
    status: string;
}

export function AdminSidebar({ status }: AdminSidebarProps) {
    return (
        <aside className="adminRail">
            <div className="brand fade-1">
                <span className="eyebrow">Hệ thống quản trị</span>
                <h1>CDS Dashboard Admin</h1>
                <p>Quản trị Tri thức &amp; Giao thức BHYT (Google Sheets centric)</p>
            </div>

            <nav className="navCluster">
                <div className="navItem" onClick={() => void window.scrollTo({ top: 0, behavior: "smooth" })}>
                    <strong>Bảng điều khiển</strong>
                    <span>Dashboard Home</span>
                </div>
                <div
                    className="navItem"
                    onClick={() => document.querySelector(".configuredIcdList")?.scrollIntoView({ behavior: "smooth" })}
                >
                    <strong>Tra cứu ICD</strong>
                    <span>Search &amp; Edit</span>
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
