# Domain Model

## Core Domains

### Clinical Encounter Domain

- Patient
- Encounter
- Diagnosis
- ClinicalContext
- OrderSet
- OrderedItem

### Knowledge Base Domain

- ICDCatalog
- CLSCatalog
- MedicationCatalog
- Protocol
- ProtocolVersion
- ProtocolRule
- RecommendationTemplate

### Reimbursement Domain

- CostCompositionRule
- ClaimRiskRule
- RuleVersion
- ExceptionRule
- PayerPolicySource

### Governance Domain

- RecommendationRun
- Alert
- Override
- AuditEvent
- ApprovalRecord

## Suggested Core Entities

### Patient

- id
- externalPatientId
- demographics
- insuranceInfo
- chronicConditions

### Encounter

- id
- patientId
- facilityId
- specialtyId
- encounterType
- attendingDoctorId
- status
- createdAt

### Diagnosis

- id
- encounterId
- icdCode
- diagnosisType
- certaintyLevel
- note

### OrderedItem

- id
- encounterId
- itemType
- catalogCode
- quantity
- dosageOrFrequency
- status

### ProtocolVersion

- id
- protocolId
- version
- effectiveFrom
- effectiveTo
- specialtyId
- diagnosisCriteria
- evidenceSource
- status

### ClaimRiskRule

- id
- versionId
- scope
- conditionExpression
- severity
- messageTemplate
- actionHint

### RecommendationRun

- id
- encounterId
- protocolVersionId
- reimbursementRuleVersionId
- inputSnapshot
- outputSnapshot
- generatedAt

### Override

- id
- encounterId
- recommendationRunId
- overriddenBy
- reasonCode
- freeTextReason
- createdAt

## Relationship Summary

- One patient can have many encounters.
- One encounter can have many diagnoses and ordered items.
- One protocol can have many versions.
- One recommendation run references one protocol version and one reimbursement rule version.
- One encounter can produce many alerts and overrides.

## Domain Modeling Rule

Clinical recommendation logic and reimbursement risk logic must remain separate in the data model. They can be evaluated together, but they should not be stored as one mixed ruleset.
