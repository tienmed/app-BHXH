export const googleSheetsWorkbookTemplate = {
  workbookName: "App BHXH Pilot Knowledge Base",
  runtimePolicy: {
    sourceOfTruth: "google-sheets-authoring",
    runtimeDatabase: "postgresql",
    runtimeDirectReadAllowed: false
  },
  tabs: [
    {
      name: "catalog_icd",
      requiredColumns: [
        "icd_code",
        "icd_name",
        "chapter",
        "is_active",
        "effective_from",
        "effective_to",
        "source_ref"
      ]
    },
    {
      name: "catalog_cls",
      requiredColumns: [
        "cls_code",
        "cls_name",
        "cls_group",
        "unit",
        "default_frequency",
        "is_active",
        "source_ref"
      ]
    },
    {
      name: "catalog_medication",
      requiredColumns: [
        "drug_code",
        "drug_name",
        "drug_group",
        "route",
        "strength",
        "is_bhyt_covered",
        "is_active",
        "source_ref"
      ]
    },
    {
      name: "protocol_header",
      requiredColumns: [
        "protocol_code",
        "protocol_name",
        "specialty_code",
        "care_setting",
        "source_type",
        "source_version",
        "effective_from",
        "effective_to",
        "status",
        "owner_name"
      ]
    },
    {
      name: "protocol_item",
      requiredColumns: [
        "protocol_code",
        "item_type",
        "item_code",
        "item_name",
        "recommendation_level",
        "condition_note",
        "rationale",
        "sort_order",
        "is_required"
      ]
    },
    {
      name: "rule_claim_risk",
      requiredColumns: [
        "rule_code",
        "rule_name",
        "severity",
        "applies_to_icd",
        "applies_to_cls",
        "applies_to_drug",
        "condition_expression",
        "warning_message",
        "recommended_action",
        "source_version",
        "is_active"
      ]
    },
    {
      name: "rule_cost_composition",
      requiredColumns: [
        "rule_code",
        "scope_type",
        "scope_code",
        "icd_ratio_min",
        "icd_ratio_max",
        "cls_ratio_min",
        "cls_ratio_max",
        "drug_ratio_min",
        "drug_ratio_max",
        "warning_message",
        "is_active"
      ]
    },
    {
      name: "mapping_icd_cls",
      requiredColumns: [
        "icd_code",
        "cls_code",
        "mapping_type",
        "priority",
        "source_version",
        "note"
      ]
    },
    {
      name: "mapping_icd_medication",
      requiredColumns: [
        "icd_code",
        "drug_code",
        "mapping_type",
        "priority",
        "source_version",
        "note"
      ]
    },
    {
      name: "import_control",
      requiredColumns: [
        "dataset_name",
        "dataset_version",
        "approved_by",
        "approved_at",
        "import_enabled",
        "note"
      ]
    }
  ]
} as const;
