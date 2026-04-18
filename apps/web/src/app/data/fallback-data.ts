import type { DiagnosisOption, SuggestedItem, AlertItem, RecommendationState } from "../types";

export const defaultDiagnosisOptions: DiagnosisOption[] = [
    { code: "I10", label: "Tăng huyết áp nguyên phát" },
    { code: "E11.9", label: "Đái tháo đường típ 2 không biến chứng" },
    { code: "E78.5", label: "Rối loạn lipid máu" },
    { code: "L02", label: "Áp xe da, nhọt, hậu bối" },
    { code: "L70", label: "Mụn trứng cá" },
    { code: "K02.1", label: "Sâu ngà răng" },
    { code: "K02.5", label: "Sâu răng có tủy tổn thương" }
];

export const localInvestigations: Record<string, SuggestedItem[]> = {
    I10: [
        { code: "CLS-CBC", name: "Công thức máu", rationale: "Đánh giá nền trước điều trị và theo dõi ngoại trú." },
        { code: "CLS-CREA", name: "Creatinine huyết thanh", rationale: "Theo dõi chức năng thận khi điều trị tăng huyết áp." }
    ],
    "E11.9": [
        { code: "CLS-GLU", name: "Đường huyết", rationale: "Theo dõi mức kiểm soát đường huyết tại thời điểm khám." },
        { code: "CLS-HBA1C", name: "HbA1c", rationale: "Đánh giá kiểm soát đường huyết dài hạn." }
    ],
    L02: [
        { code: "CLS-CBC", name: "Công thức máu", rationale: "Cân nhắc khi có dấu hiệu nhiễm trùng mức độ vừa hoặc nặng." },
        { code: "CLS-GLU", name: "Đường huyết", rationale: "Cân nhắc khi nghi đái tháo đường hoặc vết thương lâu lành." }
    ],
    L70: [{ code: "CLS-NONE", name: "Không cần cận lâm sàng thường quy", rationale: "Ưu tiên đánh giá lâm sàng, chỉ mở rộng khi nghi nguyên nhân nội tiết hoặc trước điều trị toàn thân." }],
    "K02.1": [
        { code: "CLS-XRAY-DENT", name: "Chụp X-quang răng", rationale: "Mục đích: Xác định độ sâu của lỗ sâu. Khi nào chỉ định: Cần phân biệt với tổn thương tủy hoặc khám lần đầu. Lặp lại: Không cần lặp lại trừ khi nghi ngờ sâu tái phát." }
    ],
    "K02.5": [
        { code: "CLS-XRAY-DENT", name: "Chụp X-quang răng", rationale: "Mục đích: Đánh giá mức độ tổn thương tủy và quanh chóp. Khi nào chỉ định: Khám lần đầu hoặc khi đau nhức nhiều. Lặp lại: Lặp lại sau điều trị tủy hoặc khi có triệu chứng đau trở lại." }
    ]
};

export const localMedications: Record<string, SuggestedItem[]> = {
    I10: [
        { code: "MED-RAAS", name: "Nhóm ƯCMC/ƯCTT", rationale: "Thường là lựa chọn nền nếu phù hợp lâm sàng." },
        { code: "MED-CCB", name: "Chẹn kênh canxi", rationale: "Có thể cân nhắc phối hợp khi chưa đạt mục tiêu huyết áp." }
    ],
    "E11.9": [
        { code: "MED-METFORMIN", name: "Metformin", rationale: "Là lựa chọn nền thường dùng nếu không có chống chỉ định." }
    ],
    L02: [
        { code: "MED-ANTIBIOTIC", name: "Kháng sinh phù hợp lâm sàng", rationale: "Chỉ cân nhắc khi có dấu hiệu lan rộng hoặc toàn thân." },
        { code: "MED-PAINKILLER", name: "Giảm đau / chăm sóc tại chỗ", rationale: "Ưu tiên theo mức độ tổn thương và xử trí ổ mủ." }
    ],
    L70: [
        { code: "MED-BPO", name: "Benzoyl peroxide", rationale: "Ưu tiên cho mụn mức độ nhẹ đến trung bình." },
        { code: "MED-RETINOID", name: "Retinoid bôi", rationale: "Cân nhắc khi cần kiểm soát nhân mụn và viêm." }
    ],
    "K02.1": [
        { code: "MED-FLUORIDE", name: "Fluoride bôi tại chỗ", rationale: "Mục đích: Tăng cường khoáng hóa, bảo vệ men/ngà răng. Tác dụng phụ: Rất hiếm gặp ở liều tại chỗ. Tương tác: Ít tương tác." },
        { code: "MED-PARA", name: "Paracetamol", rationale: "Mục đích: Giảm ê buốt. Tác dụng phụ: Hại gan nếu quá liều. Tương tác: Thận trọng khi dùng cùng các thuốc qua gan." }
    ],
    "K02.5": [
        { code: "MED-AMOX", name: "Amoxicillin", rationale: "Mục đích: Dự phòng/điều trị viêm nhiễm tủy răng. Tác dụng phụ: Rối loạn tiêu hóa, dị ứng. Tương tác: Giảm tác dụng thuốc tránh thai đường uống." },
        { code: "MED-IBU", name: "Ibuprofen", rationale: "Mục đích: Giảm đau do viêm. Tác dụng phụ: Viêm loét dạ dày. Tương tác: Tránh dùng chung nhóm NSAIDs khác, nguy cơ xuất huyết tiêu hóa." }
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
    ],
    "K02.5": [
        {
            severity: "medium",
            title: "Kiểm tra tương tác thuốc NSAIDs",
            description: "Bệnh nhân có tiền sử dạ dày nên thận trọng hoặc đổi sang giảm đau khác nếu chỉ định Ibuprofen."
        }
    ]
};

export const emptyState: RecommendationState = {
    diagnoses: [],
    investigations: [],
    medications: [],
    alerts: []
};
