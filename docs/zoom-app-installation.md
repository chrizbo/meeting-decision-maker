# Zoom App Installation

## Current Zoom Shape

The current Zoom version is a Zoom App launcher with RTMS plumbing.

The launcher runs inside the Zoom desktop client, reads meeting context with the Zoom Apps SDK, creates a Room Clarity session through the Cloud Run service, then shows or opens the dashboard URL. When Zoom exposes RTMS APIs to the app, the launcher attempts `zoomSdk.startRTMS()` and the backend receives the resulting RTMS webhook events.

If the Zoom SDK returns `40316` / "API hasn't passed marketplace verification", the local app and backend are configured, but Zoom has not yet granted the app access to `startRTMS`.

## Prerequisites

- A deployed HTTPS URL for this app, ideally from Cloud Run.
- A Zoom account that can create developer apps in the Zoom App Marketplace.
- Permission to install or pre-approve Zoom Apps in the target Zoom account.
- Zoom desktop app installed. Zoom's support docs note that Zoom Apps are installed from Marketplace or desktop, not directly from mobile.

## 1. Deploy the Service

Follow `docs/google-cloud-run-hosting.md` and deploy the service, including the custom domain mapping for `roomclarity.com`.

Use the branded URL for Zoom configuration:

```text
https://roomclarity.com
```

For the current prototype, the important routes are:

- `https://roomclarity.com/`
- `https://roomclarity.com/app`
- `https://roomclarity.com/m/demo-session`
- `https://roomclarity.com/api/sessions`
- `https://roomclarity.com/api/zoom/oauth/callback`
- `https://roomclarity.com/api/zoom/rtms-webhook`
- `https://roomclarity.com/api/rtms/sessions`

## 2. Create the Zoom App

In the Zoom App Marketplace:

1. Sign in to the Zoom App Marketplace.
2. Open the developer/build-app area.
3. Create a new app intended for Zoom Apps / embedded Zoom client use.
4. Name it `Room Clarity`.
5. Use `https://roomclarity.com/app` as the app's development/home URL.
6. Add the `roomclarity.com` origin to any domain allow list or OAuth allow list fields Zoom requires.

Recommended development URLs:

```text
Home URL: https://roomclarity.com/app
Development URL: https://roomclarity.com/app
Redirect URL: https://roomclarity.com/api/zoom/oauth/callback
Allow list: https://roomclarity.com
Privacy Policy URL: https://roomclarity.com/privacy.html
Terms of Use URL: https://roomclarity.com/terms.html
Support URL: https://roomclarity.com/support.html
Documentation URL: https://roomclarity.com/documentation.html
Configuration URL: https://roomclarity.com/configure.html
```

The public homepage lives at `https://roomclarity.com/`. The Zoom App should load `/app` so Zoom opens the interactive board surface, not the consumer setup page.

The OAuth callback route exchanges development install codes when Zoom credentials are configured in the Cloud Run environment. Tokens are held only in memory for the current development prototype.

For production access control, use the Zoom-first authentication and app-owned authorization model in `docs/auth-authorization-plan.md`. Zoom identifies and authorizes the user, but Room Clarity still owns workspace membership, meeting-session permissions, dashboard tokens, and retention/admin roles.

For development OAuth, configure the Cloud Run service with:

```text
ZOOM_CLIENT_ID=<Zoom development client id>
ZOOM_CLIENT_SECRET=<Zoom development client secret from Secret Manager>
ZOOM_REDIRECT_URI=https://roomclarity.com/api/zoom/oauth/callback
ZOOM_WEBHOOK_SECRET_TOKEN=<Zoom webhook secret token from Secret Manager>
GEMINI_API_KEY=<Gemini API key from Secret Manager>
PUBLIC_BASE_URL=https://roomclarity.com
```

The RTMS SDK uses `ZM_RTMS_CLIENT` and `ZM_RTMS_SECRET`. If those are not set, the backend falls back to `ZOOM_CLIENT_ID` and `ZOOM_CLIENT_SECRET`.

Meeting sessions are stored in Firestore when Cloud Run has:

```text
SESSION_STORE=firestore
FIRESTORE_SESSIONS_COLLECTION=meetingSessions
```

When deploying from local source, preserve all secret-backed environment variables:

```bash
gcloud run deploy meeting-decision-maker-web \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars=PUBLIC_BASE_URL=https://roomclarity.com \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest,ZOOM_WEBHOOK_SECRET_TOKEN=zoom-webhook-secret-token:latest,ZOOM_CLIENT_ID=zoom-client-id:latest,ZOOM_CLIENT_SECRET=zoom-client-secret:latest,ZOOM_REDIRECT_URI=zoom-redirect-uri:latest,ROOM_CLARITY_ADMIN_TOKEN=room-clarity-admin-token:latest
```

Using `--set-secrets` with only one secret can replace the existing set of secret-backed variables. Prefer the full command above or inspect the service after deployment.

## 3. Configure Initial Capabilities

For the launcher and RTMS prototype, keep permissions minimal but include RTMS capabilities.

Start with capabilities/scopes that let the app:

- Run inside the Zoom client.
- Read meeting context.
- Read participant context if available for host/co-host users.
- Open or share a URL/app surface.
- Start, stop, and inspect RTMS status when Zoom grants the app those APIs.
- Receive RTMS webhook events and transcript data.

Enable event subscriptions for:

- `meeting.rtms_started`
- `meeting.rtms_stopped`
- interrupted/failed RTMS events if Zoom exposes them.

Set the event notification endpoint URL to:

```text
https://roomclarity.com/api/zoom/rtms-webhook
```

## 4. Add the Zoom Apps SDK to the Launcher

The current board is still static, so the simplest launcher implementation can load the Zoom Apps SDK from Zoom's CDN:

```html
<script src="https://appssdk.zoom.us/sdk.js"></script>
```

When the app grows into a bundled frontend, install the SDK through npm instead:

```bash
npm install @zoom/appssdk
```

The launcher should:

1. Call `zoomSdk.config(...)` as the first SDK call.
2. Call `zoomSdk.getMeetingContext()` when running in a meeting.
3. Send the topic, meeting id, host/user, and participants to `POST /api/sessions`.
4. Display the returned `dashboardPath`.
5. Let the host open the dashboard in a browser or share the app surface from Zoom.
6. Let the host call `zoomSdk.startRTMS()` from the meeting controls menu when RTMS APIs are available.
7. In normal browser mode, hide the unsupported Zoom SDK error and treat the page as a read-only/shared dashboard.

## 5. Install and Test the Development App

Before the app is public, install it only for development/testing:

1. In Zoom Marketplace, open the app's development/test page.
2. Click the development install/add option.
3. Approve the requested permissions.
4. Open the Zoom desktop app.
5. Start a test meeting.
6. Open Apps and launch `Room Clarity`.
7. Confirm the app loads from Cloud Run.
8. Create a session and verify the board URL opens.
9. Open the app controls menu and check the RTMS status line.
10. If Zoom allows the API, start RTMS and confirm `/api/rtms/sessions` shows transcript activity using the service admin token.

If Zoom shows `Request pre-approve` instead of `Add` or `Install`, the Zoom account owner/admin must approve the app first.

## 6. Current RTMS Behavior

Current backend behavior:

1. Zoom validates `/api/zoom/rtms-webhook` using `ZOOM_WEBHOOK_SECRET_TOKEN`.
2. Signed Zoom webhook events are verified with `x-zm-request-timestamp` and `x-zm-signature`, and non-validation events must be inside the configured freshness window.
3. `meeting.rtms_started` causes the backend to create an `@zoom/rtms` client and join the stream.
4. `onTranscriptData` callbacks are normalized into transcript cues.
5. Cues are analyzed with Gemini and accumulated in in-memory RTMS session state.
6. Browser dashboard pages can poll matching RTMS session records and display transcript-derived board state.

RTMS should not be used with real meetings until the app has clear consent, retention, and access-control behavior.

## Useful Official References

- Zoom Apps support: https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0059804
- Zoom Marketplace install support: https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0062865
- Zoom Apps SDK TypeDoc: https://appssdk.zoom.us/classes/ZoomSdk.ZoomSdk.html
- Zoom RTMS SDK docs: https://zoom.github.io/rtms/
