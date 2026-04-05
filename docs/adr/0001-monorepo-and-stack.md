# ADR 0001 - Monorepo And Stack

## Status

Proposed

## Decision

Use a TypeScript monorepo with separate app surfaces for doctor workflow, admin workflow, and backend API.

## Proposed Stack

- Frontend web apps: Next.js
- Backend API: NestJS
- Database: PostgreSQL
- ORM: Prisma
- Auth: internal RBAC with future SSO support
- Shared packages: domain, decision-engine, ui, shared-types, config

## Why This Direction

- fast end-to-end delivery with one primary language
- strong modularity without early microservice overhead
- easier sharing of domain types and validation logic
- suitable for a planning-first scaffold and phased build

## Consequences

- clean module boundaries are required from the start
- the decision engine should remain deterministic and test-first
- external integration adapters should stay isolated behind modules
- future extraction into services is possible if needed
