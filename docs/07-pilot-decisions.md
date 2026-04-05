# Pilot Decisions

## Confirmed On April 3, 2026

- care setting: outpatient
- first specialty: internal medicine
- behavior: recommendation only
- default knowledge source: Ministry of Health treatment protocols and reimbursement guidance
- future extension: clinic-specific protocol and rule customization

## Design Implications

- the doctor workflow can be optimized for fast outpatient visits
- the first protocol library can be narrower and more controlled
- the UI should present guidance and warnings without hard blocking clinical action
- the admin portal must support versioned local overrides in a later phase

## Recommended Next Engineering Step

Build a runnable skeleton that demonstrates:

- outpatient encounter workspace
- internal medicine recommendation view
- reimbursement guard panel
- protocol and rule governance screen
- baseline API endpoints for health and recommendation preview
