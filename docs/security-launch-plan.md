# Security Launch Plan

This plan tracks the security and privacy work needed before Room Clarity is opened to external users with real meeting data. Treat meeting transcripts as confidential collaboration data: they may include strategy, customer information, HR/legal topics, financials, participant names, and credentials spoken aloud.

Security and privacy decisions should follow `docs/product-principles.md`, especially the meeting access, sharing, confidentiality, revocation, and AI validation principles.

## Launch Gate

External use with real meetings should wait until the app has:

- Account-based authentication and session authorization.
- Non-guessable dashboard access tokens.
- Locked-down RTMS and session inspection APIs.
- Explicit transcript retention and deletion controls.
- Documented LLM data handling and subprocessors.
- Participant disclosure and admin-facing privacy copy.

## Phase 1: Access Control

Goal: only authorized users can create, view, analyze, or inspect meetings.

- Use Zoom-first authentication with app-owned authorization. See `docs/auth-authorization-plan.md`.
- Add login for hosts and operators through Zoom OAuth.
- Add a user/workspace ownership model for meeting sessions.
- Require authorization on `POST /api/sessions`.
- Require authorization on `GET /api/sessions/:id`.
- Remove or protect `GET /api/rtms/sessions`.
- Protect `GET /api/rtms/sessions/:id` so only authorized viewers can read transcript and analysis state.
- Define viewer roles: host/operator, invited viewer, workspace admin, and service/admin debug.
- Add tests that one workspace cannot fetch another workspace's meeting state.

## Phase 2: Secure Dashboard Links

Goal: shared dashboard URLs are hard to guess, revocable, and scoped.

- Replace short session slugs from `randomUUID().slice(0, 8)` with high-entropy access tokens.
- Separate human-readable meeting IDs from secret viewer tokens.
- Add optional link expiration for beta meetings.
- Add link revocation.
- Add an access mode per meeting: private, invite-only, link-viewable, or demo.
- Avoid exposing secret tokens in logs, analytics events, referrers, or screenshots where possible.

## Phase 3: Transcript Retention and Deletion

Goal: users and admins understand and control what is stored.

- Decide whether the production default stores full transcripts, rolling transcript windows, or generated board state only.
- Add retention settings at the workspace level.
- Add per-meeting deletion for transcript data.
- Decide whether generated decisions, risks, actions, and agent issues survive transcript deletion.
- Add admin deletion/export workflows.
- Add a background cleanup job for expired meetings.
- Update the privacy policy with concrete retention periods instead of beta placeholder language.

## Phase 4: LLM Data Handling

Goal: send the minimum useful data to model providers and make that behavior transparent.

- Document exactly what fields are sent to Gemini: current cue, recent transcript window, current board state, and skill instructions.
- Confirm provider data retention, training, and abuse-monitoring settings for the selected Gemini API account.
- Add a workspace setting to disable LLM analysis for sensitive meetings.
- Add a redaction layer for obvious secrets before transcript cues are sent to the model.
- Keep structured output validation strict; do not allow model output to control permissions, URLs, secrets, or backend behavior.
- Treat transcript text as untrusted input to reduce prompt-injection risk.
- Add tests with malicious transcript text such as "ignore previous instructions" and verify the service still returns only allowed board items.

## Phase 5: Zoom, RTMS, and Webhook Hardening

Goal: RTMS ingestion is trusted, replay-resistant, and operationally visible.

- Keep Zoom webhook signature verification required for RTMS events.
- Add timestamp freshness checks to reduce webhook replay risk.
- Maintain an allowlist of accepted Zoom event names.
- Separate development, staging, and production Zoom credentials.
- Rotate `ZOOM_CLIENT_SECRET`, `ZOOM_WEBHOOK_SECRET_TOKEN`, RTMS credentials, and Gemini keys on a defined schedule.
- Avoid logging raw webhook payloads, transcript text, OAuth tokens, or RTMS secrets.
- Add alerting for repeated webhook verification failures.
- Confirm Zoom Marketplace disclosure, admin approval, and RTMS entitlement requirements before broad launch.

## Phase 6: Abuse Prevention and Reliability

Goal: public endpoints cannot be used to spam sessions, burn LLM spend, or degrade service.

- Add rate limits to session creation, analysis calls, OAuth callback handling, and webhook endpoints.
- Add rate limits to dashboard/session read routes to slow URL and token guessing. Initial in-memory guards are in place for session metadata and RTMS session reads.
- Add request size limits per endpoint, not only a shared body limit.
- Add concurrency and cost controls for LLM analysis.
- Add backpressure or queuing for fast transcript streams.
- Add health checks that do not reveal internal state.
- Add structured operational logs that include event type and counts, not transcript text.

## Phase 7: Browser and App Surface

Goal: the frontend remains safe while still working inside Zoom.

- Keep Content Security Policy restrictive and review it whenever third-party scripts are added.
- Confirm `frame-ancestors` works for the Zoom App surface while preventing unrelated embedding.
- Keep HSTS, `nosniff`, and referrer policy headers enabled.
- Add CSRF protection for authenticated state-changing browser routes.
- Set secure, HTTP-only, SameSite cookies if cookie-based sessions are used.
- Verify frontend rendering escapes transcript and model-generated text.

## Phase 8: Policy, Support, and Enterprise Readiness

Goal: external users know what the product does with their meeting data.

- Update the privacy policy with production retention, deletion, subprocessors, contact, and user-rights language.
- Update terms with acceptable use, beta limitations, and restrictions for highly sensitive meetings.
- Create an incident response contact and escalation path.
- Publish a subprocessors list covering Zoom, Google Cloud, Gemini, and any analytics or support tools.
- Add admin-facing documentation for participant disclosure and consent practices.
- Prepare a basic security questionnaire response covering encryption, access control, data retention, logging, and deletion.

## Suggested First Tickets

1. Replace 8-character session slugs with high-entropy dashboard tokens. Done for new session creation and session metadata reads.
2. Remove or lock down `GET /api/rtms/sessions`. Initial `x-admin-token` gate is in place.
3. Add auth middleware placeholder and protect session/RTMS read routes.
4. Add timestamp freshness validation to Zoom webhook signatures.
5. Add production retention decision and update `privacy.html`.
6. Add rate limits to unauthenticated API routes.
7. Add prompt-injection regression tests for `/api/analyze-cue`.
