---
name: lessons-learned
description: Use when something fails or misbehaves, before guessing at a fix, and after you fix a failure whose cause was not obvious. Holds the catalogue of symptoms, causes and fixes that actually happened.
---
# Lessons learned

`LESSONS.md` in this folder is the catalogue of traps this project has already fallen
into. Most of the value of experience is knowing the trap before you step in it.

## When something fails

1. **Search `LESSONS.md` for the symptom first** (the error text, "white screen", "401",
   "hangs"). If it is there, apply the known fix and say which lesson you used.
2. If it is not there, establish ground truth before fixing: what exactly failed, at which
   ladder rung, and what still works. Do not change three things at once.

## When to add a lesson

Add one in the same PR when all of these are true:
- a ladder rung or a run failed,
- the cause was not obvious from the error message,
- someone could plausibly hit it again.

Do not add lessons for typos, or for failures the error message already explained.

## Format

One row per lesson in the right section of `LESSONS.md`:

| Symptom (what you see) | Cause | Fix | Prevent |
|---|---|---|---|

Write the symptom in the words someone would search for. Keep each cell to one line.

## Rules

- A human approves every new lesson (CODEOWNERS covers `.github/`). Agent-added lessons
  that are vague or duplicate an existing row should be rejected in review.
- When a lesson becomes a check (a new ladder rung, a lint rule), keep the row and note
  the check in the Prevent column.
