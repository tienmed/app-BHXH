export const protocolVersions = [
    {
        name: "Nội khoa ngoại trú - tăng huyết áp / đái tháo đường",
        version: "MOH-SEED-2026.01",
        status: "Đang dùng làm seed",
        note: "Khởi tạo từ khuyến nghị Bộ Y tế, chờ đối chiếu danh mục phòng khám."
    },
    {
        name: "Hàng chờ điều chỉnh riêng",
        version: "CLINIC-DRAFT-0",
        status: "Dự kiến",
        note: "Dùng cho giai đoạn bổ sung quy tắc riêng khi pilot đã có feedback thật."
    }
];

export const ruleSets = [
    {
        id: "claim-basic",
        name: "Rule set xuất toán cơ bản",
        coverage: "ICD + CLS + thuốc",
        state: "Nền tảng thiết kế",
        note: "Mục tiêu là cảnh báo trước, không khóa luồng thao tác bác sĩ."
    },
    {
        id: "repeat-frequency",
        name: "Tần suất chỉ định lặp lại",
        coverage: "Xét nghiệm lặp trong khoảng ngắn",
        state: "Ưu tiên cao",
        note: "Nhóm quy tắc dự kiến mang lại hiệu quả pilot sớm."
    },
    {
        id: "medication-mapping",
        name: "Mapping danh mục thuốc",
        coverage: "Thuốc khuyến nghị vs thuốc được phép",
        state: "Cần bổ sung dữ liệu",
        note: "Cần danh mục thuốc thực tế của phòng khám để hoàn tất."
    }
];

export const metrics = [
    { label: "Mức sẵn sàng của protocol seed", value: "68%" },
    { label: "Độ đầy đủ của phần giải thích rule", value: "52%" },
    { label: "Độ phủ mapping danh mục", value: "31%" },
    { label: "Độ rõ của governance pilot", value: "80%" }
];

export const previewTabs = [
    "catalog_icd",
    "catalog_cls",
    "catalog_medication",
    "protocol_header",
    "protocol_item",
    "rule_cost_composition",
    "mapping_icd_cls",
    "mapping_icd_medication",
    "rule_claim_risk"
];

export const tabGroups = [
    {
        label: "Danh mục",
        tabs: ["catalog_icd", "catalog_cls", "catalog_medication"]
    },
    {
        label: "Mapping",
        tabs: ["mapping_icd_cls", "mapping_icd_medication"]
    },
    {
        label: "Quy tắc",
        tabs: ["rule_claim_risk"]
    }
];

export const tabLabels: Record<string, string> = {
    catalog_icd: "Danh mục ICD",
    catalog_cls: "Danh mục cận lâm sàng",
    catalog_medication: "Danh mục thuốc",
    mapping_icd_cls: "Mapping ICD -> CLS",
    mapping_icd_medication: "Mapping ICD -> thuốc",
    rule_claim_risk: "Rule cảnh báo xuất toán"
};
