---
name: identify-risks
description: Identify and structure risks, concerns, failure modes, assumptions-at-risk, mitigations, and warning signs from meeting transcripts, notes, VTT/TXT cues, or live conversation segments. Use when Codex needs to populate a meeting risk list, detect blockers, distinguish risks from complaints, link risks to decisions or actions, or generate risk follow-up suggestions for a dashboard or CLI transcript analysis.
---

# Identify Risks

## Purpose

Use this skill to capture risks that could affect a decision, plan, product direction, execution path, stakeholder outcome, or meeting commitment.

## Inputs

Accept transcript cues, full transcripts, notes, decisions, or actions. Preserve timestamp, speaker, and source evidence when available.

## What Counts As A Risk

Capture a risk when the conversation names or implies a future negative outcome, uncertainty, dependency, failure mode, blocker, or condition that could make a decision fail.

Common signals:

- "risk", "concern", "failure mode", "warning sign", "blocker", "dependency"
- "if this is wrong", "what if", "the assumption is", "we do not know"
- A downside of a decision is identified
- A mitigation or contingency is discussed
- A stakeholder, security, privacy, adoption, timing, quality, or trust concern appears

Do not capture simple preferences or complaints unless they could materially affect the decision or plan.

## Workflow

1. Identify the risk or concern.
2. Link it to the decision, action, or assumption it affects when possible.
3. State the possible negative outcome in plain language.
4. Capture evidence and speaker/timestamp.
5. Capture mitigation, owner, warning sign, or open question if present.
6. Assign severity and confidence.
7. Keep the visible risk card short and actionable.

## Output Shape

Return one or more records with these fields:

- type: risk
- title
- summary
- linked_decision_or_action
- severity: low, medium, high
- confidence: low, medium, high
- mitigation
- warning_sign
- owner
- evidence: timestamp, speaker, quote or cue id when available
- suggested_next_step

## Live Meeting Guidance

In live meeting mode, surface risks that are actionable or decision-relevant. If a risk is speculative but important, phrase it as a question the host can ask.

## Guardrails

- Separate risks from action items.
- Do not inflate severity without evidence.
- Prefer concrete failure modes over vague anxiety.
- Capture mitigation when the team offers one.
- If the team dismisses a risk, preserve the dismissal rationale when available.

## Reference

For examples and schemas, read [references/extraction-schema.md](references/extraction-schema.md).
