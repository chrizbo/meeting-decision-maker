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

Capture a `forming` decision when the team is doing decision discourse: naming a decision question, comparing good options, surfacing disagreement, deciding how to decide, or clarifying who should be involved before commitment. A forming decision should not imply agreement.

## Workflow

1. Identify the decision statement or candidate.
2. Determine status: forming, pending, accepted, or rejected.
3. Capture the options or tradeoff if present.
4. Capture rationale, evidence, assumptions, and unresolved questions.
5. Capture owner, action link, or review point if present.
6. Preserve source evidence using timestamp and speaker when available.
7. Keep the visible decision card short; put nuance in detail fields.

When the transcript shows meta-decision work, capture it in the decision detail:

- decision_type: strategic, product, operational, personnel, policy, technical, or unknown
- discourse_needed: who should be involved and how
- decision_maker: person, role, group, or unknown
- decision_tempo: chronos/planned, kairos/urgent, or unclear
- tradeoff_statement: "choose X even over Y" when the discussion names two good options

## Output Shape

Return one or more records with these fields:

- type: decision
- title
- status: forming, pending, accepted, rejected
- summary
- options_considered
- rationale
- assumptions
- open_questions
- owner
- evidence: timestamp, speaker, quote or cue id when available
- suggested_next_step

## Live Meeting Guidance

For live meeting mode, prefer fewer, clearer decision topics. Use `forming` when the group is actively discussing a decision question, tradeoff, or option set but has not committed. Use `pending` when there is a concrete proposed decision ready for host confirmation. Use `accepted` only when the transcript contains clear agreement or decision language.

If a decision is forming, prefer updating the existing forming record as discourse develops. Escalate from `forming` to `pending` only when the group has a concrete proposal to confirm. Escalate to `accepted` only when the transcript shows explicit commitment.

## Guardrails

- Separate decisions from actions and risks.
- Do not invent agreement when only one person suggested something.
- Do not create separate decision records for each side of one tradeoff; update the existing forming decision topic.
- Preserve the discourse/decision boundary: do not treat useful disagreement, option generation, or critique as final commitment.
- If the team has not decided how to decide, surface that as an unresolved question instead of forcing a decision.
- Preserve dissent or unresolved concerns in open questions.
- Keep evidence short and traceable.
- Prefer the team's language for the title when it is clear.

## Reference

For examples and schemas, read [references/extraction-schema.md](references/extraction-schema.md).

For Chris Butler decision-making principles, read [../references/chris-butler-decision-principles.md](../references/chris-butler-decision-principles.md).
