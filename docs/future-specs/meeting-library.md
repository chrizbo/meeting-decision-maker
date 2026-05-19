# Future Spec: Meeting Library

## Status

Future consideration. Do not implement until Meeting Briefs and review workflows have been validated.

## Idea

Offer an interface where a user can see meetings, briefs, carry-forward context, and series they have access to.

This should start as a Room Clarity library, not a full Zoom meeting browser.

## Product Rationale

A meeting library could help users:

- Find recent meeting boards and briefs.
- Return to draft post-meeting recaps.
- See shared briefs.
- Review carry-forward context before a future meeting.
- Navigate meeting series once continuity exists.

The library should support memory and continuity without making Room Clarity feel invasive.

## Recommended Scope

### Version 1: Room Clarity Library

Show only meetings where the user has a Room Clarity relationship:

- Host.
- Creator.
- Invited editor.
- Invited viewer.
- Explicit shared-link access.

Suggested sections:

- Recent meetings.
- Draft briefs.
- Shared briefs.
- Carry-forward context.
- Series.

Suggested filters:

- Topic.
- Host.
- Date.
- Brief status.
- Series.
- Items needing review.

This version can be backed by Room Clarity's own stored meeting sessions, briefs, carry-forward items, and access records.

### Later Version: Optional Zoom Expansion

Only after the Room Clarity library feels useful, consider optional Zoom-backed discovery:

- Link this brief to a Zoom series.
- Find matching Zoom meetings.
- Import upcoming occurrences.
- Show scheduled series where Room Clarity has already been authorized.

This path likely requires additional Zoom OAuth scopes, pagination, recurrence handling, admin consent, and clearer privacy disclosures.

## Access Rule

Only show meetings where the user has an explicit Room Clarity relationship.

Do not list a user's whole Zoom calendar or Zoom meeting history by default. That could feel surprising, especially for meetings where Room Clarity was never used.

## Data Dependencies

The Room Clarity version depends on:

- Durable meeting sessions.
- Durable meeting briefs.
- Carry-forward items.
- Meeting-series records.
- User identity and access records.

The Zoom-expanded version may also depend on:

- Zoom OAuth authorization.
- Zoom meeting and recurrence metadata.
- Past meeting instance lookup.
- Admin-approved scopes for organization-level use.

## Interface Notes

The library should feel like a workbench, not an inbox.

Useful actions:

- Open meeting board.
- Open draft brief.
- Preview shared brief.
- Continue review.
- Attach meeting to series.
- Remove or archive stale context.

Avoid making unresolved actions the dominant visual cue. The main question should be "what context is useful now?" rather than "what did you fail to finish?"

## Open Questions

- Should the first library live behind a dashboard route such as `/meetings`, or inside the existing app shell?
- Should shared-link access create a visible library entry for the viewer, or only for signed-in users?
- How much search is needed before users have more than a handful of meetings?
- Should the library include imported transcript-only meetings that never had a live board?
