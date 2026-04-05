# Google Sheet Seed Guide

## Goal

Provide a ready-to-import starter dataset for the outpatient internal medicine pilot.

## Source Folder

- `seeds/google-sheets-pilot/`

## Tabs To Create

Create one Google Sheet workbook and add these tabs:

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

## Import Steps

1. Open Google Sheets.
2. Create a workbook named `App BHXH Pilot Knowledge Base`.
3. For each CSV in `seeds/google-sheets-pilot/`, import it into a tab with the same name.
4. Check that the header row remains on row 1.
5. Open Apps Script and paste `integrations/google-apps-script/Code.gs`.
6. Deploy the script as a Web App.

## Validation Quick Check

After import:

- `protocol_item` must contain both `cls` and `medication` rows
- `rule_claim_risk` must contain at least one `high` severity rule
- `rule_cost_composition` must contain one active rule for `IM-OP-HTN-DM-2026`
- `import_control` must have `import_enabled = TRUE`

## Expected Demo Output

With the included seed:

- the doctor UI should show CLS and medication suggestions for hypertension and diabetes
- the warning panel should show claim-risk alerts
- the cost composition panel should render using the pilot threshold values
