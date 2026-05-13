"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
    role: "user" | "assistant";
    content: string;
};

type Props = {
    context: any;
};

export const AiChat = ({ context }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    history: [...messages, userMsg],
                    context: {
                        diagnoses: context.diagnoses,
                        selectedItems: [
                            ...context.investigations.map((i: any) => i.name),
                            ...context.medications.map((m: any) => m.name)
                        ]
                    }
                })
            });
            const data = await res.json();
            setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        } catch (error) {
            setMessages((prev) => [...prev, { role: "assistant", content: "Lỗi kết nối máy chủ AI." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="aiChatWrapper" style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
            {!isOpen ? (
                <button 
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
                        color: "white",
                        border: "none",
                        boxShadow: "0 4px 15px rgba(67, 56, 202, 0.4)",
                        cursor: "pointer",
                        fontSize: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    💬
                </button>
            ) : (
                <div style={{
                    width: "350px",
                    height: "500px",
                    background: "white",
                    borderRadius: "16px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden"
                }}>
                    <header style={{ 
                        padding: "12px 16px", 
                        background: "#4338ca", 
                        color: "white", 
                        display: "flex", 
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <strong>Trợ lý Bác sĩ AI</strong>
                        <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>✕</button>
                    </header>
                    
                    <div ref={scrollRef} style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                        {messages.length === 0 && (
                            <p style={{ textAlign: "center", color: "#64748b", fontSize: "0.9rem", marginTop: "40px" }}>
                                Chào Bác sĩ, tôi có thể giúp gì cho ca bệnh này?
                            </p>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                                background: msg.role === "user" ? "#4338ca" : "#f1f5f9",
                                color: msg.role === "user" ? "white" : "#1e293b",
                                padding: "8px 12px",
                                borderRadius: "12px",
                                maxWidth: "85%",
                                fontSize: "0.9rem",
                                whiteSpace: "pre-line"
                            }}>
                                {msg.content}
                            </div>
                        ))}
                        {loading && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Đang suy nghĩ...</div>}
                    </div>

                    <footer style={{ padding: "12px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "8px" }}>
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Hỏi về ca bệnh..."
                            style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" }}
                        />
                        <button 
                            onClick={handleSend}
                            style={{ padding: "8px 16px", background: "#4338ca", color: "white", borderRadius: "8px", border: "none", cursor: "pointer" }}
                        >
                            Gửi
                        </button>
                    </footer>
                </div>
            )}
        </div>
    );
};
