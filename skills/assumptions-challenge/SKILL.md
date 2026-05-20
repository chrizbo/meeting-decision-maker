---
name: assumptions-challenge
description: Surface and stress-test stated and unstated assumptions behind a decision, strategy, plan, recommendation, or meeting discussion. Use when Codex needs to challenge assumptions, identify what must be true, assess confidence, find failure implications, or produce concise red-team interventions for a meeting transcript, decision log, product plan, business plan, strategy, or CLI analysis.
---

# Assumptions Challenge

## Purpose

Use this skill to identify the assumptions underneath a decision or plan, challenge the most important ones, and produce concise interventions that help a team strengthen the decision without derailing the conversation.

## Inputs

Accept any of these inputs:

- Meeting transcript excerpts
- A proposed decision or commitment
- A plan, strategy, product idea, business case, or recommendation
- Notes from a meeting dashboard

Preserve timestamp and speaker evidence when available. If evidence is thin, say so instead of inventing context.

## Workflow

1. Identify the decision, plan, or claim being evaluated.
2. List stated assumptions explicitly mentioned by the team.
3. Infer likely unstated assumptions, labeling them as inferred.
4. Prioritize assumptions by impact, uncertainty, and how actionable they are.
5. Challenge the highest-priority assumptions:
   - What has to be true for this to work?
   - What evidence supports it?
   - What would make it false?
   - If it is false, how does the decision or plan change?
   - How could the team strengthen the plan or mitigate the assumption failing?
6. Check whether the assumption is about the decision content, the decision process, the timing, or the strategy boundary.
7. Produce only the highest-value intervention for a live meeting unless asked for a fuller analysis.

## Meeting Agent Behavior

Queue a suggestion when the team appears to be making or accepting a decision that rests on a meaningful assumption. Do not interrupt automatically.

Use the live meeting agent strategy: speak only when the assumption is important enough for immediate host intervention. If the assumption can be preserved inside a decision or risk without changing the live discussion, prefer the durable artifact over an agent response.

Raise priority when:

- The assumption is central to the decision succeeding.
- The transcript shows confidence without evidence.
- The team treats an uncertain belief as settled fact.
- The assumption would materially change the plan if false.
- The team is skipping discourse and moving directly to decision.
- A kairos/urgent decision is using chronos assumptions about available time, data, or consensus.
- A strategy discussion is too specific to allow local adaptation or too ambiguous to encode a hard choice.

If the team begins discussing the same assumption, add follow-up text that responds to the discussion rather than repeating the first concern.

If several assumptions appear in the same topic, choose the one that would most change the decision if false. Do not create separate live responses for every assumption.

## Output Shape

For the meeting tool, return a compact object or prose equivalent with:

- agent: Assumptions Challenge
- priority: low, medium, or high
- trigger: the decision, claim, or plan that caused the suggestion
- evidence: timestamp and speaker when available
- intervention: one sentence the host could read aloud
- rationale: why this assumption matters
- suggested_action: a specific question, test, mitigation, or follow-up

For CLI use, include a short table of assumptions when useful, then the top recommended intervention.

## Guardrails

- Be specific and evidence-grounded.
- Separate stated assumptions from inferred assumptions.
- Avoid generic objections like "validate this" unless paired with a concrete test.
- Prefer one sharp question over a long critique in live-meeting mode.
- Do not frame uncertainty as failure; frame it as something the team can strengthen.
- Challenge the decision container when needed: who should be in the discourse, who decides, and what would count as enough evidence?
- When two good options are competing, ask whether the team can express the tradeoff as an "even over" statement.

## Reference

For the underlying RTT method, read [references/rtt-source.md](references/rtt-source.md).

For Chris Butler decision-making principles, read [../references/chris-butler-decision-principles.md](../references/chris-butler-decision-principles.md).

For live meeting response budgets and meeting bridge quality, read [../references/live-meeting-agent-strategy.md](../references/live-meeting-agent-strategy.md).
