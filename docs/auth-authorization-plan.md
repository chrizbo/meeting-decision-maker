# Authentication and Authorization Plan

Room Clarity should use Zoom as the first authentication path because the primary product surface is a Zoom App. Zoom can tell us who launched the app, whether they authorized it, and what role they have in the current meeting. Room Clarity still needs its own authorization layer for workspaces, meeting sessions, dashboard links, retention admins, and non-Zoom browser access.

This plan should be read with `docs/product-principles.md`, especially the principles that meeting access belongs to meeting participants, outside sharing must be explicit, and access must be revocable.

## Decision

Use Zoom-first authentication with app-owned authorization.

- Zoom OAuth authenticates hosts and operators who install or launch the Zoom App.
- Zoom Apps SDK context informs live meeting permissions, especially host/co-host actions.
- Room Clarity stores its own users, workspaces, sessions, roles, dashboard tokens, and retention settings.
- Google login or SSO can be added later for non-Zoom transcript imports, admin dashboards, and enterprise workspace management.

## Identity Model

```text
Zoom account -> Room Clarity workspace
Zoom user -> Room Clarity user
Zoom meeting/session -> Room Clarity meeting session
Dashboard token -> scoped viewer access to one meeting session
```

Initial records:

- `workspace`: stable Room Clarity tenant, usually created from a Zoom account id.
- `user`: stable Room Clarity user, initially created from a Zoom user id.
- `membership`: user role inside a workspace.
- `meetingSession`: meeting board state owned by one workspace.
- `dashboardAccessToken`: high-entropy token granting scoped access to one meeting board.
- `oauthInstallation`: Zoom OAuth tokens and scopes for an installed app/user/account.

## Roles

Start with a small role set:

- `host`: can create sessions, start/stop RTMS when Zoom allows it, manage board state, invite viewers, and delete meeting data.
- `operator`: can manage board state and invite viewers but may not manage workspace settings.
- `viewer`: can view the dashboard for a specific meeting.
- `workspaceAdmin`: can manage retention, members, app settings, and workspace-level deletion/export.
- `serviceAdmin`: internal debug/admin role. Should not be available through normal user flows.

Zoom meeting role should influence live permissions, but it should not replace app authorization. For example, a Zoom host can create or operate the current meeting session only after they have authorized the app and belong to the owning Room Clarity workspace.

## Access Modes

Each meeting session should have one access mode:

- `private`: only authenticated workspace members with explicit roles.
- `inviteOnly`: authenticated users or invited email/Zoom users only.
- `linkViewable`: anyone with a valid dashboard token can view.
- `demo`: unauthenticated demo sessions with synthetic data only.

Default production mode should be `private` or `inviteOnly`. `linkViewable` is useful for early beta and screen-share workflows but should use high-entropy, revocable, expiring tokens.

## Zoom App Flow

1. User launches Room Clarity inside Zoom.
2. Frontend calls `zoomSdk.config(...)`.
3. Frontend calls `zoomSdk.getUserContext()` to check whether the user is authenticated/authorized and to read the meeting role.
4. Frontend calls `zoomSdk.getMeetingContext()` where available for host/co-host users.
5. If the user is not authorized, the app starts the Zoom OAuth authorization flow.
6. Backend exchanges the authorization code at `/api/zoom/oauth/callback`.
7. Backend creates or updates the `oauthInstallation`, `workspace`, `user`, and `membership` records.
8. Frontend calls `POST /api/sessions` with Zoom meeting context.
9. Backend authorizes the caller, creates the `meetingSession`, and returns dashboard access details appropriate for the session's access mode.
10. Host/operator opens or shares the dashboard.

## Browser Dashboard Flow

Browser dashboards should not assume the viewer is inside Zoom.

- A private dashboard requires an authenticated Room Clarity session.
- A link-viewable dashboard requires a valid dashboard token.
- A demo dashboard may stay unauthenticated and synthetic.
- Dashboard URLs should not expose internal meeting IDs as the only secret.

Recommended URL shape:

```text
/m/:publicSessionId?t=:dashboardToken
```

The public session id can be short enough for support/debugging. The token must be high entropy, revocable, and optional only for authenticated users who already have permission.

## Backend Authorization Checks

Every protected route should answer two questions:

1. Who is calling?
2. Are they allowed to do this action on this resource?

Initial route policy:

- `GET /api/healthz`: public.
- `GET /api/analysis/config`: public or authenticated; safe if it returns only provider/model enabled state.
- `GET /api/zoom/oauth/callback`: public OAuth callback with `state` validation.
- `POST /api/sessions`: authenticated Zoom user with host/operator permission.
- `GET /api/sessions/:id`: authenticated member or valid dashboard token.
- `POST /api/analyze-cue`: authenticated host/operator or trusted server-side transcript ingestion only.
- `POST /api/zoom/rtms-webhook`: signed Zoom webhook only.
- `GET /api/rtms/sessions`: serviceAdmin only. Initial protection uses `ROOM_CLARITY_ADMIN_TOKEN` in `x-admin-token`.
- `GET /api/rtms/sessions/:id`: authenticated member or valid dashboard token for that session. Initial dashboard-token protection is in place.

## Session and Token Rules

- Store OAuth tokens server-side only.
- Do not expose Zoom access tokens, refresh tokens, RTMS credentials, or Gemini keys to the browser.
- Use secure, HTTP-only, SameSite cookies if browser sessions are cookie-based.
- Use CSRF protection for cookie-authenticated state-changing routes.
- Store dashboard token hashes, not raw dashboard tokens, when durable storage is enabled.
- Rotate and revoke dashboard tokens per meeting.
- Expire early-beta dashboard tokens by default.

## Implementation Sequence

1. Add auth domain types and helper functions: user, workspace, membership, and session role.
2. Replace 8-character session slugs with `publicSessionId` plus high-entropy dashboard token. Done for new session creation and session metadata reads.
3. Add request authentication middleware with dashboard token support. Initial dashboard-token protection is in place for `GET /api/sessions/:id`.
4. Persist Zoom OAuth installation metadata durably when Firestore is enabled.
5. Add Zoom user/workspace creation after OAuth callback.
6. Protect `POST /api/sessions`, `GET /api/sessions/:id`, and RTMS session routes.
7. Remove or service-admin gate `GET /api/rtms/sessions`. Initial `x-admin-token` gate is in place.
8. Add route-level tests for cross-workspace denial, invalid token denial, expired token denial, and allowed host/operator access.
9. Add Google/SSO only when the product needs non-Zoom workspace entry.

## Open Questions

- Which Zoom identifier should be the durable workspace key for account-level installs?
- Do we want user-managed or account/admin-managed Zoom installation for the first external beta?
- Should link-viewable dashboard tokens be view-only from day one?
- How long should beta dashboard tokens live by default?
- Should non-host attendees ever create their own private dashboard for the same meeting?
