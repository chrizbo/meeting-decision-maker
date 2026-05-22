# Future Spec: Recap Drafting

## Status

First local slice implemented on `recap/brief-first-slice`. The current prototype supports a Recap step, item-level exclude/re-include controls, agent issue promotion into normal board items, and a copyable Markdown meeting brief. Durable storage, share links, audience-specific permissions, editing fields, carry-forward persistence, and duplicate merge remain future work.

## Goal

Let a host turn the live meeting board into a human-edited recap that can be shared after any meeting.

This spec focuses on the editorial workflow: what gets drafted, what the human reviews, and what is safe to publish.

## Product Stance

- The live board is for sensemaking.
- The recap is for human communication.
- The recap should represent what humans discussed and decided, not everything the system noticed.
- Agent prompts should not enter the recap unless they were discussed, promoted, or rewritten by a human.

## Core Artifact

```text
meeting_brief
- id
- source_meeting_id
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

The first implementation keeps this in browser state. Durable storage can come after the workflow feels right.

## Draft Inputs

The recap draft can draw from:

- Accepted or pending decisions.
- Actions with clear owners or next steps.
- Open questions that materially affect follow-up.
- Risks or watchpoints the group actually discussed.
- Assumptions that matter to a decision.
- Host-written notes.
- Promoted agent issues.

Do not include by default:

- Ignored agent suggestions.
- Low-confidence extracted items.
- Transcript snippets that are only evidence, not useful recap content.
- Every possible action-like utterance.

## Item-Level Controls

Board items should support:

- Include in recap.
- Exclude from recap.
- Hide from attendee-facing recap.
- Carry forward.
- Edit attendee-facing title/detail.
- Mark resolved.
- Merge duplicate.

Agent issues should support:

- Dismiss.
- Mark discussed.
- Promote to risk.
- Promote to open question.
- Promote to assumption.
- Add to recap.

## Review Mode

Review mode can reuse the main meeting board but should feel calmer than the live meeting surface.

Useful controls:

- Section filters for decisions, actions, risks, open questions, assumptions, and agent history.
- Batch include/exclude.
- Human rewrite fields.
- Source evidence review.
- Duplicate merge.
- Audience visibility toggles.

The host should be able to clean up language without losing provenance.

## Brief Preview

The host should see a formatted preview before sharing.

Suggested sections:

- Meeting recap.
- Decisions.
- Actions.
- Open questions.
- Risks and watchpoints.
- Assumptions to validate.
- Carry forward.

Actions:

- Edit section.
- Copy/export.
- Mark reviewed.
- Share link when access controls are ready.
- Save as next-meeting context.

## Agent Content Rule

Agents can suggest. Humans confer significance.

If an agent issue is ignored, keep it in meeting history only. If humans discuss the issue, capture the human discussion outcome as a normal recap item. If the host promotes it, convert it into human-facing language before it appears in the recap.

Keep `promoted_from_agent_issue_id` as provenance, not as user-facing recap content.

## First Build Slice

Implemented:

1. Add a `Recap` step to the meeting stepper.
2. Add review mode that visually marks excluded board items.
3. Add item-level exclude/re-include controls for decisions, risks, actions, and open questions.
4. Add a brief preview generated from current board state.
5. Add `Copy Brief`, exporting the included sections as Markdown.
6. Add agent modal actions that promote an issue into a normal risk or open question.

Deferred from the fuller model:

- `audienceVisibility` controls.
- `carryForward` controls and persistence.
- Human rewrite fields.
- Section editing.
- Duplicate merge.
- Durable brief records and attendee-facing share links.

## Open Questions

- Should "assumption" become a first-class board item before recap drafting, or only inside recap sections at first?
- Should the first dedicated brief route reuse browser state, persisted session state, or a new `meeting_brief` record?
- What editing fields are necessary before a copied brief is credible for real teams?
- What is the minimum access model for attendee-facing brief links?
