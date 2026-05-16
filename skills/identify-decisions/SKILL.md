---
name: identify-decisions
description: Identify and structure decisions from meeting transcripts, notes, VTT/TXT cues, or live conversation segments. Use when Codex needs to detect proposed decisions, accepted decisions, rejected options, parked decisions, decision evidence, owners, status, tradeoffs, and review points for a meeting dashboard, decision log, CLI transcript analysis, or shared-screen meeting tool.
---

# Identify Decisions

## Purpose

Use this skill to turn messy meeting conversation into lightweight decision records that a host can review, correct, and later export.

## Inputs

Accept transcript cues, full transcripts, meeting notes, or individual conversation snippets. Preserve timestamp, speaker, and source evidence when available.

## What Counts As A Decision

Capture a decision when the team clearly chooses, agrees, rejects, defers, or narrows options. Also capture decision candidates when the group is converging but has not fully committed.

Common signals:

- "Decision:", "we decided", "let's do", "agreed", "we will", "we won't"
- A tradeoff is settled between options
- Someone assigns a direction, owner, or next implementation path
- The group says something is out of scope
- The group parks a decision for later

Do not capture every opinion as a decision. If the conversation is only exploratory, mark it as a decision candidate or ignore it.

## Workflow

1. Identify the decision statement or candidate.
2. Determine status: proposed, accepted, rejected, parked, or superseded.
3. Capture the options or tradeoff if present.
4. Capture rationale, evidence, assumptions, and unresolved questions.
5. Capture owner, action link, or review point if present.
6. Preserve source evidence using timestamp and speaker when available.
7. Keep the visible decision card short; put nuance in detail fields.

## Output Shape

Return one or more records with these fields:

- type: decision
- title
- status: proposed, accepted, rejected, parked, superseded
- summary
- options_considered
- rationale
- assumptions
- open_questions
- owner
- evidence: timestamp, speaker, quote or cue id when available
- suggested_next_step

## Live Meeting Guidance

For live meeting mode, prefer fewer, clearer decisions. When uncertain, surface a low-confidence decision candidate that the host can confirm instead of silently creating a confident record.

## Guardrails

- Separate decisions from actions and risks.
- Do not invent agreement when only one person suggested something.
- Preserve dissent or unresolved concerns in open questions.
- Keep evidence short and traceable.
- Prefer the team's language for the title when it is clear.

## Reference

For examples and schemas, read [references/extraction-schema.md](references/extraction-schema.md).
