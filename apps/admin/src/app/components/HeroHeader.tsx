"use client";

export function HeroHeader() {
  return (
    <header className="hero">
      <div className="heroContent">
        <span className="eyebrow">OPERATIONS</span>
        <h2>Admin chỉ theo dõi hoạt động bác sĩ, feedback và metrics</h2>
        <p style={{ marginTop: 8, color: "#4b5563" }}>
          Luồng tạo ICD mới đã được tách khỏi Admin web để đảm bảo quản trị tập trung theo mục tiêu vận hành.
        </p>
      </div>
    </header>
  );
}
