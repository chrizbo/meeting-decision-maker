# Meeting Decision Maker

A prototype meeting decision assistant for capturing decisions from meeting transcripts and surfacing red-team agent suggestions in a shared meeting page.

## Current Direction

Start with Option A: a human-shared web page using mock transcript playback. After the decision-board format feels right, move toward Option C: a Zoom App plus RTMS integration.

## Contents

- `docs/zoom-meeting-decision-making-plan.md`: product and architecture plan
- `docs/zoom-integration-options.md`: Zoom App, dashboard link, and RTMS integration options
- `docs/zoom-app-installation.md`: Zoom App creation, development install, and RTMS setup path
- `docs/cross-platform-integrations.md`: Google Meet, Microsoft Teams, and platform-neutral adapter notes
- `docs/google-cloud-run-hosting.md`: Google Cloud project and Cloud Run deployment instructions
- `skills/`: portable red-team agent skills and meeting-tool configs
- `sample-transcripts/`: synthetic transcript fixtures for prototyping
- `fixtures/`: mock structured LLM outputs loaded by the static app
- `schemas/`: JSON schemas for meeting state and LLM output contracts

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

Then visit `http://localhost:8787` or `http://localhost:8787/m/demo-session`.

The service currently provides:

- `GET /api/healthz`
- `GET /api/zoom/oauth/callback`
- `POST /api/sessions`
- `GET /api/sessions/:id`
- `POST /api/zoom/rtms-webhook`

See `docs/google-cloud-run-hosting.md` for the new Google Cloud project and deploy path.

## Zoom App Setup

The first Zoom-native step is a Zoom App launcher that runs inside the Zoom desktop client, reads meeting context with the Zoom Apps SDK, creates a backend session, and gives the host a shareable dashboard URL.

Install path:

1. Deploy this service to Cloud Run so Zoom has a public HTTPS URL.
2. Create a Zoom App in the Zoom App Marketplace.
3. Set the app home/development URL to the Cloud Run URL.
4. Add the Cloud Run origin to Zoom's allow list fields.
5. Install the development app into your Zoom account.
6. Launch it from the Zoom desktop app during a test meeting.

The current codebase includes a minimal Zoom Apps SDK launcher path and development OAuth callback. Full setup notes are in `docs/zoom-app-installation.md`.

Zoom OAuth uses these environment variables in Cloud Run:

- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`
- `ZOOM_REDIRECT_URI`

Cloud Run can persist meeting sessions in Firestore by setting:

- `SESSION_STORE=firestore`
- `FIRESTORE_SESSIONS_COLLECTION=meetingSessions`

Local development defaults to in-memory sessions. Use `SESSION_STORE=firestore npm start` only when you have Google application credentials configured locally.

## LLM Path

The static prototype now loads `fixtures/mock-llm-output.json` as the first version of the LLM output contract, with simple JavaScript keyword rules as a direct-file fallback. The intended future implementation is to invoke real LLM workers using the portable skills in `skills/` as the instruction layer. See `docs/llm-integration-notes.md`.

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
