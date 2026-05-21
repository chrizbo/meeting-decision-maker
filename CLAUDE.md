# Room Clarity — Claude Code Guide

## Deploy

```bash
gcloud run deploy meeting-decision-maker-web \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars=PUBLIC_BASE_URL=https://roomclarity.com \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest,OPENAI_API_KEY=openai-api-key:latest,ZOOM_WEBHOOK_SECRET_TOKEN=zoom-webhook-secret-token:latest,ZOOM_CLIENT_ID=zoom-client-id:latest,ZOOM_CLIENT_SECRET=zoom-client-secret:latest,ZOOM_REDIRECT_URI=zoom-redirect-uri:latest,ROOM_CLARITY_ADMIN_TOKEN=room-clarity-admin-token:latest
```

After deploy: `curl https://roomclarity.com/api/healthz`

Full setup and Firestore/domain instructions in `docs/google-cloud-run-hosting.md`.

## RTMS Timestamp Gotcha

Zoom RTMS webhook transcript payloads have three timestamp fields:

- `start_time` — Unix ms timestamp for **this specific transcript segment**. Use this.
- `end_time` — Unix ms timestamp for when this segment ended. Use this.
- `timestamp` — Generic event-level timestamp. **Same value for every cue in a batch.** Do not use as the primary cue time — all cues will collapse to 00:00.

The server uses `payload.start_time || payload.timestamp || event.event_ts` (in that priority order) in `handleRtmsWebhookEvent`. The SDK path passes `timestamp` directly as a nanosecond value, which is fine because it is cue-specific.

If all transcript entries show 00:00, check whether `start_time` is present on incoming webhook payloads (`console.log` in `ingestRtmsTranscript` logs the first raw timestamp).

## Architecture

- `server.js` — Node HTTP server. Handles Zoom webhooks, RTMS session state (in-memory), LLM cue analysis, Firestore persistence.
- `app.js` — Client-side board UI. Polls `/api/rtms/sessions/:id` every 4 s during live meetings.
- `styles.css` — All UI styles.
- `evals/` — Prompt eval harness. Run with `npm run eval:live`.
- `docs/` — Design docs, hosting guide, Zoom integration notes.
