---
name: pre-mortem
description: Imagine that a plan, strategy, launch, decision, or commitment has failed and work backward to plausible causes, mitigations, and early warning signs. Use when Codex needs to red-team a proposal, identify failure modes, create live meeting interventions, improve a product or business plan, or produce a CLI pre-mortem analysis from transcript excerpts or planning notes.
---

# Pre-Mortem

## Purpose

Use this skill to help a team examine how a decision or plan could fail before it is approved or executed, then turn those failure paths into mitigations and warning signs.

## Inputs

Accept any of these inputs:

- Meeting transcript excerpts
- A decision, launch plan, strategy, business plan, project plan, or recommendation
- A risk list or set of open questions

Preserve timestamp and speaker evidence when available. If the plan is not yet concrete enough for a pre-mortem, ask for the missing decision, desired outcome, or execution context.

## Workflow

1. Identify the plan or decision being evaluated.
2. State the intended outcome in one sentence.
3. Imagine the plan has failed in a concrete way.
4. Work backward to plausible causes of failure.
5. Prioritize failure paths by likelihood, impact, and whether the team can act on them.
6. Suggest mitigations that improve the plan.
7. Identify early warning signs the team could monitor.
8. Identify whether the failure would come from the decision process, the strategy boundary, the timing model, or execution.
9. Produce the most useful live intervention or a fuller CLI analysis depending on context.

## Meeting Agent Behavior

Queue a suggestion when the transcript shows the team moving toward approval, launch, commitment, or resourcing without discussing meaningful failure paths.

Raise priority when:

- The decision appears hard to reverse.
- The team is committing resources, people, reputation, or timing.
- The downside risk is large and no mitigation is named.
- A failure path is already hinted at in the transcript.
- A forming decision is about to close without enough discourse.
- The team is treating a kairos decision like a normal planning-cycle decision, or vice versa.
- A strategy does not name what is out of bounds, making drift likely.

If the team begins discussing the same risk, add follow-up text that names mitigation options or warning signs.

## Output Shape

For the meeting tool, return a compact object or prose equivalent with:

- agent: Pre-Mortem
- priority: low, medium, or high
- trigger: the plan or decision being stress-tested
- evidence: timestamp and speaker when available
- intervention: one sentence the host could read aloud
- failure_path: the plausible way this could fail
- mitigation: concrete way to reduce the risk
- warning_sign: observable sign that the failure path may be emerging

For CLI use, include a concise list of top failure paths, mitigations, and warning signs.

## Guardrails

- Do not be theatrical; make failure scenarios concrete and useful.
- Prefer preventable or monitorable failure paths.
- Avoid listing every possible risk; pick the few that could materially alter the decision.
- Distinguish evidence from inference.
- In live-meeting mode, keep the intervention short enough for a host to use immediately.
- Prefer tripwires, survival metrics, review points, and decision logs over vague "monitor this" language.
- Consider whether an autonomous agent should only surface the risk while a human keeps judgment, exception handling, and final commitment.

## Reference

For the underlying RTT method, read [references/rtt-source.md](references/rtt-source.md).

For Chris Butler decision-making principles, read [../references/chris-butler-decision-principles.md](../references/chris-butler-decision-principles.md).
