"use client";

import { useState } from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    context: any;
};

export const PatientGuideModal = ({ open, onClose, context }: Props) => {
    const [guide, setGuide] = useState("");
    const [loading, setLoading] = useState(false);

    const generateGuide = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/ai/patient-guide", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    diagnoses: context.diagnoses.map((d: any) => d.label),
                    medications: context.medications.map((m: any) => m.name),
                    cls: context.investigations.map((i: any) => i.name)
                })
            });
            const data = await res.json();
            setGuide(data.guide);
        } catch (error) {
            setGuide("Không thể tạo hướng dẫn lúc này.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "20px"
        }}>
            <div style={{
                background: "white",
                width: "100%",
                maxWidth: "600px",
                borderRadius: "16px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                maxHeight: "90vh"
            }}>
                <header style={{ padding: "16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
                    <strong>Hướng dẫn cho Bệnh nhân (AI Generated)</strong>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>✕</button>
                </header>
                
                <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
                    {!guide && !loading && (
                        <div style={{ textAlign: "center" }}>
                            <p>Hệ thống sẽ tổng hợp chẩn đoán và đơn thuốc thành hướng dẫn dễ hiểu cho bệnh nhân.</p>
                            <button 
                                onClick={generateGuide}
                                style={{ 
                                    marginTop: "16px",
                                    padding: "12px 24px", 
                                    background: "#4338ca", 
                                    color: "white", 
                                    border: "none", 
                                    borderRadius: "8px",
                                    cursor: "pointer"
                                }}
                            >
                                ✨ Bắt đầu soạn hướng dẫn
                            </button>
                        </div>
                    )}
                    {loading && <p style={{ textAlign: "center" }}>AI đang soạn thảo, vui lòng đợi...</p>}
                    {guide && (
                        <div style={{ whiteSpace: "pre-line", fontSize: "1rem", lineHeight: "1.6", color: "#1e293b" }}>
                            {guide}
                        </div>
                    )}
                </div>

                <footer style={{ padding: "16px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    {guide && (
                        <button 
                            onClick={() => window.print()}
                            style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer" }}
                        >
                            🖨️ In hướng dẫn
                        </button>
                    )}
                    <button 
                        onClick={onClose}
                        style={{ padding: "8px 16px", background: "#4338ca", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
                    >
                        Đóng
                    </button>
                </footer>
            </div>
        </div>
    );
};
