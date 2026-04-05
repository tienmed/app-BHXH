# App BHXH Clinical Decision Support

This repository is the proposed project skeleton for a doctor-facing application that helps:

- suggest appropriate paraclinical orders, tests, and medications from recommended treatment protocols
- evaluate ICD, CLS, and medication combinations against cost composition constraints
- warn about claim denial risk before orders are finalized
- keep every suggestion explainable, versioned, and auditable

This started as a planning-first scaffold and now includes a runnable skeleton for the confirmed pilot scope.

## Proposed Product Direction

The app is positioned as a **clinical decision support + reimbursement guard** platform, not an autonomous prescribing system.

Core design principles:

1. Doctor remains the final decision maker.
2. Every recommendation must show reason, source, and version.
3. Protocol rules and reimbursement rules must be managed separately.
4. Every override must be logged for audit and later review.
5. The system should reduce denial risk without blocking justified clinical care.

## Core Capability Groups

- Encounter intake: patient, encounter, ICD primary and secondary diagnoses
- Protocol matching: recommend order sets and treatment paths by diagnosis/context
- CLS and test recommendation: suggest tests, frequency, and rationale
- Medication support: suggest formulary-safe medication groups and dosage guidance hooks
- Cost guard: estimate configured cost composition across ICD, CLS, and medications
- Claim-risk check: flag combinations likely to be denied or queried
- Explainability: show protocol source, payer rule source, and confidence level
- Override and audit: allow physician confirmation with reason
- Admin portal: manage protocols, mappings, catalogs, and rule versions

## Confirmed Pilot Scope

Confirmed on April 3, 2026:

- care setting: outpatient only
- pilot specialty: internal medicine
- product behavior: recommendation only, no autonomous order submission
- protocol source: Ministry of Health guidance first, with future clinic-level customization

## Repository Layout

```text
.
|-- README.md
|-- package.json
|-- tsconfig.base.json
|-- .gitignore
|-- docs/
|   |-- 01-product-vision.md
|   |-- 02-scope-and-mvp.md
|   |-- 03-domain-model.md
|   |-- 04-system-architecture.md
|   |-- 05-implementation-roadmap.md
|   |-- 06-epics-and-backlog.md
|   |-- 07-pilot-decisions.md
|   |-- 08-google-sheets-ingestion.md
|   |-- 09-postgresql-schema-plan.md
|   |-- 10-import-roadmap.md
|   |-- 11-google-apps-script-pilot.md
|   |-- 12-google-sheet-seed-guide.md
|   |-- 13-google-apps-script-deployment.md
|   |-- open-questions.md
|   `-- adr/
|       `-- 0001-monorepo-and-stack.md
|-- integrations/
|   `-- google-apps-script/
|       |-- Code.gs
|       `-- README.md
|-- seeds/
|   `-- google-sheets-pilot/
|       `-- *.csv
|-- apps/
|   |-- web/
|   |   `-- README.md
|   |-- api/
|   |   `-- README.md
|   `-- admin/
|       `-- README.md
|-- packages/
|   |-- domain/
|   |   `-- README.md
|   |-- decision-engine/
|   |   `-- README.md
|   |-- ui/
|   |   `-- README.md
|   |-- shared-types/
|   |   `-- README.md
|   `-- config/
|       `-- README.md
`-- infra/
    |-- db/
    |   `-- README.md
    |-- docker/
    |   `-- README.md
    `-- observability/
        `-- README.md
```

## Suggested Build Strategy

- Stage 1: confirm product scope, data sources, and operational ownership
- Stage 2: ship runnable web, admin, and api skeleton for the pilot
- Stage 3: implement protocol editor, rule versioning, and audit dashboards
- Stage 4: integrate with HIS, LIS, pharmacy, and claim export systems

## Quick Start

```bash
npm install
npm run dev:web
npm run dev:admin
npm run dev:api
```

Build all apps:

```bash
npm run build
```

Optional doctor UI config for Google Apps Script pilot:

```bash
NEXT_PUBLIC_RECOMMENDATION_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

## What Needs Confirmation Before Coding

- target deployment: internal web app, desktop wrapper, or mobile companion
- availability of ICD, CLS, medication, and protocol master data
- ownership of clinical protocol updates and BHYT rule updates
- approval workflow for doctor overrides
- integration boundary with existing HIS/EMR/BHYT processes

See the `docs/` folder for the detailed proposal.
