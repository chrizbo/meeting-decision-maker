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

- `meeting-decision-maker-web`: serves the board, creates meeting sessions, and exposes placeholder Zoom webhook routes.

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
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

## Deploy

From `meeting-decision-maker-repo`:

```bash
gcloud run deploy meeting-decision-maker-web \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated
```

After deploy, check:

```bash
curl https://YOUR-CLOUD-RUN-URL/healthz
```

The board should be available at the service root and at meeting URLs like:

```text
https://YOUR-CLOUD-RUN-URL/m/demo-session
```

For local service testing, `npm start` uses port `8787` unless `PORT` is set. Cloud Run injects `PORT`, and the Docker image defaults to `8080`.

## Zoom App Path

Use the Cloud Run URL as the Zoom App development URL once HTTPS is available.

Near-term backend routes:

- `POST /api/sessions`: create a dashboard session for a meeting.
- `GET /api/sessions/:id`: fetch session metadata.
- `POST /api/zoom/rtms-webhook`: placeholder for RTMS webhook events.

Next implementation step: add a small Zoom App launcher page that calls the Zoom Apps SDK, reads meeting context, posts to `/api/sessions`, and opens or shares the returned dashboard URL.
