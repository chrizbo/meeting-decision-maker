# Atlassian Integration (Jira + Confluence)

## Overview

Room Clarity integrates with Atlassian to turn meeting output into durable project artifacts:

- Surface related Jira issues on the live board so the host can link decisions to in-flight work.
- Post a consolidated comment on each linked Jira issue after the meeting (decisions, actions, risks + dashboard link).
- Create Jira subtasks from confirmed action items — owner and due date only if explicitly captured in the transcript.
- Append confirmed decisions to a Confluence Decision Log page in the configured space.
- Back-link each updated Jira issue to the Confluence page via Jira remote links.

The integration is configured per meeting: the host connects Atlassian and picks a Jira project (and optionally a Confluence space) during the runway step, confirms proposals in the brief/recap step, and approves each write before it happens.

One Atlassian OAuth 2.0 (3LO) app covers both Jira and Confluence — one connect flow, one token.

## Tracker selector

The runway **Tracker** block lets the host choose between GitHub or Jira & Confluence for a given meeting — one integration at a time. Switching disconnects the previously connected integration. Support for running both simultaneously is planned for a future release.

## 1. Create an Atlassian OAuth 2.0 App

1. Go to [developer.atlassian.com/console/myapps](https://developer.atlassian.com/console/myapps).
2. Click **Create** → **OAuth 2.0 integration**.
3. Name it **Room Clarity** and accept the terms.
4. Under **Permissions**, add the following APIs and scopes:

   **Jira API (classic scopes):**
   - `read:jira-work` — read issues, projects, search
   - `write:jira-work` — create/update issues, post comments, create subtasks

   > Note: `write:jira-work` covers posting comments. There is no separate `write:comment:jira` classic scope — do not add it; Atlassian will reject the OAuth request.

   **Confluence API (classic scopes):**
   - `read:confluence-space.summary`
   - `read:confluence-content.all`
   - `write:confluence-content`

5. Under **Authorization**, add callback URLs (one per line):

   ```
   https://roomclarity.com/api/atlassian/oauth/callback
   http://localhost:8787/api/atlassian/oauth/callback
   ```

6. Click **Save changes**.
7. Under **Settings**, copy the **Client ID** and generate a **Secret** (shown once — copy it immediately).

## 2. Add Secrets to Google Secret Manager

```bash
echo -n "<client-id>"     | gcloud secrets create atlassian-client-id     --data-file=- --project gen-lang-client-0754444896
echo -n "<client-secret>" | gcloud secrets create atlassian-client-secret  --data-file=- --project gen-lang-client-0754444896
```

Grant the Cloud Run service account access to the new secrets:

```bash
gcloud secrets add-iam-policy-binding atlassian-client-id \
  --member="serviceAccount:60699219360-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project gen-lang-client-0754444896

gcloud secrets add-iam-policy-binding atlassian-client-secret \
  --member="serviceAccount:60699219360-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project gen-lang-client-0754444896
```

If the secrets already exist, add a new version:

```bash
echo -n "<client-id>"     | gcloud secrets versions add atlassian-client-id     --data-file=-
echo -n "<client-secret>" | gcloud secrets versions add atlassian-client-secret  --data-file=-
```

## 3. Deploy with Atlassian Secrets

```bash
gcloud run deploy meeting-decision-maker-web \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars=PUBLIC_BASE_URL=https://roomclarity.com \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest,OPENAI_API_KEY=openai-api-key:latest,ZOOM_WEBHOOK_SECRET_TOKEN=zoom-webhook-secret-token:latest,ZOOM_CLIENT_ID=zoom-client-id:latest,ZOOM_CLIENT_SECRET=zoom-client-secret:latest,ZOOM_REDIRECT_URI=zoom-redirect-uri:latest,ROOM_CLARITY_ADMIN_TOKEN=room-clarity-admin-token:latest,GITHUB_CLIENT_ID=github-client-id:latest,GITHUB_CLIENT_SECRET=github-client-secret:latest,ATLASSIAN_CLIENT_ID=atlassian-client-id:latest,ATLASSIAN_CLIENT_SECRET=atlassian-client-secret:latest
```

The **Connect Atlassian** button in the runway will only appear when both vars are set.

## 4. Local Development

Pass the credentials when starting the server:

```bash
ATLASSIAN_CLIENT_ID=<client-id> ATLASSIAN_CLIENT_SECRET=<client-secret> npm start
```

You need a real Atlassian Cloud site to test against. The free tier at [atlassian.com](https://www.atlassian.com) (up to 10 users) is sufficient. Create a Jira project with a few issues and optionally enable Confluence (available as a free add-on from the site's app settings).

The callback URL for local dev is `http://localhost:8787/api/atlassian/oauth/callback` — add it to the Atlassian OAuth app's Authorization settings alongside the production URL.

## 5. Per-Meeting Configuration

The host configures the Atlassian integration during the **Runway** step:

1. In the **Tracker** block, select **Jira & Confluence**.
2. Click **Connect Atlassian** to start the OAuth flow in a popup. The popup writes the token to `localStorage` directly (bypassing the `window.opener` limitation that can occur after cross-origin navigation through `auth.atlassian.com`) and closes automatically.
3. Once connected, a **Jira project** dropdown appears populated from the site's projects. Select one.
4. Optionally toggle **Active sprint issues only** to restrict issue search to the current sprint.
5. Optionally select a **Confluence space** from the dropdown for Decision Log updates.
6. Click **Save**.

Project and space selections are stored in `localStorage` and pre-filled for future meetings.

During the **meeting**, the board will surface related Jira issues from the configured project when decisions and actions are captured (Phase 2 — not yet implemented).

During the **brief/recap** step, the Jira & Confluence section will propose (all opt-in, host-confirmed — Phase 3, not yet implemented):

- A consolidated comment on each linked Jira issue.
- Optional subtask creation for confirmed action items.
- A Decision Log row in the configured Confluence space.
- A remote link from each Jira issue back to the Confluence page and Room Clarity dashboard.

## API Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/atlassian/oauth/start` | Redirect to Atlassian OAuth authorize page |
| GET | `/api/atlassian/oauth/callback` | Exchange code for token; resolve cloud site; write to localStorage; close popup |
| POST | `/api/atlassian/proxy` | Proxy authenticated Jira REST API calls |
| POST | `/api/confluence/proxy` | Proxy authenticated Confluence REST API calls |

### Allowed Jira proxy paths

- `GET /rest/api/3/myself` — verify token, get account ID
- `GET /rest/api/3/project/search` — list projects for config dropdown
- `GET /rest/api/3/project/{key}` — resolve project key → ID
- `GET /rest/api/3/issue/search` — search related issues (JQL)
- `GET /rest/api/3/issue/{key}` — fetch issue detail
- `POST /rest/api/3/issue/{key}/comment` — post meeting comment
- `POST /rest/api/3/issue` — create subtask
- `POST /rest/api/3/issue/{key}/remotelink` — back-link to Confluence/dashboard
- `GET /rest/agile/1.0/board` — list boards for project
- `GET /rest/agile/1.0/board/{id}/sprint` — get active sprint

### Allowed Confluence proxy paths

- `GET /wiki/api/v2/spaces` — list spaces for config dropdown
- `GET /wiki/api/v2/pages` — find existing Decision Log page by title
- `POST /wiki/api/v2/pages` — create Decision Log or meeting notes page
- `GET /wiki/api/v2/pages/{id}` — fetch page for read-modify-write append
- `PUT /wiki/api/v2/pages/{id}` — update page (version N+1)
- `POST /wiki/rest/api/content/{id}/metadata/labels` — add labels to page

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `ATLASSIAN_CLIENT_ID` | Atlassian OAuth 2.0 app client ID |
| `ATLASSIAN_CLIENT_SECRET` | Atlassian OAuth 2.0 app secret (keep in Secret Manager) |

The OAuth access token is obtained by the browser via the popup flow. The token, cloud ID, and site URL are stored in `localStorage` (`atlassianToken`, `atlassianCloudId`, `atlassianSite`). They are sent to the server only on proxied API requests and are never logged.

## OAuth Callback Design Note

The callback page uses `'unsafe-inline'` in its Content Security Policy (scoped only to the `/api/atlassian/oauth/callback` and `/api/github/oauth/callback` routes via `sendOAuthHtml`). This is necessary because:

1. The inline script must write the token to `localStorage` directly, which fires a `storage` event on the main window — the reliable cross-origin popup communication path.
2. `window.opener.postMessage` is also attempted as the primary path, but Atlassian's OAuth flow navigates through `auth.atlassian.com`, which can null out `window.opener` in some browsers.
3. `window.close()` must be called from the same inline script.

The `unsafe-inline` exception is scoped only to these two callback endpoints and does not weaken the CSP for the rest of the application.

## Known Pitfalls

- **`write:comment:jira` does not exist as a classic scope.** It is a granular scope only. `write:jira-work` covers comment posting. Do not add `write:comment:jira` to the OAuth scope string — Atlassian will reject the authorization request.
- **Notification spam.** Every Jira comment triggers email to all watchers. Room Clarity sends one consolidated comment per meeting — not one per decision.
- **Automation loops.** All Room Clarity comments will include a `room-clarity` footer so Jira automation rules can exclude them.
- **Field overwriting.** Use additive label updates (`update: {labels: [{add: "..."}]}`) not SET operations.
- **Confluence v1 vs v2 API.** The v2 API has a confirmed bug that strips macro body content on page update. Room Clarity uses pure ADF (no macros) in pages it creates.
- **`spaceId` vs space key.** The Confluence v2 API requires a numeric `spaceId`. Room Clarity resolves the key → ID at publish time.
- **Version conflicts (409).** Room Clarity always GETs the current version immediately before writing and retries once on 409.
- **Space permissions.** If the authenticated user lacks "Add Page" permission in the configured Confluence space, the API returns 403. This will be surfaced as a clear error at publish time.
- **Multiple Atlassian sites.** The OAuth callback resolves the first accessible resource. If the user has access to multiple sites, the first one is used.

## Jira Configuration Concepts

| Jira concept | GitHub equivalent | Notes |
|---|---|---|
| Project (key e.g. `ENG`) | Repository | Primary config unit; selected from dropdown |
| Issue | Issue | Comments, subtasks, remote links target individual issues |
| Active sprint | Branch / milestone | Optional filter; uses Jira Agile API |
| Confluence space | Repo wiki | Optional; used for Decision Log page only |

## What's Built vs. Planned

| Feature | Status |
|---|---|
| OAuth connect/disconnect | ✅ Built |
| Tracker selector (GitHub or Atlassian) | ✅ Built |
| Project + space dropdowns in runway | ✅ Built |
| During-meeting Jira issue surfacing | 🔜 Phase 2 |
| Post-meeting comment on linked issues | 🔜 Phase 3 |
| Subtask creation from action items | 🔜 Phase 3 |
| Confluence Decision Log append | 🔜 Phase 3 |
| Remote links back to dashboard | 🔜 Phase 3 |

## Longer-term Direction

This integration follows the same proxy pattern as GitHub. The longer-term plan (documented in `docs/github-integration.md`) is to replace both proxy approaches with the Atlassian Forge / MCP pattern, exposing Jira and Confluence as tool-oriented integrations that can be configured without custom OAuth apps. The host-confirmation model stays the same regardless of the underlying transport.
