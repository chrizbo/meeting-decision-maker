# Atlassian Integration (Jira + Confluence)

## Overview

Room Clarity integrates with Atlassian to turn meeting output into durable project artifacts:

- Surface related Jira issues on the live board so the host can link decisions to in-flight work.
- Post a consolidated comment on each linked Jira issue after the meeting (decisions, actions, risks + dashboard link).
- Create Jira subtasks from confirmed action items — owner and due date only if explicitly captured in the transcript.
- Append confirmed decisions to a Confluence Decision Log page in the configured space.
- Back-link each updated Jira issue to the Confluence page via Jira remote links.

The integration is configured per meeting: the host connects Atlassian and picks one or more Jira projects during the runway step, confirms proposals in the brief/recap step, and approves each write before it happens.

One Atlassian OAuth 2.0 (3LO) app covers both Jira and Confluence — one connect flow, one token.

## 1. Create an Atlassian OAuth 2.0 App

1. Go to [developer.atlassian.com/console/myapps](https://developer.atlassian.com/console/myapps).
2. Click **Create** → **OAuth 2.0 integration**.
3. Name it **Room Clarity** and accept the terms.
4. Under **Permissions**, add the following API scopes:

   **Jira API:**
   - `read:jira-work`
   - `write:jira-work`
   - `write:comment:jira`

   **Confluence API:**
   - `read:confluence-space.summary`
   - `read:confluence-content.all`
   - `write:confluence-content`

5. Under **Authorization**, set the callback URL:

   | Environment | Callback URL |
   |-------------|-------------|
   | Production  | `https://roomclarity.com/api/atlassian/oauth/callback` |
   | Local dev   | `http://localhost:8787/api/atlassian/oauth/callback` |

6. Copy the **Client ID** and generate a **Secret** (shown once — copy it immediately).

> **Note:** Atlassian requires the app to be authorised against a specific Atlassian Cloud site before the OAuth flow will work. In the app console, go to **Settings → Authorisation** and ensure your site (`yourorg.atlassian.net`) is listed. For local dev, your personal Atlassian site (free tier) works fine.

## 2. Add Secrets to Google Secret Manager

```bash
echo -n "<client-id>"     | gcloud secrets create atlassian-client-id     --data-file=- --project gen-lang-client-0754444896
echo -n "<client-secret>" | gcloud secrets create atlassian-client-secret  --data-file=- --project gen-lang-client-0754444896
```

If the secrets already exist, add a new version:

```bash
echo -n "<client-id>"     | gcloud secrets versions add atlassian-client-id     --data-file=-
echo -n "<client-secret>" | gcloud secrets versions add atlassian-client-secret  --data-file=-
```

## 3. Deploy with Atlassian Secrets

Add `ATLASSIAN_CLIENT_ID` and `ATLASSIAN_CLIENT_SECRET` to the deploy command alongside the existing secrets:

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

Create a second Atlassian OAuth app (or reuse the same one) with `http://localhost:8787/api/atlassian/oauth/callback` as the callback URL. Then pass the credentials when starting the server:

```bash
ATLASSIAN_CLIENT_ID=<client-id> ATLASSIAN_CLIENT_SECRET=<client-secret> npm start
```

You will need a real Atlassian Cloud site to test against. The free tier at [atlassian.com](https://www.atlassian.com) (up to 10 users) is sufficient — create a Jira project with a few issues and optionally enable Confluence.

## 5. Per-Meeting Configuration

The host configures the Atlassian integration during the **Runway** step:

1. Open the **Jira & Confluence** block in the runway grid.
2. Click **Connect Atlassian** to start the OAuth flow in a popup. The popup resolves the accessible cloud site automatically — no manual site URL entry needed.
3. Enter one or more **Jira project keys** (e.g. `ENG` or `ENG, DESIGN`).
4. Optionally toggle **Active sprint issues only** to restrict issue search to the current sprint.
5. Optionally enter a **Confluence space key** (e.g. `PROJ`) to enable Decision Log updates.

Project keys and the Confluence space are stored in `localStorage` and pre-filled for future meetings.

During the **meeting**, the board surfaces related Jira issues from the configured projects when decisions and actions are captured. The host can link a board item to a specific Jira issue from the detail modal.

During the **brief/recap** step, the Jira & Confluence section proposes (all opt-in, host-confirmed):

- A consolidated comment on each linked Jira issue (decisions + actions + risks that reference it, plus a dashboard link).
- Optional subtask creation for confirmed action items with known owners.
- A Decision Log row appended to the configured Confluence space (if set).
- A remote link from each updated Jira issue back to the Confluence page.

The host checks or unchecks each proposal, then clicks **Publish to Jira**.

## API Routes Added

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/atlassian/oauth/start` | Redirect to Atlassian OAuth authorize page |
| GET | `/api/atlassian/oauth/callback` | Exchange code for token; resolve cloud site; render popup-closing page |
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

## Known Pitfalls

- **Notification spam.** Every Jira comment triggers email to all watchers. Room Clarity sends one consolidated comment per meeting — not one per decision — to keep noise low.
- **Automation loops.** Jira automation rules can fire on comments. All Room Clarity comments include a `room-clarity` footer so automation rules can exclude them with a condition on comment body text.
- **Field overwriting.** The proxy uses additive label updates (`update: {labels: [{add: "..."}]}`) rather than SET operations, so existing labels are never overwritten.
- **Confluence v1 vs v2 API.** The v2 API has a confirmed bug that strips macro body content on page update. Room Clarity uses pure ADF (no macros) in pages it creates, so this does not affect it — but do not add macros to the Decision Log page manually if you expect Room Clarity to keep updating it.
- **`spaceId` vs space key.** The Confluence v2 API requires a numeric `spaceId`, not the human-readable key. Room Clarity resolves the key to an ID at config time using `GET /wiki/api/v2/spaces`.
- **Version conflicts (409).** Confluence uses optimistic locking on page updates. Room Clarity always GETs the current version immediately before writing and retries once on 409.
- **Space permissions.** If the authenticated user lacks "Add Page" permission in the configured Confluence space, the API returns 403 regardless of OAuth scopes. Room Clarity surfaces this as a clear error at publish time.
- **Multiple Atlassian sites.** The OAuth callback resolves the first accessible resource. If the user has access to multiple Atlassian sites, the first one in the list is used. A future improvement would let users pick from a dropdown.

## Jira Configuration Concepts

| Jira concept | GitHub equivalent | Notes |
|---|---|---|
| Project (key e.g. `ENG`) | Repository | Primary config unit; owns issues, workflow, board |
| Issue | Issue | Comments, subtasks, remote links target individual issues |
| Active sprint | Branch / milestone | Optional filter; uses Jira Agile API |
| Confluence space | Repo wiki | Optional; used for Decision Log page only |

## Longer-term Direction

This integration follows the same proxy pattern as GitHub. The longer-term plan (documented in `docs/github-integration.md`) is to replace both proxy approaches with the Atlassian Forge / MCP pattern, exposing Jira and Confluence as tool-oriented integrations that can be configured without custom OAuth apps. The host-confirmation model — Room Clarity proposes, host approves, then executes — stays the same regardless of the underlying transport.
