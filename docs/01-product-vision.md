# Product Vision

## Problem Statement

Doctors need faster and safer support when selecting tests, paraclinical services, and medications. In practice, mismatches between:

- diagnosis coding (ICD)
- ordered services and tests (CLS)
- medication choices
- recommended protocols
- payer cost and composition rules

can create unnecessary variation, higher cost, or claim denial risk.

## Product Goal

Build a decision support application that helps doctors make more consistent order decisions while reducing reimbursement risk and preserving clinical autonomy.

## Product Positioning

This product is not a black-box prescribing engine.

It is a guided support system that:

- recommends a protocol-aligned order set
- scores risk against reimbursement rules
- explains why something is recommended or flagged
- records overrides for governance and later improvement

## Primary Users

- Treating doctor
- Department lead or clinical reviewer
- Pharmacy or reimbursement reviewer
- Protocol and catalog administrator
- Operations or quality management team

## Main User Outcomes

### Doctor

- identify suitable tests and medications faster
- avoid missing standard protocol items
- see likely denial risks before finalizing orders
- justify necessary deviations when needed

### Reviewer or Admin

- update rule versions without app rewrites
- track which rules create frequent alerts
- identify common override reasons
- compare protocol adherence vs denial patterns

## Product Principles

1. Human-in-the-loop at all times
2. Explainable outputs only
3. Versioned knowledge and versioned rules
4. Separate clinical recommendation from reimbursement restriction
5. Low-friction workflow inside the doctor encounter
