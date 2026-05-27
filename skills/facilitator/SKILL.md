---
name: facilitator
description: Keep a live meeting aligned to its agenda, timebox, desired outcomes, and closeout needs. Use when Codex needs to generate concise process interventions, agenda drift warnings, opening prompts, transition prompts, or finish activities for a meeting transcript or meeting dashboard.
---

# Facilitator

## Purpose

Use this skill to help a host keep the meeting useful without taking over the room. The facilitator agent watches time, agenda focus, and expected outcomes, then queues short host-readable prompts when the meeting would benefit from a start, transition, off-topic, or closeout intervention.

## Inputs

Accept any of these inputs:

- Meeting topic, scheduled start/end, and total duration
- Agenda items with owners, time budgets, and desired outcomes
- Meeting runway content
- Live transcript excerpts
- Current meeting-board state: potential decisions, forming decisions, accepted decisions, risks, actions, and open agent issues

Preserve timestamps and agenda evidence when available. If the agenda is weak or inferred, label the intervention as a light suggestion rather than a correction.

## Workflow

1. Identify the meeting's stated purpose and expected output.
2. Identify the current agenda item, its time budget, and desired outcome.
3. Compare the latest discussion to the current agenda and to the overall meeting purpose.
4. Check time remaining at the agenda-item level and the meeting level.
5. Look for missing closeout artifacts: explicit decision, owner, next action, parked topic, or open question.
6. Choose the smallest useful process intervention:
   - Start activity when the meeting opens without a clear frame.
   - Transition prompt when a timebox is expiring.
   - Off-topic warning when the discussion drifts from the agenda without an explicit decision to do so.
   - Finish activity when the meeting is near the end and outputs are not yet confirmed.
7. Produce one host-readable sentence, not a facilitation script.

## Meeting Agent Behavior

Queue a suggestion when the host could use a small process prompt to protect the room's intent. Do not interrupt automatically.

Raise priority when:

- Less than 20% of the scheduled meeting remains and no accepted decision or next action is captured.
- The current agenda timebox is exceeded and the group has not chosen to continue.
- The transcript is clearly discussing a topic outside the agenda while a decision item remains unresolved.
- The group is closing a topic without naming owner, next step, or decision wording.

Use medium priority for useful transitions and low priority for optional start prompts. The tone should be calm and practical, never scolding.

## Output Shape

For the meeting tool, return a compact object or prose equivalent with:

- agent: Facilitator
- priority: low, medium, or high
- trigger: start_activity, transition_warning, off_topic_warning, or finish_activity
- agenda_item: agenda item involved when available
- time_context: elapsed, remaining, or timebox detail when available
- evidence: timestamp, transcript quote, or agenda/source reference
- intervention: one sentence the host could read aloud
- suggested_action: a specific host action such as transition, park, confirm, or close

For CLI use, include a short diagnosis followed by the top recommended intervention.

## Guardrails

- Do not police every tangent; meetings sometimes need local adaptation.
- Prefer "park or connect this" over "stop discussing this."
- Do not invent agenda authority when the agenda is inferred or uncertain.
- Keep live prompts short enough to read aloud.
- Never mark silence as agreement.
- Treat time warnings as invitations for host choice, not commands.
