# GitHub Integration

## Overview

Room Clarity integrates with GitHub to turn meeting output into durable project artifacts:

- Upload the meeting transcript to a designated folder in a repo (as a PR).
- Create new GitHub issues from captured decisions and actions.
- Comment on existing issues that were discussed during the meeting.
- Surface related issues on the live board so the host can link decisions to in-flight work.

The integration is configured per meeting: the host binds a repo during the runway step, confirms the target issues and transcript path in the brief/recap step, and approves each write before it happens.

## Current Implementation

The current version uses a GitHub OAuth App. The browser-based OAuth flow authenticates the host, and all GitHub API calls are proxied through the Room Clarity server to avoid CORS issues and keep the token off the client.

See the **Longer-term direction** section at the bottom of this doc for the planned MCP-based approach.

## 1. Create a GitHub OAuth App

1. Go to **GitHub Settings → Developer Settings → OAuth Apps → New OAuth App**.
2. Set the following fields:

   | Field | Value |
   |-------|-------|
   | Application name | Room Clarity |
   | Homepage URL | `https://roomclarity.com` |
   | Authorization callback URL | `https://roomclarity.com/api/github/oauth/callback` |

   For local development use `http://localhost:8787/api/github/oauth/callback` as the callback URL, or create a separate dev OAuth App.

3. Click **Register application**.
4. On the next page, copy the **Client ID**.
5. Generate a **Client secret** and copy it immediately (it won't be shown again).

## 2. Add Secrets to Google Secret Manager

```bash
echo -n "<client-id>"     | gcloud secrets create github-client-id     --data-file=- --project gen-lang-client-0754444896
echo -n "<client-secret>" | gcloud secrets create github-client-secret  --data-file=- --project gen-lang-client-0754444896
```

If the secrets already exist, add a new version:

```bash
echo -n "<client-id>"     | gcloud secrets versions add github-client-id     --data-file=-
echo -n "<client-secret>" | gcloud secrets versions add github-client-secret  --data-file=-
```

## 3. Deploy with GitHub Secrets

Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to the deploy command alongside the existing secrets:

```bash
gcloud run deploy meeting-decision-maker-web \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars=PUBLIC_BASE_URL=https://roomclarity.com \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest,OPENAI_API_KEY=openai-api-key:latest,ZOOM_WEBHOOK_SECRET_TOKEN=zoom-webhook-secret-token:latest,ZOOM_CLIENT_ID=zoom-client-id:latest,ZOOM_CLIENT_SECRET=zoom-client-secret:latest,ZOOM_REDIRECT_URI=zoom-redirect-uri:latest,ROOM_CLARITY_ADMIN_TOKEN=room-clarity-admin-token:latest,GITHUB_CLIENT_ID=github-client-id:latest,GITHUB_CLIENT_SECRET=github-client-secret:latest
```

## 4. Local Development

Create a second GitHub OAuth App with `http://localhost:8787` as the homepage and `http://localhost:8787/api/github/oauth/callback` as the callback URL. Then pass the credentials when starting the server:

```bash
GITHUB_CLIENT_ID=<dev-client-id> GITHUB_CLIENT_SECRET=<dev-client-secret> npm start
```

The GitHub connect button in the runway will be active when both vars are set.

## 5. Per-Meeting Configuration

The host configures GitHub during the **Runway** step before the meeting starts:

1. Open the GitHub block in the runway grid.
2. Click **Connect GitHub** to start the OAuth flow in a popup.
3. Enter or confirm the target repo URL (e.g., `https://github.com/chrizbo/agentics-beyond-code`).
4. Optionally set the folder for transcript uploads (default: `meetings/`).

The repo URL and folder are stored in `localStorage` and pre-filled for future meetings.

During the **meeting**, the board surfaces related issues from the bound repo when decisions and actions are captured. The host can link a board item to an issue from the detail modal.

During the **brief/recap** step, the GitHub section shows:

- Proposed new issues (one per accepted decision or action without a linked issue).
- Proposed comments on linked existing issues.
- A toggle to upload the transcript as a PR to the configured folder.
- An option to post the reviewed meeting brief as a GitHub Discussion in the target repo, with a category selector when Discussions are enabled.

The host checks or unchecks each proposal, then clicks **Publish to GitHub**.

## API Routes Added

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/github/oauth/start` | Redirect to GitHub OAuth authorize page |
| GET | `/api/github/oauth/callback` | Exchange code for token; render popup-closing page |
| POST | `/api/github/proxy` | Proxy authenticated GitHub REST API calls |
| POST | `/api/github/graphql` | Proxy allowlisted GitHub GraphQL operations for discussion categories and discussion creation |

The proxy accepts `{ token, method, path, body, params }` and forwards to `https://api.github.com`. Allowed paths:

- `GET /repos/{owner}/{repo}` — verify repo and fetch metadata
- `GET/POST /repos/{owner}/{repo}/issues` — list or create issues
- `POST /repos/{owner}/{repo}/issues/{number}/comments` — comment on issue
- `PUT /repos/{owner}/{repo}/contents/{path}` — create or update a file
- `POST /repos/{owner}/{repo}/pulls` — create a pull request
- `GET/POST /repos/{owner}/{repo}/git/refs` — branch management
- `GET /search/issues` — search issues for related-issue matching

The GraphQL proxy only accepts the `RoomClarityDiscussionCategories` query and the `RoomClarityCreateDiscussion` mutation. It is used because GitHub Discussions are exposed through GraphQL rather than the REST issue/comment endpoints.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret (keep in Secret Manager) |

The OAuth token is obtained by the browser via the popup flow and stored in `localStorage` as `githubToken`. It is sent to the server only on proxied GitHub API requests and is never logged.

---

## Longer-term Direction: GitHub MCP Server

The current proxy-based approach is a working first version. The longer-term plan is to replace the direct REST calls with the official [GitHub MCP server](https://github.com/github/github-mcp-server), which gives a richer, tool-oriented interface and makes it easier to swap in other integrations using the same pattern.

### GitHub MCP Server Setup (future)

The GitHub MCP server can be run locally as a Docker container or binary:

```bash
docker run -i \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=<pat> \
  ghcr.io/github/github-mcp-server
```

Or using the binary:

```bash
GITHUB_PERSONAL_ACCESS_TOKEN=<pat> github-mcp-server stdio
```

Key environment variables for the MCP server:

| Variable | Purpose |
|----------|---------|
| `GITHUB_PERSONAL_ACCESS_TOKEN` | PAT with `repo` scope |
| `GITHUB_TOOLSETS` | Comma-separated toolsets to enable: `repos,issues,pull_requests` |
| `GITHUB_READ_ONLY` | Set to `true` to restrict to read-only tools |

For production on Cloud Run, run the GitHub MCP server as a sidecar container and connect to it over stdio or a local socket from the main server process.

### General MCP Integration Pattern (future)

Room Clarity will support a registry of MCP server connections, each providing a named set of tools:

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
      "toolsets": ["repos", "issues", "pull_requests"],
      "displayName": "GitHub"
    },
    "linear": {
      "command": "npx",
      "args": ["-y", "@linear/mcp-server"],
      "displayName": "Linear"
    }
  }
}
```

The Room Clarity server will:

1. Load and connect to configured MCP servers on startup.
2. Expose a `GET /api/mcp/tools` route listing available tools per server.
3. Use connected tool capabilities when building meeting proposals (decisions → create issue, actions → create task, etc.).
4. Execute approved proposals via `POST /api/mcp/call` after host confirmation.

The host-confirmation model stays the same regardless of which MCP servers are connected: Room Clarity proposes, the host approves, then the server executes.

Tools are namespaced by server: `github/create_issue`, `linear/create_issue`, `notion/create_page`. The brief/recap UI shows proposals grouped by integration, and the host can selectively enable or disable each integration per meeting.

### Candidate Integrations

| Integration | Use cases |
|-------------|-----------|
| GitHub | Issues, PRs, transcript upload, project fields |
| Linear | Issues, project cycles, triage |
| Notion | Meeting page, decision log, action database |
| Slack | Post-meeting summary to channel |
| Jira | Tickets, sprints, epics |
| Google Docs | Meeting notes, decision log |

All integrations follow the same pattern: configured MCP server → tool discovery → LLM proposal → host confirmation → execution.
