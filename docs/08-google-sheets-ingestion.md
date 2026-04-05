# Google Sheets Ingestion Design

## Direction

Use Google Sheets as the pilot-era knowledge authoring layer, not as the runtime database.

Operational model:

- Google Sheets stores editable source data for catalogs, protocols, mappings, and reimbursement rules.
- API import jobs read Google Sheets and normalize them.
- PostgreSQL stores the operational, versioned, queryable data used by the app.

## Why This Direction Fits The Pilot

- clinical and reimbursement teams can edit data without touching code
- onboarding is faster than building a full rule editor first
- import validation can catch structural problems before data reaches the doctor workflow
- PostgreSQL remains the reliable store for audit, versioning, and analytics

## Workbook Structure

Recommended workbook name:

- `App BHXH Pilot Knowledge Base`

Recommended tabs:

1. `catalog_icd`
2. `catalog_cls`
3. `catalog_medication`
4. `protocol_header`
5. `protocol_item`
6. `rule_claim_risk`
7. `rule_cost_composition`
8. `mapping_icd_cls`
9. `mapping_icd_medication`
10. `import_control`

## Sheet Definitions

### `catalog_icd`

Purpose:

- master ICD list used by diagnosis selection and rule matching

Columns:

- `icd_code`
- `icd_name`
- `chapter`
- `is_active`
- `effective_from`
- `effective_to`
- `source_ref`

### `catalog_cls`

Purpose:

- master list of paraclinical services and tests

Columns:

- `cls_code`
- `cls_name`
- `cls_group`
- `unit`
- `default_frequency`
- `is_active`
- `source_ref`

### `catalog_medication`

Purpose:

- medication master and formulary-safe metadata

Columns:

- `drug_code`
- `drug_name`
- `drug_group`
- `route`
- `strength`
- `is_bhyt_covered`
- `is_active`
- `source_ref`

### `protocol_header`

Purpose:

- protocol-level metadata and version ownership

Columns:

- `protocol_code`
- `protocol_name`
- `specialty_code`
- `care_setting`
- `source_type`
- `source_version`
- `effective_from`
- `effective_to`
- `status`
- `owner_name`

### `protocol_item`

Purpose:

- recommendation items attached to a protocol version

Columns:

- `protocol_code`
- `item_type`
- `item_code`
- `item_name`
- `recommendation_level`
- `condition_note`
- `rationale`
- `sort_order`
- `is_required`

### `rule_claim_risk`

Purpose:

- denial-risk and query-risk rules

Columns:

- `rule_code`
- `rule_name`
- `severity`
- `applies_to_icd`
- `applies_to_cls`
- `applies_to_drug`
- `condition_expression`
- `warning_message`
- `recommended_action`
- `source_version`
- `is_active`

### `rule_cost_composition`

Purpose:

- cost distribution or threshold rules by diagnosis group or protocol

Columns:

- `rule_code`
- `scope_type`
- `scope_code`
- `icd_ratio_min`
- `icd_ratio_max`
- `cls_ratio_min`
- `cls_ratio_max`
- `drug_ratio_min`
- `drug_ratio_max`
- `warning_message`
- `is_active`

### `mapping_icd_cls`

Purpose:

- allowed or recommended CLS by ICD

Columns:

- `icd_code`
- `cls_code`
- `mapping_type`
- `priority`
- `source_version`
- `note`

### `mapping_icd_medication`

Purpose:

- allowed or recommended medication groups by ICD

Columns:

- `icd_code`
- `drug_code`
- `mapping_type`
- `priority`
- `source_version`
- `note`

### `import_control`

Purpose:

- import metadata and validation checkpoints

Columns:

- `dataset_name`
- `dataset_version`
- `approved_by`
- `approved_at`
- `import_enabled`
- `note`

## Import Rules

- each row must have a stable business key
- blank or malformed keys should fail validation
- runtime app must never read directly from Sheets
- imported datasets must be stamped with source workbook id, tab name, and import timestamp
- protocol rules and reimbursement rules must be imported into separate tables

## Import Lifecycle

1. Clinical or operations team updates the workbook.
2. Import preview validates required columns and row-level issues.
3. Approved import creates a new dataset version in PostgreSQL.
4. Runtime services switch to the approved version.
5. Audit log stores who imported what and when.
