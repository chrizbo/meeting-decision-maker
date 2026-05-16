---
name: identify-action-items
description: Identify and structure action items, owners, due dates, follow-ups, dependencies, and links to decisions or risks from meeting transcripts, notes, VTT/TXT cues, or live conversation segments. Use when Codex needs to populate an action list, distinguish actions from decisions, infer likely owners cautiously, or produce meeting dashboard and CLI transcript action records.
---

# Identify Action Items

## Purpose

Use this skill to capture concrete follow-up work from meeting conversation without turning every suggestion into a task.

## Inputs

Accept transcript cues, full transcripts, notes, decisions, or risks. Preserve timestamp, speaker, and source evidence when available.

## What Counts As An Action Item

Capture an action item when the team commits to doing work after the conversation, assigns a next step, asks someone to follow up, or names a concrete deliverable.

Common signals:

- "Action:", "next action", "I will", "can you", "we should", "let's follow up"
- A deliverable is named
- An owner or responsible group is named
- A due date, review date, or next meeting checkpoint appears
- The task is tied to a decision, risk, or open question

Do not capture vague aspirations unless they include a concrete next step.

## Workflow

1. Identify the task or follow-up.
2. Capture owner when explicitly stated. If inferred, label it as inferred.
3. Capture due date, review point, or timing if present.
4. Link the action to a decision, risk, or open question when possible.
5. Preserve evidence and speaker/timestamp.
6. Capture dependency or expected output if present.
7. Keep the visible action card short.

## Output Shape

Return one or more records with these fields:

- type: action_item
- title
- summary
- owner
- owner_inferred: true or false
- due_or_review_date
- linked_decision_or_risk
- expected_output
- dependencies
- evidence: timestamp, speaker, quote or cue id when available
- suggested_next_step

## Live Meeting Guidance

In live meeting mode, show action items only when they are concrete enough for the host to confirm. If owner or timing is missing, suggest a host prompt to fill the gap.

## Guardrails

- Separate actions from decisions and risks.
- Do not invent owners or due dates.
- Mark inferred owners clearly.
- Prefer one concrete verb-led title.
- Capture what "done" looks like when the transcript provides it.

## Reference

For examples and schemas, read [references/extraction-schema.md](references/extraction-schema.md).
