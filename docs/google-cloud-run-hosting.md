# Google Cloud Run Hosting

## Recommended First Hosting Shape

Use a new Google Cloud project with Cloud Run as the first runtime.

Cloud Run is a good fit for the current prototype because it gives us:

- A public HTTPS URL for Zoom app development and webhook callbacks.
- Container deployment without managing servers.
- A simple path from static prototype to API-backed live service.
- Room to add WebSocket/SSE-style live updates, Firestore state, Secret Manager, and background workers later.

## Initial Services

Start with one Cloud Run service:

- `meeting-decision-maker-web`: serves the board, creates meeting sessions, runs Gemini cue analysis, receives signed Zoom RTMS webhooks, and maintains in-memory RTMS session state.

Add these later when the product behavior is stable:

- Firestore or Cloud SQL for durable meeting/session state.
- Secret Manager for Zoom and LLM credentials.
- Pub/Sub or Cloud Tasks for transcript/LLM processing.
- A separate worker service if LLM calls or RTMS processing become long-running.

## Create a New Project

Choose a globally unique project id, for example:

```bash
PROJECT_ID=meeting-decision-maker-prod
REGION=us-central1
```

Create and configure the project:

```bash
gcloud projects create "$PROJECT_ID" --name="Meeting Decision Maker"
gcloud config set project "$PROJECT_ID"
gcloud config set run/region "$REGION"
```

Attach billing in the Google Cloud Console or with `gcloud beta billing projects link` if you know the billing account id.

Enable the APIs needed for the first deploy:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com firestore.googleapis.com
```

Create the default Firestore database in Native mode for durable meeting sessions:

```bash
gcloud firestore databases create \
  --database="(default)" \
  --location="$REGION"
```

## Deploy

From `meeting-decision-maker-repo`:

```bash
gcloud run deploy meeting-decision-maker-web \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated
```

For the current Zoom/Gemini path, deploy with all secret-backed variables attached:

```bash
gcloud run deploy meeting-decision-maker-web \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest,ZOOM_WEBHOOK_SECRET_TOKEN=zoom-webhook-secret-token:latest,ZOOM_CLIENT_ID=zoom-client-id:latest,ZOOM_CLIENT_SECRET=zoom-client-secret:latest,ZOOM_REDIRECT_URI=zoom-redirect-uri:latest
```

Use `--update-secrets` with the full set above when redeploying from local source so a later deploy does not accidentally remove previously attached secret-backed environment variables.

After deploy, check:

```bash
curl https://YOUR-CLOUD-RUN-URL/api/healthz
```

The board should be available at the service root and at meeting URLs like:

```text
https://YOUR-CLOUD-RUN-URL/m/demo-session
```

Enable Firestore-backed sessions in Cloud Run:

```bash
gcloud run services update meeting-decision-maker-web \
  --region "$REGION" \
  --update-env-vars=SESSION_STORE=firestore,FIRESTORE_SESSIONS_COLLECTION=meetingSessions
```

For local service testing, `npm start` uses port `8787` unless `PORT` is set. Cloud Run injects `PORT`, and the Docker image defaults to `8080`. Local development defaults to in-memory sessions; set `SESSION_STORE=firestore` only when you have Google application credentials available locally.

## Zoom App Path

Use the Cloud Run URL as the Zoom App development URL once HTTPS is available.

Current backend routes:

- `POST /api/sessions`: create a dashboard session for a meeting.
- `GET /api/sessions/:id`: fetch session metadata.
- `POST /api/zoom/rtms-webhook`: validate Zoom webhook URL challenges, verify signed webhook events, and handle RTMS start/stop/transcript events.
- `GET /api/rtms/sessions`: list in-memory RTMS sessions.
- `GET /api/rtms/sessions/:id`: inspect transcript and Gemini-derived board state for one RTMS session.

The Zoom App launcher calls the Zoom Apps SDK, reads meeting context, posts to `/api/sessions`, opens or shares the returned dashboard URL, and attempts `zoomSdk.startRTMS()` when Zoom exposes that API. Browser dashboards do not run the Zoom Apps SDK; they can view mock playback and poll matching RTMS session state from the backend.
