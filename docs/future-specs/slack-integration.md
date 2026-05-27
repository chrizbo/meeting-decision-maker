# Future Spec: Slack Integration

## Status

Future consideration. Build after durable meeting records, user/workspace accounts, and reviewed recap links exist.

This spec covers Slack as a distribution, preparation, and follow-through surface for Room Clarity. It does not make Slack the transcript source or the primary meeting UI.

## Goal

Help teams carry meeting context into the place where follow-up actually happens:

- Share a live meeting dashboard link.
- Share a reviewed meeting recap.
- Keep decisions, actions, risks, and open questions visible after the call.
- Improve future meetings by prompting better preparation, clearer goals, and unresolved-item follow-through in Slack.

## Product Stance

- Slack should reduce meeting drag, not create another inbox of meeting noise.
- The host controls what is shared.
- Recaps shared to Slack must be reviewed or clearly marked as draft.
- Agent critiques should not be posted to a channel by default.
- Slack messages should link back to the canonical Room Clarity meeting record instead of duplicating full transcripts or sensitive content.
- Slack should support better meeting habits before and after meetings, not interrupt live discussion unless the host explicitly asks.

## Core Use Cases

### Share the Live Meeting Link

When a meeting starts, the host can send the live Room Clarity dashboard URL to a Slack channel, DM, or meeting thread.

Useful message fields:

```text
live_meeting_share
- meeting_title
- host_name
- dashboard_url
- access_mode
- meeting_start_time
- short_purpose optional
- current_phase optional
- shared_by_user_id
- shared_to_channel_id
- slack_message_ts
```

Recommended behavior:

- Default to a short message with the meeting title, purpose, and dashboard link.
- Use unfurling or a Block Kit card for Room Clarity URLs when the Slack app is installed.
- Respect access controls. If a Slack user can see a message but lacks meeting access, the link should open a request-access or sign-in path.
- Do not post raw transcript snippets in the live share message.

### Share the Reviewed Recap

After the host reviews a recap, Room Clarity can post a concise recap message to Slack.

Suggested sections:

- Outcome.
- Decisions.
- Actions.
- Open questions.
- Risks or watchpoints.
- Link to full recap.

The Slack message should be short enough to read in-channel. The full recap lives in Room Clarity.

Controls:

- Share to channel.
- Share to thread.
- Send to attendees by DM.
- Copy Markdown for manual posting.
- Schedule recap for later.
- Update previously shared recap.

The first implementation can be copy-to-clipboard only. The first Slack-native implementation should post a reviewed recap to a selected channel or thread.

### Create a Meeting Thread

For teams that use one channel per project, Room Clarity can create or reuse a Slack thread for each meeting.

Thread contents:

- Pre-meeting context prompt.
- Live dashboard link.
- Reviewed recap.
- Follow-up reminders.
- Resolution updates when actions or open questions close.

This prevents a channel from getting several disconnected meeting messages.

### Link Unfurls

When someone pastes a Room Clarity meeting or recap URL into Slack, the Slack app can show a rich preview.

Meeting dashboard unfurl:

- Meeting title.
- Host.
- Status: live, ended, recap draft, reviewed.
- Top outcome or current decision frame.
- Button to open the board.

Recap unfurl:

- Meeting title.
- Review status.
- Number of decisions and actions.
- Button to open recap.

Unfurls must not reveal private meeting content unless the posting user and channel are allowed to see it. If auth is needed, Slack supports authenticated unfurl flows.

## Meeting Quality Features

Slack can help before and after the meeting in ways the live board cannot.

### Pre-Meeting Readiness Prompt

Before a scheduled meeting, Room Clarity can post a lightweight prompt to the host or meeting channel:

- What decision should this meeting produce?
- Who is the decision owner?
- What information should attendees read first?
- What would make this meeting worth ending early?
- Is this meeting actually an update that should be handled async?

This should be host-configurable and quiet by default. The value is in catching unclear meetings before they start.

### Agenda Gap Check

If Room Clarity has calendar, prior recap, or meeting series context, it can post a private host prompt when the meeting looks under-specified:

- No clear decision or desired outcome.
- No owner for the decision.
- Prior open questions are not addressed.
- Required stakeholders appear absent.
- The meeting looks like recurring status without explicit need for synchronous discussion.

Recommended first version: send this as a private Slack DM to the host, not a public channel critique.

### Async Deflection

Slack is a good place to avoid unnecessary meetings.

Possible workflow:

1. Host invokes a Room Clarity Slack shortcut or slash command.
2. Room Clarity opens a modal asking for meeting goal, attendees, and desired output.
3. The app suggests whether to keep the meeting, convert it to an async update, ask for missing pre-read input first, or shorten the meeting and define the decision owner.
4. If the host accepts, Room Clarity drafts the Slack message or checklist.

This should be framed as meeting design help, not a gatekeeper.

### Decision Follow-Through

After a recap is shared, Slack can keep follow-up alive:

- DM action owners with their assigned actions.
- Post a weekly open-question digest to the project channel.
- Remind the decision owner when a watchpoint or assumption needs review.
- Ask whether a decision has been reversed, superseded, or confirmed.
- Carry unresolved items into the next meeting thread.

Reminders must be configurable per workspace and per meeting series. Bad reminders will make the integration feel spammy.

### Meeting Health Signals

Slack can expose lightweight patterns over time without naming and shaming people:

- Meetings with no recorded decision or next action.
- Recurring meetings with the same unresolved item across several sessions.
- Decisions without owners.
- High number of deferred decisions.
- Recaps not reviewed or not shared.

These should appear in a host or workspace dashboard first. Slack digests should be opt-in.

## User Experience

### Installation

Workspace admins or individual users install the Slack app through OAuth.

Install flow should connect:

- Slack workspace.
- Room Clarity workspace.
- Default sharing preferences.
- Allowed channels, if restricted.

Start with a minimal app manifest and only request scopes needed for the first slice. Slack app manifests can be reused across development and production app configurations.

### App Home

The Slack App Home can provide:

- Recent meetings.
- Draft recaps awaiting review.
- Open actions assigned to the user.
- Meeting series with carry-forward items.
- Default notification preferences.

This is useful later, but not required for the first sharing slice.

### Slash Command or Shortcut

Possible commands:

```text
/roomclarity share
/roomclarity prep
/roomclarity recap
/roomclarity actions
```

A global shortcut may be easier than asking users to remember commands. Slack shortcuts and slash commands can open modals for focused input.

### Message Design

Use compact Block Kit messages:

- Title and status.
- 3-6 bullets max.
- Buttons for `Open board`, `Open recap`, `Review draft`, and `View actions`.
- Thread replies for follow-up updates.

Avoid long channel posts. Use Slack as the pointer and action surface, not the full archive.

## Data Model

```text
slack_workspace_connection
- id
- room_clarity_workspace_id
- slack_team_id
- slack_team_name
- bot_user_id
- installed_by_user_id
- scopes
- access_token_ref
- default_channel_id optional
- created_at
- updated_at

slack_user_link
- id
- room_clarity_user_id
- slack_team_id
- slack_user_id
- slack_email optional
- created_at
- updated_at

slack_meeting_share
- id
- meeting_id
- slack_team_id
- channel_id
- thread_ts optional
- message_ts
- share_type: live_link | recap | action_digest | reminder
- visibility: channel | thread | dm
- created_by_user_id
- created_at
- updated_at

slack_notification_preference
- id
- workspace_id
- user_id optional
- meeting_series_id optional
- live_link_default: off | host_dm | channel
- recap_default: manual | prompt_host | auto_after_review
- action_reminders: off | dm_owner | channel_digest
- prep_prompts: off | host_dm | channel
```

Tokens should be stored as secrets. Do not store Slack access tokens in meeting records.

## Permissions and Privacy

Minimum first-slice permissions likely include:

- Post messages to selected conversations.
- Read enough conversation metadata to let the host choose a channel.
- Receive interactivity payloads for buttons, shortcuts, and modals.
- Optional link unfurl permissions if we implement Room Clarity URL previews.

Privacy rules:

- Never post full transcripts to Slack by default.
- Never auto-post sensitive agent critiques to a public channel.
- Avoid posting attendee-level behavioral analysis.
- Treat Slack channel membership as insufficient proof of Room Clarity meeting access.
- Audit every Slack share and update.
- Support disconnecting Slack from a Room Clarity workspace.

Slack Connect channels need extra caution because channel members may belong to external organizations.

## Technical Shape

Slack should be a provider adapter around the existing meeting and recap records.

Suggested services:

```text
SlackConnectionService
- installWorkspace()
- refreshConnection()
- disconnectWorkspace()
- mapSlackUser()

SlackShareService
- postLiveMeetingLink()
- postReviewedRecap()
- updateSharedRecap()
- postActionReminder()
- findOrCreateMeetingThread()

SlackInteractionService
- handleSlashCommand()
- handleShortcut()
- handleButtonAction()
- handleModalSubmission()
- handleLinkShared()
```

Relevant Slack surfaces:

- `chat.postMessage` for live links and recaps.
- `chat.scheduleMessage` for scheduled nudges, within Slack's scheduling limits.
- `chat.unfurl` and `link_shared` events for rich previews of Room Clarity URLs.
- Workflow Builder webhooks for customer-owned lightweight automations.
- App manifests for repeatable app configuration.
- Shortcuts, slash commands, and modals for host-driven prep and sharing flows.

## First Build Slice

Recommended first Slack slice:

1. Add durable meeting and reviewed recap URLs.
2. Add Slack workspace installation with minimal posting scope.
3. Let the host choose a Slack channel after recap review.
4. Post a compact reviewed recap with a full recap link.
5. Store `slack_meeting_share` with channel and message timestamp.
6. Add `Update Slack recap` if the recap changes after sharing.
7. Add manual `Share live board to Slack` from the meeting header.

Do not start with automated pre-meeting prompts. Get channel sharing and access control right first.

## Later Build Slices

- Room Clarity link unfurls.
- Meeting thread reuse.
- Host DM agenda gap checks.
- Action owner DMs.
- Open-question digests.
- App Home.
- Slash command or shortcut for meeting prep.
- Async deflection workflow.
- Workspace-level meeting health digest.
- Slack Workflow Builder integration template.

## Open Questions

- Should Slack installation be available for individual accounts, workspaces only, or both?
- Should Room Clarity post live links automatically when a meeting starts, or only after host action?
- Should recaps be posted to channels, attendee DMs, or both?
- What is the minimum access check before showing recap detail inside a Slack unfurl?
- How should Slack user identity map to Zoom users, calendar attendees, and Room Clarity accounts?
- Should action reminders sync to Slack only, or also create tasks in external task systems?
- Should meeting-quality prompts be private to the host by default even for team workspaces?

## Sources

- Slack sending and scheduling messages: https://docs.slack.dev/messaging/sending-and-scheduling-messages/
- Slack link unfurling: https://docs.slack.dev/messaging/unfurling-links-in-messages/
- Slack app manifests: https://docs.slack.dev/app-manifests/
- Slack scopes: https://docs.slack.dev/reference/scopes/
- Slack Workflow Builder webhooks: https://slack.com/help/articles/360041352714-Build-a-workflow--Create-a-workflow-that-starts-outside-of-Slack
