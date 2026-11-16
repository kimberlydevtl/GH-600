---
applyTo: "api/test/**"
---
# Tests

- Use `node:test` (run with `npm test`) and real HTTP calls against `createApp(new MemoryRepo())`.
- Call `repo.reset()` before each test so tests are independent.
- For every allowed behaviour, add the forbidden case next to it.
- A test that cannot fail is not evidence: if your change were wrong, which test goes red?
