# Meeting Decision Maker

A prototype meeting decision assistant for capturing decisions from meeting transcripts and surfacing red-team agent suggestions in a shared meeting page.

## Current Direction

Start with a human-shared web page using mock transcript playback, then use the Zoom App as the launcher for RTMS when Zoom grants the app access to `startRTMS`.

## Contents

- `docs/zoom-meeting-decision-making-plan.md`: product and architecture plan
- `docs/zoom-integration-options.md`: Zoom App, dashboard link, and RTMS integration options
- `docs/zoom-app-installation.md`: Zoom App creation, development install, and RTMS setup path
- `docs/meeting-briefs-continuity-plan.md`: post-meeting briefs, carry-forward context, and meeting-series continuity plan
- `docs/cross-platform-integrations.md`: Google Meet, Microsoft Teams, and platform-neutral adapter notes
- `docs/google-cloud-run-hosting.md`: Google Cloud project and Cloud Run deployment instructions
- `docs/auth-authorization-plan.md`: Zoom-first authentication and app-owned authorization plan
- `docs/security-launch-plan.md`: security and privacy launch plan for external users
- `docs/zoom-marketplace-test-plan.md`: Zoom Marketplace review test plan
- `docs/future-specs/recap-drafting.md`: future recap drafting and brief preview workflow
- `docs/future-specs/meeting-series-linking.md`: future meeting-series linking and carry-forward context workflow
- `docs/future-specs/meeting-library.md`: future Meeting Library concept for accessible meetings, briefs, and series
- `skills/`: portable red-team agent skills and meeting-tool configs
- `sample-transcripts/`: synthetic transcript fixtures for prototyping
- `fixtures/`: mock structured LLM outputs loaded by the static app
- `schemas/`: JSON schemas for meeting state and LLM output contracts
- `evals/`: prompt and extraction eval harness for transcript analysis

## Prototype Agents

The first three red-team agents are:

- Assumptions Challenge
- Pre-Mortem
- Argument Dissection

Each skill folder includes:

- `SKILL.md` for CLI/Codex-style use
- `agent.yaml` for the meeting tool to load triggers, priority rules, and output fields
- `references/rtt-source.md` with source-method notes
- `agents/openai.yaml` with UI metadata

## Transcript Fixtures

The prototype should support both `.vtt` and `.txt` transcript imports. The repo includes a synthetic `.vtt` fixture for safe check-in. VTT imports should preserve timestamps and speaker labels when present. TXT imports may not include timestamps or speakers, so those fields should be optional.


## Static Prototype

The shared-screen prototype is a static HTML/CSS/JavaScript app:

- `index.html`: meeting board interface
- `styles.css`: screen-share layout and visual design
- `app.js`: fake Zoom meeting context, timed transcript playback, decision capture, and agent queue behavior

The app tries to load `fixtures/mock-llm-output.json`, so local hosting is preferred. Open `index.html` directly only when you want the browser fallback rules.

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Cloud Run Service

The repo also includes a tiny Node service so the prototype can be deployed as a live HTTPS app on Google Cloud Run.

```bash
npm start
```

Then visit `http://localhost:8787` or create a session with `POST /api/sessions` and open the returned dashboard path.

The service currently provides:

- `GET /api/healthz`
- `GET /api/zoom/oauth/callback`
- `POST /api/sessions`, returning a public dashboard path with a scoped access token
- `GET /api/sessions/:id`, requiring a valid dashboard token for token-protected sessions
- `POST /api/zoom/rtms-webhook`
- `GET /api/rtms/sessions`
- `GET /api/rtms/sessions/:id`

See `docs/google-cloud-run-hosting.md` for the new Google Cloud project and deploy path.

## Zoom App Setup

The Zoom-native path is a Zoom App launcher that runs inside the Zoom desktop client, reads meeting context with the Zoom Apps SDK, creates a backend session, gives the host a shareable dashboard URL, and attempts to start RTMS when the Zoom SDK exposes `startRTMS`.

Install path:

1. Deploy this service to Cloud Run so Zoom has a public HTTPS URL.
2. Create a Zoom App in the Zoom App Marketplace.
3. Map `roomclarity.com` to the Cloud Run service.
4. Set the app home/development URL to `https://roomclarity.com/app`.
5. Add the `https://roomclarity.com` origin to Zoom's allow list fields.
6. Install the development app into your Zoom account.
7. Launch it from the Zoom desktop app during a test meeting.

The current codebase includes the Zoom Apps SDK launcher path, OAuth callback, RTMS webhook receiver, Gemini cue analysis, browser dashboard polling for RTMS session state, and marketplace support pages. Full setup notes are in `docs/zoom-app-installation.md`.

Cloud Run should be deployed with all active secrets attached. The current required Zoom/Gemini environment variables are:

- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`
- `ZOOM_REDIRECT_URI`
- `ZOOM_WEBHOOK_SECRET_TOKEN`
- `GEMINI_API_KEY`
- `PUBLIC_BASE_URL=https://roomclarity.com`
- `ROOM_CLARITY_ADMIN_TOKEN` for service-admin inspection routes such as `GET /api/rtms/sessions`

Zoom RTMS uses the same Zoom client credentials by default. If your RTMS app has separate credentials, set:

- `ZM_RTMS_CLIENT`
- `ZM_RTMS_SECRET`

Cloud Run can persist meeting sessions in Firestore by setting:

- `SESSION_STORE=firestore`
- `FIRESTORE_SESSIONS_COLLECTION=meetingSessions`

Local development defaults to in-memory sessions. Use `SESSION_STORE=firestore npm start` only when you have Google application credentials configured locally.

## LLM Path

The static prototype still loads `fixtures/mock-llm-output.json` when Gemini is not configured. The live service can invoke Gemini using the portable skills in `skills/` as the instruction layer. See `docs/llm-integration-notes.md`.

The Node service can now invoke Gemini for live cue analysis. By default it uses `gemini-2.5-flash-lite`, which is the fast/cost-efficient Gemini API option. Override it with `GEMINI_MODEL` when needed.

Gemini setup:

1. Create a Gemini API key in Google AI Studio.
2. Start the local service with the key:

   ```bash
   GEMINI_API_KEY=your_key npm start
   ```

3. Open `http://localhost:8787`.
4. Confirm the analysis path is enabled:

   ```bash
   curl http://localhost:8787/api/analysis/config
   ```

   The response should include `"enabled":true`.

When `GEMINI_API_KEY` is present, the browser sends each newly played transcript cue to `POST /api/analyze-cue` with a short rolling transcript window and compact board state. That state includes already captured decisions, risks, actions, and open agent issues with IDs so Gemini can update existing items when the latest transcript adds nuance. When the key is absent, the app keeps using the mock fixture and browser fallback rules.

Evaluate the current prompt path:

```bash
npm run eval
```

The default eval replays the synthetic product decision transcript against the curated mock LLM fixture. To score a live local Gemini-backed service, start the app with `GEMINI_API_KEY`, then run:

```bash
node evals/run-evals.js --live http://localhost:8787
```

## RTMS Transcript Ingestion

The Zoom RTMS webhook endpoint is:

```text
POST /api/zoom/rtms-webhook
```

When Zoom sends `meeting.rtms_started`, the service creates an `@zoom/rtms` client, joins the stream, and listens for `onTranscriptData`. Transcript callbacks are normalized into the same cue shape used by mock playback, sent to Gemini with the last 90 seconds of transcript context, and accumulated in in-memory RTMS meeting state.

Incoming Zoom webhook events are verified with `ZOOM_WEBHOOK_SECRET_TOKEN`, `x-zm-request-timestamp`, and `x-zm-signature`. Non-validation webhook events must also be inside the configured freshness window, which defaults to five minutes. URL validation events use the same secret token to return Zoom's encrypted validation token.

Session metadata and RTMS session reads have a small in-memory per-client rate limit to slow URL and token guessing. This is a starter guard for the single-service prototype; production multi-instance deployments should move abuse controls to a shared limiter or edge protection layer.

Inside the Zoom client, the meeting controls menu shows a **Start RTMS** button and an RTMS status line. The app attempts to call `zoomSdk.startRTMS()` after Zoom SDK initialization. If Zoom blocks the API with `40316` / marketplace verification errors, the backend remains ready but live RTMS cannot start until Zoom grants the app access.

Opening the dashboard in a normal browser is supported for viewing and mock transcript testing. The Zoom Apps SDK does not run in a normal browser, so browser mode does not start RTMS. Browser dashboards poll matching `/api/rtms/sessions/:id` records and will display RTMS transcript/analysis state when a matching server-side RTMS session exists.

Inspect RTMS sessions:

```bash
curl -H "x-admin-token: $ROOM_CLARITY_ADMIN_TOKEN" "$SERVICE_URL/api/rtms/sessions"
curl "$SERVICE_URL/api/rtms/sessions/MEETING_OR_STREAM_ID?t=DASHBOARD_TOKEN"
```

For local route testing, the webhook also accepts transcript-like payloads with `payload.text`, `payload.transcript`, `payload.caption`, or `payload.message`.
