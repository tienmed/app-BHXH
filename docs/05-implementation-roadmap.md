# Implementation Roadmap

## Phase 0 - Discovery And Governance

- confirm pilot specialty and pilot facility
- confirm available ICD, CLS, medication, and protocol source data
- define denial-risk patterns to target first
- define clinical owner and reimbursement owner
- define success metrics and pilot scope

Current confirmed pilot baseline:

- outpatient
- internal medicine
- recommendation-only workflow
- Ministry of Health protocol seed source

## Phase 1 - Foundation

- set up monorepo and baseline engineering standards
- scaffold web, admin, and api apps
- design database schema
- implement auth, roles, and audit base
- import initial catalogs and protocol seed data

## Phase 2 - Doctor Workflow MVP

- encounter workspace
- diagnosis entry
- recommendation engine v1
- cost guard and denial-risk rules v1
- override flow
- recommendation history

## Phase 3 - Admin And Governance

- protocol version management
- catalog mapping tools
- rule version management
- analytics for alerts and overrides
- pilot feedback loop

## Phase 4 - Integration And Optimization

- connect to source systems
- improve explanation quality
- calibrate false positives
- add service-level metrics
- prepare multi-specialty rollout

## Recommended Delivery Sequence

1. Pick one specialty with stable protocols.
2. Start with a narrow denial-risk ruleset.
3. Validate recommendation quality with doctors weekly.
4. Expand only after protocol and rule ownership is stable.
