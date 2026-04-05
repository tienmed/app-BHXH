# Google Apps Script Integration

Files in this folder provide a pilot-friendly API layer over Google Sheets.

## What It Does

- exposes workbook template metadata
- returns pilot context
- returns a recommendation preview payload shaped for the current web app
- prioritizes `ICD -> CLS` and `ICD -> medication` mappings before falling back to protocol items

## Project Files

- `Code.gs`: main web app logic
- `appsscript.json`: Apps Script manifest for real deployment

## Expected Setup

- create a Google Sheet workbook
- create a Google Apps Script project
- copy `Code.gs` into the script editor
- add the contents of `appsscript.json` to the manifest editor
- update the workbook id and tab names if needed
- deploy as a web app

## Recommended Deployment

You can deploy manually in the Apps Script UI, or use `clasp`:

1. `npm install -g @google/clasp`
2. `clasp login`
3. `clasp create --type standalone --title "App BHXH Pilot API"`
4. copy `Code.gs` and `appsscript.json` into that project
5. `clasp push`
6. deploy as Web App in Apps Script

The frontend should call the app's internal API route, not Apps Script directly, to avoid browser CORS issues.

## Expected Query Patterns

- `GET .../exec?action=template`
- `GET .../exec?action=pilot-context`
- `POST .../exec` with body:

```json
{
  "action": "recommendations-preview",
  "encounterCode": "OP-IM-0001",
  "diagnoses": [
    { "icd": "I10" },
    { "icd": "E11.9" }
  ]
}
```
