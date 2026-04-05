# Import Roadmap

## Phase 1

- define Google Sheets workbook structure
- seed with one outpatient internal medicine dataset
- implement preview validation in API
- return template metadata for admin use

## Phase 2

- implement authenticated pull from Google Sheets API
- normalize and persist imported data into PostgreSQL
- store import issues and approval state

## Phase 3

- add admin UI for import preview, validation, and publish
- add diff view between dataset versions
- add rollback to prior approved dataset

## Required Input Before Live Integration

- Google Sheet workbook id
- service account or OAuth strategy
- column ownership by team
- approval flow for dataset publish
