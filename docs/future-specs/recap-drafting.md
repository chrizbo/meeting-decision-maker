# Future Spec: Recap Drafting

## Status

Future-facing spec. Do not implement until the live board and basic meeting review workflow are ready for this layer.

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

The first implementation can keep this in browser state. Durable storage can come after the workflow feels right.

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

1. Add item flags: `includeInBrief`, `audienceVisibility`, and `carryForward`.
2. Add simple review-mode controls for include/exclude and attendee visibility.
3. Add a brief preview generated from current board state.
4. Add agent modal actions that promote an issue into normal board items.

## Open Questions

- Should "assumption" become a first-class board item before recap drafting, or only inside recap sections at first?
- Should the first preview be an in-app panel, a dedicated route, or both?
- Should sharing start with copy/export before shareable links?
- What is the minimum access model for attendee-facing brief links?
