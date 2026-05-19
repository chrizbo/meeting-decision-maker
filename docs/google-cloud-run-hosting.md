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
- `meeting-decision-maker-evals`: optional Cloud Run Job that runs prompt evals against the deployed service.

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

For the current Zoom/Gemini path, deploy with all secret-backed variables attached and set the canonical public URL:

```bash
gcloud run deploy meeting-decision-maker-web \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars=PUBLIC_BASE_URL=https://roomclarity.com \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest,ZOOM_WEBHOOK_SECRET_TOKEN=zoom-webhook-secret-token:latest,ZOOM_CLIENT_ID=zoom-client-id:latest,ZOOM_CLIENT_SECRET=zoom-client-secret:latest,ZOOM_REDIRECT_URI=zoom-redirect-uri:latest,ROOM_CLARITY_ADMIN_TOKEN=room-clarity-admin-token:latest
```

Use `--update-secrets` with the full set above when redeploying from local source so a later deploy does not accidentally remove previously attached secret-backed environment variables.

After deploy, check:

```bash
curl https://roomclarity.com/api/healthz
```

The homepage should be available at the service root. The board should be available at `/app` and meeting URLs like:

```text
https://roomclarity.com/app
https://roomclarity.com/m/demo-session
```

Enable Firestore-backed sessions in Cloud Run:

```bash
gcloud run services update meeting-decision-maker-web \
  --region "$REGION" \
  --update-env-vars=SESSION_STORE=firestore,FIRESTORE_SESSIONS_COLLECTION=meetingSessions
```

For local service testing, `npm start` uses port `8787` unless `PORT` is set. Cloud Run injects `PORT`, and the Docker image defaults to `8080`. Local development defaults to in-memory sessions; set `SESSION_STORE=firestore` only when you have Google application credentials available locally.

## Service Admin Token

The RTMS session list route is an internal inspection endpoint and requires `ROOM_CLARITY_ADMIN_TOKEN` in the `x-admin-token` header.

Create the secret:

```bash
ROOM_CLARITY_ADMIN_TOKEN="$(openssl rand -hex 32)"
printf "%s" "$ROOM_CLARITY_ADMIN_TOKEN" | \
  gcloud secrets create room-clarity-admin-token \
  --data-file=-
```

Grant the Cloud Run runtime service account access to the secret. Replace the service account if the service is configured to run as something other than the default Compute Engine service account:

```bash
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
gcloud secrets add-iam-policy-binding room-clarity-admin-token \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role=roles/secretmanager.secretAccessor
```

Attach the secret to Cloud Run:

```bash
gcloud run services update meeting-decision-maker-web \
  --region "$REGION" \
  --update-secrets=ROOM_CLARITY_ADMIN_TOKEN=room-clarity-admin-token:latest
```

Verify the protected route:

```bash
curl -i https://roomclarity.com/api/rtms/sessions

TOKEN="$(gcloud secrets versions access latest --secret=room-clarity-admin-token)"
curl -i -H "x-admin-token: $TOKEN" https://roomclarity.com/api/rtms/sessions
```

## Cloud Prompt Evals

The same container image includes `evals/`, so Cloud Run Jobs can run the prompt eval harness without storing a Gemini key locally. The live eval posts transcript cues to the deployed `/api/analyze-cue` endpoint.

Create or update the eval job from `meeting-decision-maker-repo`:

```bash
gcloud run jobs deploy meeting-decision-maker-evals \
  --source . \
  --region "$REGION" \
  --set-env-vars=EVAL_LIVE_URL=https://roomclarity.com \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest \
  --max-retries=0 \
  --command=npm \
  --args=run,eval:live
```

The `GEMINI_API_KEY` secret is attached for parity with the web service. The current live eval path uses the deployed service's `/api/analyze-cue`, so the service itself must also have `GEMINI_API_KEY` attached and be running the prompt/skill version you want to evaluate.

Run the job:

```bash
gcloud run jobs execute meeting-decision-maker-evals \
  --region "$REGION" \
  --wait
```

View the latest execution logs:

```bash
gcloud run jobs executions list \
  --job meeting-decision-maker-evals \
  --region "$REGION" \
  --limit 5
```

For quick local parity, run:

```bash
EVAL_LIVE_URL=https://roomclarity.com npm run eval:live
```

## Custom Domain: roomclarity.com

Map `roomclarity.com` to the Cloud Run service after the first deploy:

```bash
gcloud beta run domain-mappings create \
  --service meeting-decision-maker-web \
  --domain roomclarity.com \
  --region "$REGION"
```

Google Cloud will return DNS records to add at the registrar or DNS host for `roomclarity.com`. Add those records, then wait for the managed certificate to become active.

Verify the mapping:

```bash
gcloud beta run domain-mappings describe roomclarity.com --region "$REGION"
curl https://roomclarity.com/api/healthz
```

Once the domain responds, keep `PUBLIC_BASE_URL=https://roomclarity.com` on the service. This makes dashboard links and OAuth success pages use the branded domain even if a request reaches the underlying Cloud Run URL.

## Zoom App Path

Use `https://roomclarity.com/app` as the Zoom App development URL once HTTPS is available. The root URL, `https://roomclarity.com/`, is the consumer-facing homepage.

Current backend routes:

- `POST /api/sessions`: create a dashboard session for a meeting.
- `GET /api/sessions/:id`: fetch session metadata.
- `POST /api/zoom/rtms-webhook`: validate Zoom webhook URL challenges, verify signed webhook events, and handle RTMS start/stop/transcript events.
- `GET /api/rtms/sessions`: list in-memory RTMS sessions. Requires `x-admin-token`.
- `GET /api/rtms/sessions/:id`: inspect transcript and Gemini-derived board state for one RTMS session. Requires a matching dashboard token.

The Zoom App launcher calls the Zoom Apps SDK, reads meeting context, posts to `/api/sessions`, opens or shares the returned dashboard URL, and attempts `zoomSdk.startRTMS()` when Zoom exposes that API. Browser dashboards do not run the Zoom Apps SDK; they can view mock playback and poll matching RTMS session state from the backend.

Webhook replay protection is controlled by `ZOOM_WEBHOOK_MAX_AGE_MS`, defaulting to five minutes. Session metadata and RTMS read routes also have a small in-memory per-client rate limit for the prototype. Move this to shared infrastructure before running multiple instances or treating it as a full abuse-prevention layer.
