# Plan: Add an Azure SQL architecture design skill

Issue: none   Risk: high

## Assumptions

- The skill is project-scoped under `.github/skills/`, matching the repository’s existing skills.
- The skill designs Azure SQL architecture; it does not provision resources, create schemas, or implement `AzureSqlRepo`.
- The skill should auto-apply when users ask to design, review, or choose an Azure SQL architecture.

## Objective

- **Goal:** Give agents a repeatable workflow for producing secure, scalable, operable, and cost-aware Azure SQL architecture designs for this application.
- **Inputs:** The existing skill format, `azure-sql-mi`, the repository architecture, workload requirements, and accepted decisions 0001, 0006, and 0007.
- **Outputs:** A new `.github/skills/azure-sql-architecture/SKILL.md` and a routing entry in `.github/skills/loop-engineering/SKILL.md`.
- **Success criteria:**
  - The new skill has valid repository-style frontmatter with a discoverable name and trigger-rich description.
  - The workflow gathers requirements before choosing Azure SQL Database, Managed Instance, or SQL Server on Azure VM.
  - The design covers data model, workload and capacity, availability and disaster recovery, security and managed identity, networking, performance, observability, backup and retention, migration, cost, and validation.
  - The output template records assumptions, decisions, alternatives, diagrams, risks, and measurable acceptance criteria.
  - The skill preserves data access behind `Repo`, obtains roles from application data, and prohibits database passwords.
  - The skill directs implementation work to `azure-sql-mi` rather than duplicating it.
  - The skill remains under 500 lines and `bash scripts/verify.sh` passes.
- **In scope:** `.github/skills/azure-sql-architecture/SKILL.md`, `.github/skills/loop-engineering/SKILL.md`.
- **Out of scope:** Application code, database DDL, Azure resources, infrastructure as code, dependencies, and changes to accepted decision records.
- **Risk:** High because repository skills under `.github/` alter agent behavior. The change requires human review and must not be merged automatically.

## Steps

- [x] 1. Create the design-only Azure SQL architecture skill with a requirements-first workflow, decision gates, security constraints, validation checklist, and architecture output template. (files: `.github/skills/azure-sql-architecture/SKILL.md`)
- [x] 2. Add the new skill to the loop-engineering router without changing the existing `azure-sql-mi` implementation route. (files: `.github/skills/loop-engineering/SKILL.md`)
- [x] 3. Validate metadata, line count, references, terminology, and run `bash scripts/verify.sh`; record the evidence for review. (files: none)

## Decisions

- Separate architecture design from data-layer implementation so planning does not silently provision or modify the application.
- Default to Azure SQL Database for this application unless requirements demonstrate a need for Managed Instance or SQL Server on Azure VM.
- Keep detailed guidance in one concise `SKILL.md`; no script or reference file is needed for this design workflow.
- No new decision record is needed because the skill applies accepted architecture decisions rather than changing them.
- Respects: 0001 (data access behind `Repo`), 0006 (roles from application data), 0007 (managed identity and no stored secrets).
