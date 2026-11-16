---
name: azure-sql-architecture
description: Designs and reviews Azure SQL architectures, including service selection, data modeling, capacity, resilience, security, networking, migration, operations, and cost. Use when planning an Azure SQL solution, choosing between Azure SQL Database, Managed Instance, or SQL Server on Azure VM, or reviewing a proposed database architecture.
---
# Azure SQL architecture design

Design before provisioning. Produce a reviewable architecture with explicit assumptions,
trade-offs, risks, and measurable acceptance criteria. Do not create resources, DDL, or
application code while using this skill.

## Repository guardrails

Read decisions 0001, 0006, and 0007 before designing:

- Application data access remains behind `Repo`; clients never access SQL directly.
- Identity proves who the caller is; application data determines roles.
- The API connects with Entra managed identity. Never design or store a database password.
- State changes and audit entries commit in one transaction.
- Route Azure SQL implementation work to `azure-sql-mi` after the design is approved.

If a requested design conflicts with an accepted decision, identify the conflict and stop.
Do not work around it silently.

## Workflow

### 1. Establish requirements

Gather evidence for:

- Data entities, relationships, retention, sensitivity, residency, and expected growth.
- Read/write patterns, transaction boundaries, concurrency, peak throughput, and latency.
- Availability target, RPO, RTO, regions, maintenance windows, and failure scenarios.
- Existing SQL Server features, cross-database dependencies, migration constraints, and downtime tolerance.
- Environments, deployment model, operational ownership, compliance, and monthly budget.

For unknowns that affect service tier, networking, or resilience, ask the user. Otherwise,
state a conservative assumption and show how the design changes if it is wrong.

### 2. Select the Azure SQL service

Prefer the least complex service that satisfies verified requirements:

| Service | Choose when | Do not choose merely because |
|---|---|---|
| Azure SQL Database | A cloud application needs a managed relational database with database-level isolation and scaling | It is the default without checking workload and recovery needs |
| Azure SQL Managed Instance | Migration requires supported instance-scoped or cross-database SQL Server capabilities | The name resembles managed identity |
| SQL Server on Azure VM | Requirements need operating-system access, unsupported instance features, or full engine control | The team is familiar with virtual machines |

For Azure SQL Database, compare provisioned, serverless, elastic pool, and Hyperscale only
when workload evidence makes them relevant. Verify current limits, regional availability,
and pricing from official Microsoft sources; do not rely on remembered SKU details.

Record the selected service, rejected alternatives, and the requirement that decided each
trade-off. Expensive-to-reverse choices require a proposed decision record.

### 3. Design the data and transaction model

- Map entities, keys, relationships, constraints, and ownership boundaries.
- Preserve the shapes and operations promised by `Repo`.
- Derive indexes from named query and write patterns; do not add speculative indexes.
- Define transaction boundaries, including atomic state-and-audit writes.
- Define retention, archival, deletion, and data-classification rules.
- Describe schema migration ordering, compatibility, rollback, and seed-data policy.

Include a Mermaid entity-relationship diagram and list the queries each important index supports.

### 4. Design security and networking

- Use Entra authentication and the workload's managed identity; prohibit SQL credentials.
- Grant least privilege to the application identity and separate migration/operator identities.
- Keep authorization in the API and application role data, not in client input or token role claims.
- Choose public access with explicit firewall rules or private access with Private Endpoint
  based on deployment topology; justify the choice and its DNS implications.
- Specify encryption, auditing, threat detection, vulnerability assessment, data masking,
  and ledger or Always Encrypted only when requirements call for them.
- Identify human bootstrap actions, such as creating the managed-identity database user.

### 5. Design capacity, performance, and resilience

- Estimate starting storage, annual growth, peak connections, throughput, and compute headroom.
- Define connection pooling, retry boundaries, transient-fault handling, and token refresh behavior.
- Set measurable latency, saturation, and scaling thresholds.
- Map availability and disaster-recovery features to the required RPO and RTO.
- Define backup retention, restore testing, failover testing, and regional outage behavior.
- Identify single points of failure and degraded-mode behavior.

Do not add geo-replication, zone redundancy, or premium tiers without a requirement and cost impact.

### 6. Design operations, migration, and cost

- Define metrics, logs, alerts, dashboards, ownership, escalation, and runbooks.
- Include capacity review, index review, restore drills, and access review schedules.
- Plan schema and data migration with rehearsal, validation, cutover, rollback, and reconciliation.
- Estimate recurring and one-time costs with assumptions. Include compute, storage, backup,
  networking, monitoring, secondary replicas, and non-production environments.
- Identify cost controls and what signal permits scaling down.

## Required output

Write the design to the user-requested path, or default to
`docs/architecture/azure-sql.md`, using this structure:

```markdown
# Azure SQL architecture

## Executive summary
## Requirements and assumptions
## Current-state constraints
## Service and tier decision
## Context and component diagram
## Data model and transaction boundaries
## Security and networking
## Capacity and performance
## Availability, backup, and disaster recovery
## Observability and operations
## Migration, cutover, and rollback
## Cost model
## Risks and mitigations
## Alternatives rejected
## Validation and acceptance criteria
## Open decisions
## Implementation handoff
```

The component diagram must show the web client, API, managed identity, Azure SQL boundary,
network path, administrative path, and observability flow.

## Quality gate

Before presenting the design, verify:

- Every material choice traces to a requirement or explicit assumption.
- RPO, RTO, latency, scale, retention, and cost have measurable targets.
- Security identities and trust boundaries are named; no password is proposed.
- Failure, restore, migration, rollback, and cost-growth paths are covered.
- Diagrams and prose describe the same architecture.
- Open decisions have an owner and block implementation when necessary.
- The implementation handoff names `azure-sql-mi` and does not contain unapproved provisioning.
