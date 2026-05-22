# Future Spec: Meeting Runway

## Status

Partially sliced for local prototype testing.

This document separates:

- `Current Local Slice`: what is intentionally being built now with stub data and no model use.
- `Later Build Slices`: agenda parsing, Zoom visibility behavior, host editing, and persistence work that should remain future-facing until the local interaction proves useful.

## Goal

Help a meeting start with useful shared context before the regular live board becomes the main surface.

Meeting Runway is a temporary start board shown for the first 1-2 minutes of a meeting. It orients the room, lets the host skip ahead at any time, and then automatically switches to the regular live board while preserving all captured meeting state.

## Product Stance

- The runway is for meeting orientation, not long-form agenda editing.
- The live board should still capture decisions, risks, actions, and agent issues while the runway is visible.
- The runway should reduce meeting-start ambiguity without becoming the facilitator.
- The host should be able to skip it immediately or reopen it later from the meeting info header.
- Silence during the opening should not be treated as agreement.

## Research Rationale

The Drive meeting research suggests the start of a meeting is a high-leverage moment:

- Effective virtual meeting leaders restate a clear goal, assign roles, set expectations, support connection, actively facilitate, and close with clarity.
- Meeting behavior routines can form early, so the opening surface can help set a productive pattern before the group drifts into story-telling, complaint, or passive update mode.
- Silence and low participation can reflect norms, efficiency pressure, postponed voicing, or pseudo-voicing rather than true alignment.
- Good meeting preparation matters, but gathering context can be expensive. Room Clarity can preload a concise start surface from existing meeting context.
- Meetings can create anticipatory dread; a clear opening can make the meeting feel more purposeful and less like an interruption.

## Core Experience

When a host opens a meeting session, show the runway as the first board state.

The runway remains visible by default for roughly 90 seconds. During that time:

- Transcript ingestion starts normally.
- Cue analysis runs normally when available.
- Captured decisions, risks, actions, and agent issues are added to meeting state in the background.
- The host can select `Live Board` to switch immediately.
- The `Live Board` control shows an animated countdown or progress state so the host understands the runway will advance automatically.

When the timer completes, switch to the regular live board. Any artifacts captured during the runway appear normally, without special labels or markers.

In the live board, add a `Runway` or `Context` control in the meeting info header so the host can reopen the runway when needed.

## Runway Content

Suggested start board sections:

```text
meeting_runway
- id
- meeting_id
- status: active | completed | skipped | reopened
- duration_seconds
- purpose
- agenda_items
- decision_frame
- roles
- participation_norm
- carry_forward_items
- opening_prompt
- source_context_ids
- created_at
- updated_at
```

### Purpose

A one-sentence framing of why this meeting exists.

Examples:

- "Decide whether the prototype should prioritize live facilitation or post-meeting recap."
- "Review the launch risks and choose owners for the next mitigation pass."

### Agenda Items

Agenda items may come from Zoom meeting metadata, a connected calendar description, a prior brief, a host-entered agenda, or inferred context.

Keep the visible list short. Prefer 3-5 agenda items over a long schedule.

When source documents are attached, combine document signals with the agenda instead of creating a separate doc-summary section. Each relevant agenda row can include a compact source-document link.

Each agenda item can optionally include:

```text
agenda_item
- title
- source_doc_link optional
- owner optional
- time_budget_minutes optional
- desired_outcome optional
- source: zoom | calendar | prior_brief | host | inferred
```

### Decision Frame

Clarify what kind of meeting this is:

```text
decision_frame
- mode: decide | align | explore | update | review
- decision_owner optional
- success_condition optional
- decision_method optional
```

The first version can use a simple segmented control or host-editable label.

### Roles

Show lightweight role prompts when known or useful:

- Host.
- Decision owner.
- Topic owner.
- Timekeeper.
- Notes or brief owner.
- Chat watcher.

Roles should be optional. The runway should not imply that every meeting needs formal assignments.

The current local slice does not show roles. Reintroduce them only if user testing shows they help the host start the meeting.

### Participation Norm

Use a concise norm that helps avoid false consensus and postponed voicing.

Examples:

- "Raise risks early, even if they are not fully formed."
- "Use chat for questions if interrupting feels costly."
- "Disagreement is useful when it changes the decision."

### Carry Forward

Show only host-approved context from prior meetings:

- Forming decisions.
- Open questions.
- Watchpoints.
- Prerequisite actions.
- Assumptions to validate.

Avoid unresolved-work guilt. The tone should be "this may help us start well," not "this is overdue."

### Opening Prompt

Show one host-sayable prompt, not a long facilitation script.

Examples:

- "Before we start, what concern would be costly to leave unsaid?"
- "What would make this meeting worth ending early?"
- "Which agenda item actually needs a decision today?"
- "Who is missing from this discussion but will live with the outcome?"

## Transition Behavior

Default behavior:

1. Meeting session opens.
2. Runway appears and starts a countdown.
3. Capture and analysis run in the background.
4. Host can skip with `Live Board`.
5. At the end of the countdown, switch to the live board.
6. Live board shows current meeting state normally.
7. Host can reopen runway/context from the meeting info header.

Suggested default duration: 90 seconds.

Possible later settings:

- 30 seconds.
- 90 seconds.
- 2 minutes.
- Manual only.

Do not create special "captured during runway" markers. The runway is a display mode, not a separate artifact category.

## Launch Timing

The runway timer should start when the board becomes visible and useful, not merely when the app process loads.

This matters for Zoom because the app may be launched late, opened in a sidebar, backgrounded, or loaded before the host shares it with the room.

Recommended behavior:

- If the app is opened before the meeting is underway, show the runway and start the countdown when the board is foregrounded, shared, or opened as the main dashboard surface.
- If the app is loaded but remains hidden, backgrounded, or parked in a Zoom sidebar, keep the runway available but do not burn down the timer.
- If the app launches late and the meeting already has elapsed time, transcript cues, or captured artifacts, open the live board by default.
- If the app launches late but no meaningful meeting state exists yet, show the runway with a shorter countdown or let the host choose `Live Board`.
- If the host reopens the runway from the header, do not restart the original auto-transition countdown unless the host explicitly chooses to run it again.

Suggested late-launch threshold:

```text
late_launch
- meeting_elapsed_seconds > 120
- or transcript_cue_count > 0
- or board_artifact_count > 0
```

The exact threshold should be tuned once real Zoom launch and RTMS timing are observable.

## Zoom Launch Behavior

Zoom app visibility and sharing should be treated as best-effort and host-directed.

Room Clarity should not depend on being able to force the app onto the meeting stage or automatically open it for every participant. Zoom Apps SDK capabilities can help the host present the board, but user consent, host action, client support, marketplace permissions, and account settings may limit what is possible.

Useful Zoom capabilities to design around:

- `shareApp({ action: "start" })` to share the app surface when the host chooses to present it.
- `openUrl()` to open the dashboard in a browser when the host wants an external shared-screen path.
- `sendAppInvitation`, `sendAppInvitationToAllParticipants`, or `sendAppInvitationToMeetingOwner` to invite others into the app flow.
- `bringAppToFront`, `expandApp`, visibility events, and running-context events where supported to detect or improve whether the app is actually visible.

Recommended launcher states:

- `Ready to share`: the app has meeting context and a dashboard session, but the board is not yet shared or foregrounded.
- `Runway active`: the runway is visible and counting down.
- `Live board active`: the main board is visible, with normal capture and analysis.
- `Backgrounded`: the app is running but should not advance runway timing.
- `Late launch`: the meeting appears to be underway, so the live board opens first and runway remains available from the header.

Host controls in the launcher should include:

- `Share in Zoom`
- `Open Dashboard`
- `Copy Link`
- `Live Board`

If a Zoom SDK call fails or is unsupported, fall back to the next available host-controlled path rather than blocking the meeting.

## Header Reopen Control

The live board meeting info header should include a compact `Runway` or `Context` control.

When reopened, the runway can appear as:

- A modal.
- A side panel.
- A full-board temporary overlay.

The first version should prefer a simple overlay that can be dismissed quickly. Reopening should not pause transcript capture or analysis.

## Inputs

Potential inputs, in rough priority order:

- Host-entered purpose or agenda.
- Zoom meeting topic.
- Zoom agenda or meeting description when available.
- Calendar event description when available.
- Zoom participants and host/co-host metadata.
- Prior meeting brief for the same series.
- Carry-forward items approved by the host.
- Early transcript cues from the first minute.

All inferred content should be editable or clearly low-stakes. Do not invent owners, agreement, due dates, or decision authority.

## Privacy and Access

Runway context can reveal sensitive meeting purpose before the transcript has begun.

Rules:

- Only authorized meeting participants or explicitly invited viewers should see the runway.
- Do not expose meeting topic, agenda, participants, or carry-forward context to unauthorized users.
- If access is uncertain, show a generic waiting state until authorization is resolved.
- Keep externally shared views scoped to the current meeting and audience.

## Interface Notes

The runway should feel like a quiet operational surface:

- Clear hierarchy.
- No marketing-style hero.
- No long explanatory copy.
- Compact agenda and context blocks.
- A prominent `Live Board` button with visible auto-advance progress.
- A small timer, not a stressful countdown.

The `Live Board` control should communicate both agency and automation. A radial progress ring or subtle fill animation is enough.

## Current Local Slice

This is the first implementation slice. It is meant to validate the interaction locally before investing in Zoom-specific timing, agenda extraction, or model-backed context.

Included now:

1. Add a `runwayVisible` state and default 90-second timer.
2. Add a start board with purpose, agenda/doc signals, decision frame, carry-forward context, participation norm, and opening prompt.
3. Seed the runway from fake Zoom meeting context and static mock data.
4. Continue transcript playback and cue analysis while the runway is visible.
5. Switch automatically to the existing live board when the timer ends.
6. Add a `Live Board` skip button with countdown/progress feedback.
7. Add a `Runway` or `Context` button in the live board header to reopen the runway.
8. On reopen, show the same context without restarting the original countdown.
9. Keep captured decisions, risks, actions, and agent issues unmarked when the live board appears.
10. Hide the reopen control while runway is already active.

Out of scope for the current local slice:

- Model-generated runway content.
- Parsing agenda from Zoom or calendar descriptions.
- Persisting runway edits.
- Detecting whether the Zoom app is foregrounded, shared, hidden, or launched late.
- Skipping directly to the live board based on real meeting elapsed time or RTMS state.
- Participant-specific runway views.

## Later Build Slices

- **Carry Forward section**: The carry forward block has been removed from the runway UI until there is a mechanism to pull items from previous meetings. Restore it once meeting series linking or a prior-meeting brief integration is in place. The data model (`carry_forward_items`) and stub data in `app.js` can be removed at that point too. See `docs/future-specs/meeting-series-linking.md` for the continuity plan.
- Start the runway countdown only when the board is visible, foregrounded, shared, or opened as the main dashboard surface.
- Skip directly to the live board for late launches with existing meeting state.
- Parse agenda from Zoom or calendar descriptions.
- Let hosts edit and save runway fields before or during the opening.
- Pull carry-forward items from prior meeting briefs once series continuity exists.
- Add meeting-type templates for decision, review, planning, incident, and status meetings.
- Add host settings for runway duration or manual-only mode.
- Add Zoom launcher states for `Ready to share`, `Runway active`, `Live board active`, `Backgrounded`, and `Late launch`.
- Add evaluation fixtures for meetings where runway context improves or fails to improve live capture.

## Open Questions

- Should the first countdown be 90 seconds or 2 minutes?
- Should auto-switch happen even if RTMS/transcript ingestion has not started?
- Should reopening the runway show the original start context, updated live context, or both?
- Should runway edits be saved into the post-meeting brief as meeting purpose/context?
- Should participants see the same runway as the host, or should host/operator mode include private controls?
- Which Zoom visibility event is reliable enough to start the runway countdown?
- Should late launch be based on elapsed Zoom meeting time, transcript cue count, board artifact count, or a combination?
