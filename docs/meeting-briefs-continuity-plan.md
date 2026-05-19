# Meeting Briefs and Continuity Plan

## Goal

Add a human-edited meeting brief workflow that works after any meeting and can also carry selected context into future meetings in a series.

This is the umbrella plan. More focused future specs live in:

- [Recap Drafting](future-specs/recap-drafting.md)
- [Meeting Series Linking](future-specs/meeting-series-linking.md)

The core product stance is:

- The live meeting board is for sensemaking and facilitation.
- The meeting brief is for publishing and continuity.
- Agents can suggest, but humans confer significance.

## Product Principles

- Do not turn the product into a guilt ledger. Carry-forward context should mean "this may help next time," not "this was left undone."
- Keep human conversation as the primary source of truth. Agent prompts should only enter durable artifacts when humans discuss, promote, or rewrite them.
- Use one underlying data model across live meeting review, post-meeting recap, and next-meeting context.
- Make the brief preview explicit before anything is shared or reused.

## Core Concepts

### Meeting Brief

A `meeting_brief` is a reusable artifact generated from a meeting and edited by a human.

It can support:

- A post-meeting share recap for attendees or other stakeholders.
- A next-meeting context brief for the same series or a related future meeting.
- Both, when the host wants the recap to also become continuity memory.

Draft fields:

```text
meeting_brief
- id
- source_meeting_id
- series_id optional
- purpose: post_meeting_share | next_meeting_context | both
- audience: attendees | host_only | leadership | custom
- status: draft | reviewed | shared | archived
- title
- summary
- decisions
- actions
- open_questions
- risks_or_watchpoints
- assumptions_to_validate
- carry_forward_items
- human_notes
- generated_from_item_ids
- edited_by
- shared_at
- created_at
- updated_at
```

### Carry-Forward Item

A carry-forward item is a host-approved piece of context that may help a future meeting.

Draft fields:

```text
carry_forward_item
- id
- source_meeting_id
- source_item_id optional
- series_id optional
- type: decision | action | open_question | risk | assumption | note
- status: carry_forward | resolved | parked | dropped
- title
- detail
- suggested_next_meeting_prompt
- transcript_evidence_ids
- promoted_from_agent_issue_id optional
- reviewed_by
- reviewed_at
```

### Meeting Series

A `meeting_series` links multiple meeting instances. Zoom can help, but Room Clarity should keep its own series identity.

Draft fields:

```text
meeting_series
- id
- title
- host
- zoom_meeting_id optional
- recurrence optional
- confidence: confirmed | inferred | suggested
- created_at
- updated_at
```

Meeting instances should remain separate records and link to a series when known:

```text
meeting_instance
- id
- series_id optional
- zoom_meeting_id optional
- zoom_occurrence_id optional
- zoom_meeting_uuid optional
- topic
- host
- attendees
- started_at
- ended_at
- dashboard_slug
```

## Zoom Series Detection

Use Zoom data as a confidence ladder:

- High confidence: same Zoom meeting ID with recurrence or occurrence metadata.
- High confidence after the meeting: same Zoom meeting ID with distinct past-meeting UUIDs.
- Medium confidence: same host, similar topic, recurring cadence, overlapping attendees.
- Low confidence: title similarity only.

Low and medium confidence links should be shown as suggestions, not automatic merges.

## Agent Content Rules

Agent output should not become first-class meeting truth by default.

Agent issue lifecycle:

```text
agent_issue.status:
- queued
- shown
- dismissed
- discussed
- promoted
```

Rules:

- If an agent issue is ignored, keep it in meeting history only.
- If humans discuss the topic, capture the human discussion outcome as a normal decision, risk, action, assumption, or open question.
- If the host promotes the agent point, convert it into a normal editable meeting item.
- In the brief, prefer human-facing language over agent language.
- Keep `promoted_from_agent_issue_id` only as provenance.

Useful modal actions:

- Ask or show to room.
- Dismiss.
- Mark discussed.
- Track as risk.
- Track as open question.
- Track as assumption.
- Add to brief.
- Carry forward.

## Interface Plan

### Live Meeting View

Purpose: help the host facilitate while the meeting is happening.

Add lightweight controls to existing decisions, risks, actions, and agent issues:

- Include in brief.
- Carry forward.
- Hide from attendee recap.
- Edit title/detail.
- Mark resolved.
- Merge duplicate.
- Promote agent issue into a normal item.

The live view should remain fast and sparse. Long-form editing belongs after the meeting.

### Review Mode

Purpose: clean up the artifact after the meeting.

This can reuse the main board layout, but with calmer post-meeting controls:

- Section filters for decisions, actions, risks, open questions, assumptions, and agent history.
- Batch include/exclude from brief.
- Human rewrite fields for attendee-facing language.
- Carry-forward status controls.
- Duplicate merge and source evidence review.

### Brief Preview

Purpose: show exactly what will be shared or reused.

Preview sections:

- Meeting recap.
- Decisions.
- Actions.
- Open questions.
- Risks and watchpoints.
- Assumptions to validate.
- Carry forward.

Actions:

- Edit section.
- Copy/share link.
- Mark reviewed.
- Save as next-meeting context.
- Attach to series.

## Implementation Phases

### Phase 1: Local Brief Drafts

- Extend frontend state with `briefDraft`, `includeInBrief`, `carryForward`, and `audienceVisibility` fields.
- Add simple item controls for include/exclude and carry-forward.
- Add a brief preview panel or route that composes current board state into a recap.
- Keep data in browser memory for the first iteration.

### Phase 2: Review Mode

- Add a post-meeting review view over the same meeting state.
- Support editing attendee-facing titles/details without losing transcript evidence.
- Add agent promotion flows from modal actions into normal board items.
- Add a "generate brief draft" action that creates structured draft sections.

### Phase 3: Persistence

- Add durable storage for meeting briefs and carry-forward items.
- Persist brief status, edited text, audience choice, and item provenance.
- Add API routes for creating, reading, updating, and listing briefs by meeting.
- Store brief IDs on meeting sessions.

### Phase 4: Series Continuity

- Add `meeting_series` and `meeting_instance` records.
- Link meetings by Zoom meeting ID when available.
- Add a suggested-series matching path for weaker signals.
- Show confirmed carry-forward items at the start of the next meeting.

### Phase 5: Sharing

- Add a shareable brief route with access controls.
- Add export/copy output for email or docs.
- Track `shared_at` and the selected audience.
- Keep host-only items out of shared views by default.

## First Build Slice

The smallest useful implementation is:

1. Add item-level `includeInBrief`, `carryForward`, and `audienceVisibility` flags.
2. Add a brief preview view generated from the current meeting state.
3. Add modal actions to promote agent issues into normal risks/open questions/assumptions.
4. Add a post-meeting review mode toggle that makes editing and include/exclude controls visible.

This validates the main product question before durable series storage: can a host turn live meeting sensemaking into a human-edited artifact worth sharing or carrying forward?

## Open Questions

- Should "assumption" become a first-class board item, or should it stay inside risks/open questions until the brief workflow proves it needs its own lane?
- Should the first preview be an in-app panel, a dedicated route, or both?
- Should brief sharing start as copy/export only before shareable links?
- What is the minimum access model for attendee-facing brief links?
