# Scope And MVP

## MVP Scope

The first release should focus on one high-value workflow:

**Doctor selects diagnoses and sees protocol-aligned suggestions plus claim-risk warnings before finalizing the order set.**

Pilot confirmation:

- care setting: outpatient
- specialty: internal medicine
- action mode: suggestion only
- source baseline: Ministry of Health protocols with future clinic customization

## In Scope For MVP

- login and role-based access
- patient encounter workspace
- ICD selection and diagnosis context capture
- protocol lookup by diagnosis and patient context
- recommended CLS and test bundle suggestions
- recommended medication group suggestions
- payer-risk checks on ICD + CLS + medication combinations
- estimated cost composition view
- alert severity and explanation panel
- doctor override with mandatory reason
- audit trail for every recommendation and override
- admin CRUD for catalogs, mappings, and rule versions

## Out Of Scope For MVP

- fully automated order placement into external HIS
- advanced AI-generated differential diagnosis
- complex drug interaction engine beyond defined rule set
- inpatient scheduling and ward logistics
- billing submission automation
- multi-hospital tenanting unless required early

## Suggested MVP Screens

- Login
- Encounter dashboard
- Diagnosis and context entry
- Recommendation panel
- Cost and denial risk panel
- Final order review
- Override dialog
- Admin catalog manager
- Admin protocol/rule manager
- Audit and analytics summary

## Example MVP User Flow

1. Doctor opens encounter.
2. Doctor selects primary ICD and optional secondary ICD codes.
3. System loads recommended protocol bundle.
4. System suggests CLS, tests, and medication groups.
5. System calculates risk by reimbursement and composition rules.
6. Doctor accepts, edits, or overrides suggestions.
7. System stores final orders, rationale, warnings, and overrides.

## Success Metrics

- reduced time to complete protocol-aligned orders
- reduced rate of missing standard CLS/test items
- reduced rate of flagged or denied claims in pilot scope
- measurable adherence to protocol recommendations
- low false-positive alert rate
