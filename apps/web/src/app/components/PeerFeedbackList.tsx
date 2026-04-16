import { useEffect, useState } from "react";

type PeerNote = {
    note: string;
    doctorId: string;
    createdAt: string;
    feedbackType: string;
};

export function PeerFeedbackList({ icdCode, targetName }: { icdCode: string; targetName: string }) {
    const [notes, setNotes] = useState<PeerNote[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchNotes() {
            if (!icdCode || !targetName) return;
            setLoading(true);
            try {
                const res = await fetch(`/api/recommendations/peer-feedback?icdCode=${icdCode}&targetName=${encodeURIComponent(targetName)}`);
                const data = await res.json();
                if (Array.isArray(data)) setNotes(data);
            } catch (e) {
                console.error("Failed to fetch peer notes", e);
            } finally {
                setLoading(false);
            }
        }
        void fetchNotes();
    }, [icdCode, targetName]);

    if (loading || notes.length === 0) return null;

    return (
        <div className="peerNotesSection">
            <span className="peerNotesTitle">💡 Ghi chú từ đồng nghiệp ({notes.length})</span>
            <div className="peerNotesList">
                {notes.map((note, idx) => (
                    <div key={idx} className="peerNoteItem">
                        <p>"{note.note}"</p>
                        <span className="peerNoteMeta">
                            BS. {note.doctorId.substring(0, 6)} — {new Date(note.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
