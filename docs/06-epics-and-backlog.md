# Epics And Backlog

## Epic 1 - Platform Foundation

Goal:

- establish the engineering base for secure clinical workflow delivery

Backlog:

- create app shells for web, admin, and api
- implement authentication and role-based access
- define environment and configuration handling
- set up audit logging baseline
- define core coding and testing conventions

## Epic 2 - Master Data And Knowledge Base

Goal:

- make catalogs and protocol content versioned and manageable

Backlog:

- import ICD catalog
- import CLS catalog
- import medication catalog
- model protocol and protocol version entities
- build admin flow for catalog and protocol updates

## Epic 3 - Encounter And Diagnosis Workflow

Goal:

- provide the doctor-facing encounter workspace

Backlog:

- encounter creation or lookup
- diagnosis entry with primary and secondary ICD support
- patient context capture
- draft order set management

## Epic 4 - Recommendation Engine V1

Goal:

- recommend protocol-aligned tests and medication groups

Backlog:

- protocol matching by diagnosis and context
- recommendation generation for CLS and tests
- recommendation generation for medication groups
- rationale and evidence display

## Epic 5 - Reimbursement Guard V1

Goal:

- surface denial-risk and cost-composition alerts before final order confirmation

Backlog:

- define claim-risk rule model
- implement ICD + CLS + medication composition checks
- return alert severity and explanation
- show recommended corrective actions

## Epic 6 - Override And Audit

Goal:

- preserve clinical autonomy while retaining accountability

Backlog:

- allow accept, modify, or override actions
- require reason for selected overrides
- store recommendation run snapshots
- build review trail for governance

## Epic 7 - Admin Analytics

Goal:

- give operations and reviewers visibility into recommendation quality and alert behavior

Backlog:

- alert frequency dashboard
- override reason dashboard
- protocol adherence reporting
- denial-risk trend reporting

## Definition Of Ready Before Implementation

- pilot specialty selected
- initial protocol source confirmed
- initial denial-risk rule source confirmed
- target user roles confirmed
- preferred deployment model confirmed

## Definition Of Done For MVP

- doctor can complete one encounter from diagnosis to reviewed order set
- system returns recommendations plus denial-risk warnings
- every alert is explainable
- every override is logged
- admin can update at least one protocol and one rule version
