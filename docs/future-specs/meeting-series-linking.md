# Future Spec: Meeting Series Linking

## Status

Future-facing spec. Do not implement until recap drafting and basic persistence are ready.

## Goal

Link multiple meeting instances into a series so Room Clarity can carry useful context from one meeting to the next.

The purpose is continuity, not guilt. The interface should help a host remember what matters without making unresolved work feel like a debt register.

## Product Stance

- Room Clarity should keep its own series identity.
- Zoom metadata can help infer links, but should not be the only source of truth.
- Meeting instances should remain separate records even when they belong to one series.
- Low-confidence matches should be suggestions, not automatic merges.

## Core Records

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

## Zoom Linking Signals

Use a confidence ladder:

- High confidence: same Zoom meeting ID with recurrence or occurrence metadata.
- High confidence after the meeting: same Zoom meeting ID with distinct past-meeting UUIDs.
- Medium confidence: same host, similar topic, recurring cadence, overlapping attendees.
- Low confidence: title similarity only.

Zoom fields to preserve when available:

- Zoom meeting ID.
- Occurrence ID.
- Meeting UUID.
- Topic.
- Host.
- Start time.
- Recurrence metadata.

## Manual Controls

The host should be able to:

- Confirm a suggested series link.
- Attach a meeting to an existing series.
- Create a new series from a meeting.
- Split a meeting out of a series.
- Merge duplicate series.
- Rename a series.
- Choose which carry-forward items appear next time.

## Carry-Forward Context

Carry-forward context should be curated, not automatic.

Good candidates:

- Decisions still forming.
- Decisions with explicit review points.
- Open questions blocking progress.
- Actions that are prerequisites for a future decision.
- Assumptions the team said it needs to validate.
- Risks with tripwires or watchpoints.
- Host notes marked as useful next time.

Poor candidates:

- Every unresolved action.
- Ignored agent prompts.
- Low-confidence extracted items.
- Stale items that have not been reviewed.

## Next Meeting Entry Point

At the start of a linked future meeting, the app can show a small context brief:

- Last meeting recap.
- Carry-forward decisions.
- Open questions.
- Watchpoints.
- Prerequisite actions.
- Suggested prompts for the host.

The host should decide what becomes visible in the meeting board.

## Relationship to Recap Drafting

Recap drafting and series linking share the same underlying meeting brief and carry-forward item concepts.

The recap asks: "What should people leave with?"

The next-meeting context asks: "What should we remember before continuing?"

They can overlap, but they should remain separate editorial surfaces.

## First Build Slice

1. Store series and meeting-instance fields on durable meeting sessions.
2. Link by Zoom meeting ID when available.
3. Let the host confirm or remove a series link.
4. Show confirmed carry-forward items for the next meeting in the same series.

## Open Questions

- How much Zoom recurrence metadata is available from the Zoom App path versus backend API enrichment?
- Should series confirmation happen immediately when a meeting starts, during review mode, or in a later Meeting Library?
- Should carry-forward items expire or require periodic review?
- Should series links be user-specific, team-wide, or account-wide?
