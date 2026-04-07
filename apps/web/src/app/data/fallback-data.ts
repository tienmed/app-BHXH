import type { DiagnosisOption, SuggestedItem, AlertItem, RecommendationState } from "../types";

export const defaultDiagnosisOptions: DiagnosisOption[] = [
    { code: "I10", label: "Tăng huyết áp nguyên phát" },
    { code: "E11.9", label: "Đái tháo đường típ 2 không biến chứng" },
    { code: "E78.5", label: "Rối loạn lipid máu" },
    { code: "L02", label: "Áp xe da, nhọt, hậu bối" },
    { code: "L70", label: "Mụn trứng cá" }
];

export const localInvestigations: Record<string, SuggestedItem[]> = {
    I10: [
        { name: "Công thức máu", rationale: "Đánh giá nền trước điều trị và theo dõi ngoại trú." },
        { name: "Creatinine huyết thanh", rationale: "Theo dõi chức năng thận khi điều trị tăng huyết áp." }
    ],
    "E11.9": [
        { name: "Đường huyết", rationale: "Theo dõi mức kiểm soát đường huyết tại thời điểm khám." },
        { name: "HbA1c", rationale: "Đánh giá kiểm soát đường huyết dài hạn." }
    ],
    L02: [
        { name: "Công thức máu", rationale: "Cân nhắc khi có dấu hiệu nhiễm trùng mức độ vừa hoặc nặng." },
        { name: "Đường huyết", rationale: "Cân nhắc khi nghi đái tháo đường hoặc vết thương lâu lành." }
    ],
    L70: [{ name: "Không cần cận lâm sàng thường quy", rationale: "Ưu tiên đánh giá lâm sàng, chỉ mở rộng khi nghi nguyên nhân nội tiết hoặc trước điều trị toàn thân." }]
};

export const localMedications: Record<string, SuggestedItem[]> = {
    I10: [
        { name: "Nhóm ƯCMC/ƯCTT", rationale: "Thường là lựa chọn nền nếu phù hợp lâm sàng." },
        { name: "Chẹn kênh canxi", rationale: "Có thể cân nhắc phối hợp khi chưa đạt mục tiêu huyết áp." }
    ],
    "E11.9": [
        { name: "Metformin", rationale: "Là lựa chọn nền thường dùng nếu không có chống chỉ định." }
    ],
    L02: [
        { name: "Kháng sinh phù hợp lâm sàng", rationale: "Chỉ cân nhắc khi có dấu hiệu lan rộng hoặc toàn thân." },
        { name: "Giảm đau / chăm sóc tại chỗ", rationale: "Ưu tiên theo mức độ tổn thương và xử trí ổ mủ." }
    ],
    L70: [
        { name: "Benzoyl peroxide", rationale: "Ưu tiên cho mụn mức độ nhẹ đến trung bình." },
        { name: "Retinoid bôi", rationale: "Cân nhắc khi cần kiểm soát nhân mụn và viêm." }
    ]
};

export const localAlerts: Record<string, AlertItem[]> = {
    "E11.9": [
        {
            severity: "high",
            title: "Cân nhắc tần suất lặp HbA1c",
            description: "Không nên lặp quá sớm nếu chưa có lý do lâm sàng rõ."
        }
    ],
    L02: [
        {
            severity: "medium",
            title: "Không mở rộng chỉ định quá mức",
            description: "Áp xe da khu trú thường ưu tiên khám lâm sàng và xử trí tại chỗ trước."
        }
    ],
    L70: [
        {
            severity: "low",
            title: "Hạn chế xét nghiệm không cần thiết",
            description: "Mụn trứng cá thông thường thường không cần cận lâm sàng rộng rãi."
        }
    ]
};

export const emptyState: RecommendationState = {
    diagnoses: [],
    investigations: [],
    medications: [],
    alerts: []
};
