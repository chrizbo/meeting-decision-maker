# Room Clarity — Claude Code Guide

## Codebase orientation

**Three files do almost everything:**

- `server.js` — Node HTTP server (no framework). Handles Zoom webhooks, RTMS session state (in-memory or Firestore), LLM cue analysis, OAuth, and static file serving.
- `app.js` — All client-side UI logic. Single `state` object; `renderAll()` re-renders from it. Polls `/api/rtms/sessions/:id` every 4 s during live meetings via `applyRtmsSessionState()`.
- `styles.css` — All styles; no build step.

**Supporting directories:**

- `evals/` — Prompt eval harness. See `evals/README.md` for full usage. Cases live in `evals/cases/`.
- `fixtures/` — Mock LLM output (`mock-llm-output.json`) and a demo VTT transcript used for fixture-mode playback.
- `sample-transcripts/` — VTT/TXT files users can upload to test transcript playback.
- `skills/` — LLM skill definitions (prompt templates) used by the analysis pipeline.
- `schemas/` — JSON schemas for LLM output validation.
- `docs/` — Design docs, hosting guide, Zoom integration notes. Read these before making architectural changes (see key docs below).

## Key docs to read first

| Doc | When to read it |
|-----|----------------|
| `docs/google-cloud-run-hosting.md` | Deploying, adding secrets, Firestore, domain setup |
| `docs/llm-integration-notes.md` | Changing the analysis prompt, adding models, eval workflow |
| `docs/zoom-app-installation.md` | Zoom App manifest, OAuth, marketplace submission |
| `docs/github-integration.md` | GitHub OAuth App setup, proxy routes, MCP server direction |
| `docs/atlassian-integration.md` | Jira + Confluence OAuth setup, proxy routes, config concepts |
| `docs/security-launch-plan.md` | Before touching auth, webhooks, or session tokens |
| `docs/product-principles.md` | Before adding features — what this product is and isn't |

## Running locally

```bash
npm start          # starts server on port 8787 (or $PORT)
```

Needs at least one LLM key to do live analysis. Fixture playback (the demo VTT) works without any keys.

```bash
GEMINI_API_KEY=... npm start          # Gemini path (default model: gemini-2.5-flash-lite)
OPENAI_API_KEY=... LLM_PROVIDER=openai npm start   # OpenAI path
```

Sessions are in-memory by default. Add `SESSION_STORE=firestore` only when you have Google application credentials locally.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port (default 8787 locally, 8080 in Docker) |
| `PUBLIC_BASE_URL` | Canonical URL used in dashboard links and OAuth pages |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | Gemini analysis |
| `GEMINI_MODEL` | Override Gemini model (default: gemini-2.5-flash-lite) |
| `OPENAI_API_KEY` | OpenAI analysis |
| `OPENAI_MODEL` | Override OpenAI model |
| `LLM_PROVIDER` | `openai` to use OpenAI instead of Gemini |
| `ZOOM_WEBHOOK_SECRET_TOKEN` | Verifies signed Zoom webhook events |
| `ZOOM_CLIENT_ID` / `ZOOM_CLIENT_SECRET` / `ZOOM_REDIRECT_URI` | Zoom OAuth |
| `ZM_RTMS_CLIENT` / `ZM_RTMS_SECRET` | RTMS SDK credentials |
| `ROOM_CLARITY_ADMIN_TOKEN` | Protects `/api/rtms/sessions` list route |
| `SESSION_STORE` | `firestore` for durable sessions; default is in-memory |
| `FIRESTORE_SESSIONS_COLLECTION` | Firestore collection name for sessions |
| `RTMS_POLL_INTERVAL_MS` | How often the client polls for RTMS state (ms) |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID (enables GitHub integration) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret (keep in Secret Manager) |
| `ATLASSIAN_CLIENT_ID` | Atlassian OAuth 2.0 app client ID (enables Jira + Confluence integration) |
| `ATLASSIAN_CLIENT_SECRET` | Atlassian OAuth 2.0 app secret (keep in Secret Manager) |

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/healthz` | Health check |
| POST | `/api/sessions` | Create a dashboard session for a meeting |
| GET | `/api/sessions/:id` | Fetch session metadata |
| POST | `/api/analyze-cue` | Run LLM analysis on a transcript cue (used by evals) |
| GET | `/api/analysis/config` | Return current analysis provider config |
| GET | `/api/zoom/oauth/callback` | Handle Zoom OAuth code exchange |
| GET | `/api/rtms/sessions` | List in-memory RTMS sessions (requires `x-admin-token`) |
| GET | `/api/rtms/sessions/:id` | Full RTMS session state including transcript (requires dashboard token) |
| POST | `/api/zoom/rtms-webhook` | Receive signed Zoom RTMS webhook events |
| GET | `/api/github/oauth/start` | Redirect to GitHub OAuth authorize page |
| GET | `/api/github/oauth/callback` | Exchange GitHub code for token; render popup-closing page |
| POST | `/api/github/proxy` | Proxy authenticated GitHub REST API calls (rate-limited, path-allowlisted) |
| GET | `/api/atlassian/oauth/start` | Redirect to Atlassian OAuth authorize page |
| GET | `/api/atlassian/oauth/callback` | Exchange Atlassian code for token; resolve cloud site; render popup-closing page |
| POST | `/api/atlassian/proxy` | Proxy authenticated Jira REST API calls (rate-limited, path-allowlisted) |
| POST | `/api/confluence/proxy` | Proxy authenticated Confluence REST API calls (rate-limited, path-allowlisted) |

## Deploy

```bash
gcloud run deploy meeting-decision-maker-web \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars=PUBLIC_BASE_URL=https://roomclarity.com \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest,OPENAI_API_KEY=openai-api-key:latest,ZOOM_WEBHOOK_SECRET_TOKEN=zoom-webhook-secret-token:latest,ZOOM_CLIENT_ID=zoom-client-id:latest,ZOOM_CLIENT_SECRET=zoom-client-secret:latest,ZOOM_REDIRECT_URI=zoom-redirect-uri:latest,ROOM_CLARITY_ADMIN_TOKEN=room-clarity-admin-token:latest,GITHUB_CLIENT_ID=github-client-id:latest,GITHUB_CLIENT_SECRET=github-client-secret:latest,ATLASSIAN_CLIENT_ID=atlassian-client-id:latest,ATLASSIAN_CLIENT_SECRET=atlassian-client-secret:latest
```

Always use `--update-secrets` with the full set so a redeploy doesn't silently remove previously attached secrets.

After deploy: `curl https://roomclarity.com/api/healthz`

Full setup (Firestore, domain mapping, eval jobs): `docs/google-cloud-run-hosting.md`.

## Evals

```bash
npm run eval                          # fixture baseline (no server needed)
npm run eval:live                     # against https://roomclarity.com
EVAL_LIVE_URL=http://localhost:8787 node evals/run-evals.js --live  # local
```

See `evals/README.md` for judge mode, model sweeps, and Cloud Run Job setup.

## RTMS timestamp gotcha

Zoom RTMS webhook transcript payloads have three timestamp fields:

- `start_time` — Unix ms timestamp for **this specific transcript segment**. Use this.
- `end_time` — Unix ms timestamp for when this segment ended. Use this.
- `timestamp` — Generic event-level timestamp. **Same for every cue in a batch.** Do not use as the primary cue time — all cues will collapse to 00:00.

The SDK path (`onTranscriptData`) provides timestamps in **microseconds** (confirmed empirically: values ~1.779×10¹⁵ for 2026). Pass `timestampUnit: 'us'` — **not** `'ns'`. Using `'ns'` divides by 1e9 instead of 1e6, making all relative diffs sub-millisecond → all times display as 00:00.

If all transcript entries show 00:00, check Cloud Run logs for lines starting with `RTMS cue[0]` — they show the raw timestamp, inferred unit, and computed start seconds.

## Debugging live RTMS sessions

Pull logs for recent RTMS activity:

```bash
gcloud logging read 'resource.type="cloud_run_revision" AND textPayload=~"RTMS"' \
  --project gen-lang-client-0754444896 \
  --limit 30 \
  --format "value(textPayload)" \
  --freshness 15m
```

Inspect a live session's transcript and board state (requires admin token):

```bash
TOKEN="$(gcloud secrets versions access latest --secret=room-clarity-admin-token)"
curl -s -H "x-admin-token: $TOKEN" https://roomclarity.com/api/rtms/sessions | jq '.sessions[].id'
curl -s https://roomclarity.com/api/rtms/sessions/<id>?token=<dashboard-token> | jq '{transcript: .transcript | length, decisions: .decisions | length}'
```
