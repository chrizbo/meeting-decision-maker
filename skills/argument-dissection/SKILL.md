---
name: argument-dissection
description: Evaluate the quality of an argument, recommendation, claim, proposal, or meeting rationale by checking the real problem, evidence, ambiguity, assumptions, bias, missing information, fallacies, rival causes, and alternative conclusions. Use when Codex needs to red-team decision reasoning, assess a transcript claim, improve a strategy argument, or produce concise live meeting interventions.
---

# Argument Dissection

## Purpose

Use this skill to examine whether a claim or recommendation is well supported, whether it addresses the real problem, and what important information or rival explanations may be missing.

## Inputs

Accept any of these inputs:

- Meeting transcript excerpts containing a claim, recommendation, or rationale
- A written proposal, product argument, business case, or strategy note
- A decision and the stated reasons for it

Preserve timestamp and speaker evidence when available. If the argument is incomplete, identify what is missing rather than over-judging it.

## Workflow

1. Identify the argument or recommendation.
2. State the conclusion and supporting reasons.
3. Check whether it addresses the real problem.
4. Look for vague, ambiguous, or loaded language.
5. Identify descriptive assumptions about how things are and prescriptive assumptions about how things should be.
6. Evaluate evidence quality, statistics, analogies, and context.
7. Look for bias, logical fallacies, missing information, rival causes, or alternative conclusions.
8. Check whether the argument separates discourse from decision, names the decision-maker, and states what kind of decision tempo is needed.
9. Produce the most useful live intervention or a fuller CLI analysis depending on context.

## Meeting Agent Behavior

Queue a suggestion when the team appears to accept a claim, rationale, or recommendation with weak evidence, missing context, ambiguous language, or unexamined alternatives.

Raise priority when:

- The argument is driving a decision.
- Evidence is anecdotal, vague, missing, or presented without context.
- The same evidence could support a different conclusion.
- The recommendation may not address the real problem.
- The discussion hides a hard tradeoff instead of naming what is being chosen even over another good option.
- Strategic language is too specific to allow adaptation or too ambiguous to guide choices.
- The team is using agent output as authority rather than as a provocation, pattern, or candidate artifact.
- A bias appears to be shaping the argument: anchoring, confirmation bias, authority bias, availability bias, sunk cost, status quo bias, groupthink, consensus illusion, automation bias, or false dichotomy.

If the team starts discussing the same argument, add follow-up text that sharpens the evidence question, missing information, or rival explanation.

## Output Shape

For the meeting tool, return a compact object or prose equivalent with:

- agent: Argument Dissection
- priority: low, medium, or high
- trigger: the claim, recommendation, or rationale being evaluated
- evidence: timestamp and speaker when available
- intervention: one sentence the host could read aloud
- weakness: the issue in the argument
- missing_information: what the team may need before deciding
- alternative_explanation: a rival cause or conclusion when relevant

For CLI use, include a concise assessment of conclusion, evidence, assumptions, missing information, and recommended next question.

## Guardrails

- Challenge the argument, not the person making it.
- Be precise about whether the concern is evidence, logic, framing, bias, or missing information.
- Do not overclaim fallacies; name them only when clear.
- Prefer questions that improve the decision over debate-club objections.
- In live-meeting mode, make the intervention short and usable by the host.
- Look for "bizarro" or reasonable-opposite strategies: if the opposite would not make sense, the strategy may be fluff.
- When a strategy claim is broad, ask what is explicitly in bounds, out of bounds, proven today, and aspirational.
- Challenge consensus claims carefully. Silence, lack of objection, or one person's confident statement is not the same as agreement.
- If a bias may be present, ask for the missing comparison or disconfirming evidence instead of naming the bias as an accusation.

## Reference

For the underlying RTT method, read [references/rtt-source.md](references/rtt-source.md).

For Chris Butler decision-making principles, read [../references/chris-butler-decision-principles.md](../references/chris-butler-decision-principles.md).

For cognitive and social bias checks, read [../references/decision-bias-checks.md](../references/decision-bias-checks.md).
