# PostgreSQL Schema Plan

## Goal

Store imported Sheets data in normalized, versioned operational tables that support:

- fast doctor-facing lookups
- deterministic rule evaluation
- audit and rollback
- future protocol customization by clinic

## Core Table Groups

### Catalog Tables

- `catalog_icd`
- `catalog_cls`
- `catalog_medication`

### Protocol Tables

- `protocol_set`
- `protocol_version`
- `protocol_item`

### Reimbursement Tables

- `claim_risk_rule_set`
- `claim_risk_rule`
- `cost_composition_rule_set`
- `cost_composition_rule`

### Mapping Tables

- `icd_cls_mapping`
- `icd_medication_mapping`

### Import Governance Tables

- `import_job`
- `import_dataset`
- `import_issue`

### Runtime Tables

- `patient`
- `encounter`
- `diagnosis`
- `ordered_item`
- `recommendation_run`
- `alert`
- `override`
- `audit_event`

## Versioning Strategy

- every import creates a new `import_dataset`
- each protocol/rule set links to the imported dataset version
- only one dataset version per scope can be marked `approved_for_runtime`
- old versions remain queryable for audit

## Minimal Columns By Table

### `import_dataset`

- `id`
- `dataset_type`
- `dataset_version`
- `source_workbook_id`
- `source_tab_name`
- `imported_at`
- `imported_by`
- `approval_status`

### `protocol_version`

- `id`
- `protocol_set_id`
- `dataset_id`
- `source_version`
- `care_setting`
- `specialty_code`
- `effective_from`
- `effective_to`
- `status`

### `claim_risk_rule`

- `id`
- `rule_set_id`
- `dataset_id`
- `severity`
- `condition_expression`
- `warning_message`
- `recommended_action`
- `status`

## Runtime Query Principle

The recommendation engine should query:

- approved protocol versions
- approved reimbursement rule versions
- approved mappings

It should never query Google Sheets directly.
