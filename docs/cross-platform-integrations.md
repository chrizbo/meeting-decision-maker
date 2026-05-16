# Cross-Platform Meeting Integration Notes

The product should treat Zoom, Google Meet, and Microsoft Teams as meeting-platform adapters around the same core dashboard. The core app should not know whether transcript cues came from Zoom RTMS, Google Meet artifacts, Microsoft Graph, a local VTT upload, or a mock replay fixture.

## Core Architecture Rule

Keep these layers separate:

- Meeting dashboard: decisions, risks, actions, agent issues, audit tray, transcript display, host confirmation state.
- Transcript/event ingestion: provider-specific source of timed speaker text.
- Meeting context adapter: provider-specific meeting title, host/operator, participants, and share/deep-link behavior.
- Auth/access adapter: public unguessable link for prototype; account-scoped access later.
- LLM worker: consumes normalized transcript cues plus meeting state and emits `schemas/llm-output.schema.json` records.

## Normalized Interfaces To Add Before Real Integrations

### TranscriptCue

```json
{
  "id": "string",
  "platform": "zoom|google_meet|teams|mock|upload",
  "meetingId": "string",
  "startTime": "ISO-8601 or seconds",
  "endTime": "ISO-8601 or seconds",
  "speakerName": "string|null",
  "speakerId": "string|null",
  "text": "string",
  "sourceRef": "string"
}
```

### MeetingContext

```json
{
  "platform": "zoom|google_meet|teams|mock",
  "platformMeetingId": "string",
  "title": "string",
  "hostUserId": "string|null",
  "hostDisplayName": "string|null",
  "attendees": [{ "id": "string|null", "displayName": "string" }],
  "dashboardSlug": "string",
  "accessMode": "unguessable_link|workspace_login|invite_only"
}
```

## Google Meet Implications

Google Meet has a Meet add-ons SDK for side panel and main stage experiences. A Meet add-on can start a collaborative activity with `startActivity()`, pass state through `ActivityStartingState`, and open a main-stage URL. Google also supports promoting an add-on from a screen-shared website with `exposeToMeetWhenScreensharing()`, which is a good fit for our initial human-shared dashboard path.

For transcript data, the Google Meet REST API exposes generated meeting artifacts. `conferenceRecords.transcripts` can list/get transcript metadata, and `conferenceRecords.transcripts.entries` can list structured transcript entries with participant, text, language, start time, and end time. This looks strongest for post-meeting or artifact-based import. The Meet add-ons SDK does not appear to expose live captions/transcript text directly. Google also has a Meet Media API in Developer Preview that can access real-time audio/video from a conference; that could support live transcription by sending raw audio to our own speech-to-text service, but it is not the same as a simple live transcript API and has restricted scopes, consent, enrollment, and technical requirements.

Recommended Meet path:

1. Keep the dashboard URL first.
2. Add Meet add-on shell later for side panel/main stage launch.
3. Use screen-share promotion so a shared dashboard can invite users into the add-on experience.
4. Use Meet transcript artifacts as a post-meeting import path.
5. Track Meet Media API as the possible live path, with our own speech-to-text layer, once it is production-ready for our target customers.

## Microsoft Teams Implications

Microsoft Teams supports meeting apps with meeting side panel, meeting details, meeting chat, and meeting Stageview surfaces. This maps well to our dashboard: the host can operate in the side panel and optionally share the dashboard to the meeting stage for everyone.

Microsoft Graph supports fetching Teams transcripts and recordings after the meeting or call ends. The transcript content is available as VTT, which fits our existing parser. Graph also has Meeting AI Insights for summaries/action items after a meeting, but the docs state those insights are post-meeting and can take time to become available. Teams itself has live transcription for users in the client, but the Graph transcript APIs are post-meeting availability APIs, not a live transcript stream. Microsoft's Real-time Media Platform can let bots receive raw audio/video frame by frame, but Microsoft positions this advanced path for scenarios like compliance recording, CVI, and contact centers and explicitly recommends Graph transcripts instead for meeting intelligence/AI agent scenarios. We should not build the live meeting experience around those post-meeting APIs, and we should treat raw-media bots as a heavier exception path.

Recommended Teams path:

1. Keep the dashboard URL and VTT import path compatible with Teams transcript VTT.
2. Add a Teams meeting app shell for side panel and meeting stage.
3. Use Microsoft Graph transcript APIs for post-meeting replay/import.
4. Treat any live transcript approach as a separate Teams-specific adapter, not part of the core board model.
5. Avoid a Teams raw-media bot for the first version unless a customer specifically needs live Teams support and accepts bot/consent/infrastructure tradeoffs.


## Live Notetaker / Participant Bot Pattern

Most third-party note takers use one of these patterns:

- Calendar integration finds meeting links and schedules a notetaker.
- A bot joins the meeting as a participant or meeting app, often with a visible name such as an AI notetaker.
- The service captures audio, captions, or meeting media, then runs its own speech-to-text and diarization.
- If official post-meeting transcripts are available, the service may fetch those later to improve or replace its live transcript.

For this product, a participant-style notetaker should be considered an enterprise/live fallback, not the first integration path.

### Teams Participant Bot

Teams has an official calls and online meetings bot model. A bot can join calls/meetings and, through the Real-time Media Platform, access voice, video, and screen sharing media frame by frame. This can support live transcription if we run our own speech-to-text pipeline. However, Microsoft describes real-time media bots as advanced and aimed at specialized scenarios such as compliance recording, Cloud Video Interop, and contact centers. Microsoft also recommends Graph transcript APIs instead for meeting intelligence scenarios when possible.

Implication: technically possible, but heavy. It would require Teams app/bot setup, Graph permissions, admin consent, bot admission/visibility, Windows/.NET media infrastructure for application-hosted media, and a clear customer consent story.

### Google Meet Media Bot/App

Google Meet add-ons are embedded UI experiences and do not appear to expose live caption text. Google Meet Media API, currently Developer Preview, lets registered apps access real-time audio/video from a Meet conference. That could support live transcription with our own speech-to-text service. It requires Developer Preview enrollment, restricted OAuth scopes, consent, admin controls, and technical WebRTC/media handling.

Implication: possible for a future live Meet path, but not a simple participant transcript bot and not yet the low-risk first target.

### Browser/Client Automation Bots

Some note takers may join meetings like a normal user through the web client, capture tab/system audio or captions, and send that to their transcription backend. This can work across platforms, but it is brittle and raises platform policy, security, consent, and customer trust issues. Avoid this path unless there is a strong reason and explicit customer approval.

### Product Recommendation

- Use Zoom RTMS for the first official live transcript path.
- Use VTT/upload/post-meeting import for Teams and Meet initially.
- Keep a normalized raw-audio-to-transcript ingestion adapter so Teams Real-time Media bots or Meet Media API can be added later without changing the board.
- If we ever add a participant bot, make it visibly named, consent-aware, and configurable by the host/admin.

## Product Decisions

- Do not make the Zoom App the core product. Make it the first adapter.
- Keep mock replay and VTT import as first-class paths because they work across Zoom, Meet, and Teams.
- Use provider-neutral words in the UI where possible: meeting, host, attendees, dashboard URL, transcript, meeting source.
- Preserve full transcript storage policy at the meeting-record level, not provider level.
- Do not require agents to become participants in any platform. They remain dashboard items.
- Design the dashboard layout for generic screen share and embedded meeting-stage dimensions.

## Sources

- Google Meet add-ons: https://developers.google.com/workspace/meet/add-ons/guides/use-add-on
- Google Meet add-on collaboration: https://developers.google.com/workspace/meet/add-ons/guides/collaborate-in-the-add-on
- Google Meet screen-share promotion: https://developers.google.com/workspace/meet/add-ons/guides/screen-sharing
- Google Meet transcript resources: https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.transcripts
- Google Meet transcript entries: https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.transcripts.entries
- Google Meet Media API: https://developers.google.com/workspace/meet/media-api/guides/overview
- Microsoft Teams meeting tabs/apps: https://learn.microsoft.com/en-us/microsoftteams/platform/apps-in-teams-meetings/build-tabs-for-meeting
- Microsoft Teams transcript APIs: https://learn.microsoft.com/microsoftteams/platform/graph-api/meeting-transcripts/overview-transcripts?view=graph-rest-1.0
- Microsoft Teams real-time media bots: https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/real-time-media-concepts
- Microsoft Teams Meeting AI Insights: https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/meeting-transcripts/meeting-insights
