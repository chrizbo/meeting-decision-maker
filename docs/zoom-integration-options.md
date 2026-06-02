# Zoom Integration Options

Current recommendation: keep the human-operated shared dashboard as the product surface, and use the Zoom App wrapper to launch the board, request RTMS, and create meeting sessions. Zoom's Apps SDK supports getting meeting context, participant context, app sharing, invitations, and RTMS controls, but `startRTMS` may be blocked until the app passes Zoom marketplace verification or entitlement review.

## Option 1: Human-Shared Dashboard First

The host opens the dashboard in a browser and screen-shares it in Zoom. The dashboard creates or loads a hard-to-guess meeting URL and uses mock transcript playback while we tune board behavior.

This remains useful because it isolates the core product question: does a live decision board help the host facilitate the meeting?

Build now:

- Static or local web app.
- Fake Zoom meeting name, host, and attendees.
- Mock transcript playback from VTT/TXT.
- Host confirmation for decisions.
- Audit tray for rejected or dismissed items.

## Option 2: Zoom App Launcher + Dashboard Link

A Zoom App can run inside the Zoom client. When the host opens it during a meeting, it can call the Zoom Apps SDK to read meeting context and participants, create a backend meeting session, and show a copyable dashboard URL.

Useful SDK capabilities to design around:

- `getMeetingContext()` returns basic meeting information, with host/co-host role limits in the SDK docs.
- `getMeetingParticipants()` can return current participants for host/co-host use.
- `shareApp({ action: "start" })` can screen-share the current app surface.
- `sendAppInvitation` / `sendAppInvitationToAllParticipants` can invite others to open the app where appropriate.
- `openUrl()` can open an external browser URL if the host wants the dashboard outside the Zoom app frame.

What this means for our desired flow:

1. Host joins Zoom meeting.
2. Host opens Room Clarity from Zoom Apps.
3. App reads meeting context and asks backend for a session URL like `/m/<unguessable-id>`.
4. Host can either share the Zoom App surface directly or open the dashboard URL in a browser and screen-share that.
5. Participants can follow the URL if the host shares it, but agents remain page elements, not attendees.

## Option 3: Zoom App + RTMS Transcript Stream

The Zoom App can request Realtime Media Streams when Zoom exposes the RTMS APIs to the app. The Zoom Apps SDK currently lists `startRTMS`, `stopRTMS`, `pauseRTMS`, `resumeRTMS`, `getRTMSStatus`, and `onRTMSStatusChange`. Zoom's RTMS materials describe access to live audio, video, chat, screen sharing, and transcript data over WebSocket, with host/admin controls and disclosure moments.

Likely architecture:

1. Zoom App starts or requests RTMS for the meeting.
2. Zoom sends RTMS webhook events to our backend.
3. Backend connects to the RTMS stream with `@zoom/rtms` and receives transcript and meeting-chat data.
4. Backend normalizes transcript callbacks and chat messages into cue objects and sends them through the Gemini cue analyzer with rolling meeting-feed and board-state context.
5. Shared dashboard can poll matching RTMS session state today; WebSocket or Server-Sent Events can replace polling later.

Current backend route:

```text
POST /api/zoom/rtms-webhook
```

Inspection routes:

```text
GET /api/rtms/sessions
GET /api/rtms/sessions/:id
```

Open implementation checks:

- Resolve Zoom Marketplace verification / entitlement requirements for `zoomSdk.startRTMS()` if the SDK returns `40316`.
- Confirm host/admin approval behavior for meetings outside our account.
- Decide whether the Zoom App view is the operator UI, the screen-share UI, or just the launcher.
- Add account-based access before sensitive real meetings: Google login, Zoom login, or workspace SSO.

## Option 4: Post-Meeting Import Path

This remains useful but should follow the live-board prototype. The host uploads a Zoom/Wisper VTT/TXT transcript after the meeting, and the app extracts decisions, risks, actions, and agent notes into the same dashboard model.

This is the easiest path technically, but it does not test whether live facilitation changes the meeting.

## Recommended Integration Sequence

1. Finish static shared-screen dashboard behavior with mock transcript fixtures. Done.
2. Move extraction into a structured mock LLM output contract. Done.
3. Add a backend that creates meeting sessions and serves unguessable dashboard URLs. Done.
4. Add a Zoom App shell that reads meeting context and launches/opens the dashboard. Done.
5. Add Gemini cue analysis using skills in `skills/`. Done.
6. Add RTMS webhook ingestion and transcript session state. Done.
7. Resolve Zoom marketplace verification for `startRTMS`.
8. Add account access controls and durable meeting-state storage before sensitive production use.

## RTMS Sample App Learnings

Zoom's RTMS sample app catalog is most useful as a set of patterns rather than a single reference app. For Room Clarity, the highest-signal examples are:

- `rtms-quickstart-js`: the direct `@zoom/rtms` SDK path. It creates one client per RTMS stream, listens for `meeting.rtms_started`, joins with the webhook payload, handles `meeting.rtms_stopped`, and uses `onTranscriptData` for live transcript text. Current Room Clarity code also parses chat-shaped webhook/raw RTMS payloads and will register `onChatData` if a future SDK exposes it.
- `transcript/save_transcript_sdk`: a persistence pattern. It writes transcript callbacks to VTT, SRT, and TXT with meeting-scoped folders. We do not need local transcript files in production yet, but the VTT/SRT/TXT normalization is useful for export and debugging.
- `transcript/send_transcript_to_openai_js`: a larger app pattern. It wraps webhooks and active RTMS connections in manager classes, configures transcript media explicitly, logs redacted RTMS config, and forwards transcript events into an LLM handler.
- Zoom Apps notetaker/customer-support examples: a product-shape pattern. They keep RTMS ingestion in the backend and let the Zoom App/frontend consume derived meeting intelligence, which matches Room Clarity's decision-board approach.

What we should carry forward:

- Keep the current direct SDK integration for the MVP because it is smaller than the sample `RTMSManager` stack and already fits the existing Node server.
- Treat `rtms_stream_id` as the operational connection key and meeting/session UUID as the dashboard lookup key.
- Request RTMS methods explicitly in `zoomSdk.config()` so `startRTMS`, `stopRTMS`, status, pause/resume, and status-change events show up once Zoom grants the app access.
- Track RTMS lifecycle events such as `rtms.start_failed`, `rtms.concurrency_limited`, and interruptions in backend session state, not only in logs.
- Consider adding VTT/SRT/TXT transcript export later from the normalized cue model rather than adopting sample file writes directly.

## Sources

- Zoom RTMS sample app catalog: https://developers.zoom.us/docs/rtms/sample-apps/
- Zoom RTMS quickstart sample: https://github.com/zoom/rtms-quickstart-js
- Zoom RTMS transcript samples: https://github.com/zoom/rtms-samples/tree/main/transcript
- Zoom Apps SDK TypeDoc: https://appssdk.zoom.us/classes/ZoomSdk.ZoomSdk.html
- Zoom Apps SDK package: https://github.com/zoom/appssdk
- Zoom RTMS overview: https://www.zoom.com/en/realtime-media-streams/
- Zoom RTMS SDK docs: https://zoom.github.io/rtms/
- Zoom RTMS technical library: https://library.zoom.com/zoom-workplace/zoom-meetings/securing-zoom-meetings-explainer/zoom-realtime-media-streams
