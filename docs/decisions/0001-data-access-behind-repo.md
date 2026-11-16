# 0001: All data access goes through the Repo interface

Status: Accepted
Date: 2026-11-16

## Context
The app starts with in-memory data for demos and tests, and will later move to Azure SQL.
If routes, components or tools read storage directly, that move touches every file and
every test, and is too large to review safely.

## Decision
Every read and write goes through the `Repo` interface in `api/src/data/types.ts`.
Routes receive a `Repo`; they never import a storage client. State changes go through
`Repo` methods that write the audit entry in the same operation. The web app and the MCP
server never touch data at all: they call the API.

## Alternatives rejected
- Query the database directly in routes: fastest to write, but couples every route to one
  storage engine and makes tests need a database.
- An ORM: adds a large dependency and hides the SQL that reviewers need to see.

## Consequences
- Good: moving to Azure SQL is one new class (`AzureSqlRepo`) plus a switch. Tests keep
  using `MemoryRepo`. Audit cannot drift from state.
- Cost: every new data need starts with a change to the interface. That is deliberate:
  it makes data access changes visible in review.
