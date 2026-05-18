# Zoom App Installation

## Current Zoom Shape

The first Zoom version should be a Zoom App launcher, not a full RTMS integration yet.

The launcher runs inside the Zoom desktop client, reads meeting context with the Zoom Apps SDK, creates a Meeting Decision Maker session through the Cloud Run service, then shows or opens the dashboard URL.

RTMS can come after the app shell is installable and the live board behavior is stable.

## Prerequisites

- A deployed HTTPS URL for this app, ideally from Cloud Run.
- A Zoom account that can create developer apps in the Zoom App Marketplace.
- Permission to install or pre-approve Zoom Apps in the target Zoom account.
- Zoom desktop app installed. Zoom's support docs note that Zoom Apps are installed from Marketplace or desktop, not directly from mobile.

## 1. Deploy the Service

Follow `docs/google-cloud-run-hosting.md` and deploy the service.

Keep the Cloud Run URL handy:

```text
https://YOUR-CLOUD-RUN-URL
```

For the current prototype, the important routes are:

- `https://YOUR-CLOUD-RUN-URL/`
- `https://YOUR-CLOUD-RUN-URL/m/demo-session`
- `https://YOUR-CLOUD-RUN-URL/api/sessions`
- `https://YOUR-CLOUD-RUN-URL/api/zoom/oauth/callback`
- `https://YOUR-CLOUD-RUN-URL/api/zoom/rtms-webhook`

## 2. Create the Zoom App

In the Zoom App Marketplace:

1. Sign in to the Zoom App Marketplace.
2. Open the developer/build-app area.
3. Create a new app intended for Zoom Apps / embedded Zoom client use.
4. Name it `Meeting Decision Maker`.
5. Use the Cloud Run URL as the app's development/home URL.
6. Add the Cloud Run origin to any domain allow list or OAuth allow list fields Zoom requires.

Recommended development URLs:

```text
Home URL: https://YOUR-CLOUD-RUN-URL/
Development URL: https://YOUR-CLOUD-RUN-URL/
Redirect URL: https://YOUR-CLOUD-RUN-URL/api/zoom/oauth/callback
Allow list: https://YOUR-CLOUD-RUN-URL
```

The OAuth callback route exchanges development install codes when Zoom credentials are configured in the Cloud Run environment. Tokens are held only in memory for the current development prototype.

For development OAuth, configure the Cloud Run service with:

```text
ZOOM_CLIENT_ID=<Zoom development client id>
ZOOM_CLIENT_SECRET=<Zoom development client secret from Secret Manager>
ZOOM_REDIRECT_URI=https://YOUR-CLOUD-RUN-URL/api/zoom/oauth/callback
```

## 3. Configure Initial Capabilities

For the launcher-only prototype, keep permissions minimal.

Start with capabilities/scopes that let the app:

- Run inside the Zoom client.
- Read meeting context.
- Read participant context if available for host/co-host users.
- Open or share a URL/app surface.

Do not enable RTMS until the app shell is working. RTMS needs additional Zoom configuration, host/admin approval, disclosure behavior, and backend processing.

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

## 5. Install and Test the Development App

Before the app is public, install it only for development/testing:

1. In Zoom Marketplace, open the app's development/test page.
2. Click the development install/add option.
3. Approve the requested permissions.
4. Open the Zoom desktop app.
5. Start a test meeting.
6. Open Apps and launch `Meeting Decision Maker`.
7. Confirm the app loads from Cloud Run.
8. Create a session and verify the board URL opens.

If Zoom shows `Request pre-approve` instead of `Add` or `Install`, the Zoom account owner/admin must approve the app first.

## 6. RTMS Installation Path Later

When the launcher works, extend the Zoom app with RTMS:

1. Enable RTMS in the Zoom app configuration if available for the account.
2. Configure Zoom webhooks to call `POST /api/zoom/rtms-webhook`.
3. Store Zoom app credentials in Google Secret Manager, not in this repo.
4. Add backend verification for Zoom webhook signatures.
5. Add the RTMS stream connector and transcript event processor.
6. Push transcript-derived meeting-state updates to dashboard sessions.

RTMS should not be used with real meetings until the app has clear consent, retention, and access-control behavior.

## Useful Official References

- Zoom Apps support: https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0059804
- Zoom Marketplace install support: https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0062865
- Zoom Apps SDK TypeDoc: https://appssdk.zoom.us/classes/ZoomSdk.ZoomSdk.html
- Zoom RTMS SDK docs: https://zoom.github.io/rtms/
