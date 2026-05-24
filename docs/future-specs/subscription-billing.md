# Future Spec: Subscription Billing and Usage Limits

## Status

Future consideration. Do not implement before the auth, workspace, and durable session model exists.

This spec is intended to shape the product and system requirements for a paid Room Clarity subscription model. It should be read with:

- `docs/auth-authorization-plan.md`
- `docs/security-launch-plan.md`
- `docs/model-evaluation-notes.md`
- `docs/google-cloud-run-hosting.md`

## Goal

Support a subscription business model that prices Room Clarity around meeting value while protecting the service from unbounded LLM, transcript, storage, support, and abuse costs.

The first paid model should feel simple to buyers:

- A plan includes a monthly pool of meeting analysis hours.
- Extra usage is either softly blocked, billed as overage, or upgraded to the next plan.
- No live meeting should be interrupted in a surprising way because a limit was crossed mid-call.

## Product Thesis

Room Clarity should not be priced as raw transcription.

The value comes from helping teams:

- Capture decisions with evidence.
- Catch weak assumptions and missing risks before the meeting ends.
- Reduce post-meeting cleanup.
- Create a usable decision trail across meetings.
- Avoid churn caused by forgotten owners, fuzzy commitments, and reopened decisions.

Because the model cost of Gemini Flash-Lite cue analysis is low relative to potential customer value, pricing should be based on value and usage fairness rather than a cost-plus token markup.

## Suggested Subscription Shape

Start with monthly subscriptions, then add annual billing after packaging is clearer.

Suggested early tiers:

| Plan | Buyer | Included meeting analysis | Suggested price | Notes |
| --- | --- | ---: | ---: | --- |
| Personal | Individual host | 15-25 hours / month | $12-$19 / month | Good for light PMs, founders, ICs, and solo consultants. |
| Pro | Heavy individual host | 50-75 hours / month | $25-$39 / month | Best default for meeting-heavy operators. |
| Team | Small team workspace | 150-300 pooled hours / month | $75-$199 / month | Shared decision log, member management, integrations. |
| Business | Department workspace | 500+ pooled hours / month | Custom or $15-$30 / active seat | Admin controls, retention, SSO-ready architecture. |
| Enterprise | Large organization | Contracted pool | Custom | Security review, data controls, negotiated retention, support. |

The first public paid package could be simpler:

- `Free`: demo and limited transcript uploads, no live RTMS or very small live quota.
- `Pro`: one host, 50 hours/month.
- `Team`: pooled workspace hours and shared meeting library.

Avoid showing token costs or model names in plan language unless the buyer is technical. Users think in meeting hours and team workflows.

## Usage Unit

Use `meeting_analysis_hour` as the primary billing unit.

A meeting analysis hour is time where Room Clarity is actively analyzing transcript or audio-derived cues for a meeting session.

Countable usage should include:

- Live Zoom RTMS transcript analysis.
- Uploaded transcript playback when analyzed by the server.
- Post-meeting brief generation from stored transcript or board state.
- Re-analysis or regeneration requested by the user.

Countable usage should not include:

- Viewing an existing board.
- Editing or excluding recap items.
- Reading a brief.
- Demo sessions with synthetic fixture data.
- Failed analysis calls that never produced useful output because of service errors.

For billing simplicity, roll usage up to minutes internally and display hours externally.

Suggested rounding:

- Track exact analyzed seconds internally.
- Bill/display in 0.1-hour increments at the workspace level.
- Enforce minimum billable duration of 1 minute per analyzed meeting only after a real cue is processed.

## Cost Assumptions

The current regular live path should use `gemini-2.5-flash-lite` unless evals show a major quality reason to change.

From `docs/model-evaluation-notes.md`, cue-by-cue analysis can cost meaningfully more than a single transcript pass because the skill and context prompt are repeated for each cue. Current rough estimate for a 30-minute meeting:

| Model | 100 cues | 180 cues | 300 cues |
| --- | ---: | ---: | ---: |
| Gemini 2.5 Flash-Lite | $0.12 | $0.22 | $0.36 |
| Gemini 2.5 Flash | $0.43 | $0.77 | $1.28 |
| GPT-5.4 | $3.25 | $5.85 | $9.75 |
| GPT-5.5 | $6.50 | $11.70 | $19.50 |

Implications:

- Flash-Lite live cue analysis supports healthy margins at subscription prices.
- More expensive models should be reserved for evals, judge passes, slow-lane moments, post-meeting synthesis, or premium features.
- The product needs usage caps even when model cost is low because abuse, repeated regenerations, storage, and support can dominate raw inference cost.
- Subscription margins should be modeled against worst-case cue density, not only average meeting length.

## Limit Philosophy

Limits should protect the service without making meetings feel fragile.

Recommended behavior:

- Do not stop analysis abruptly in the middle of an active meeting.
- Warn the host before the workspace is likely to exceed its monthly pool.
- If a workspace crosses its included hours during a meeting, let that meeting finish.
- After the meeting, require upgrade, overage approval, or admin action before starting more analyzed meetings.
- Keep read-only access to existing meetings and briefs even when the subscription is expired or over limit, subject to retention policy.

For early beta, prefer soft limits and manual outreach. For self-serve paid plans, add explicit enforcement.

## Limit Modes

Support three limit modes at the plan/workspace level:

```text
usage_limit_mode
- soft: warn only
- hard_next_meeting: allow current meeting to finish, block new analyzed sessions
- overage: allow continued use and bill per additional hour
```

Suggested defaults:

- Free: `hard_next_meeting`
- Pro: `hard_next_meeting` with easy upgrade
- Team: `overage` optional, admin-controlled
- Enterprise: contract-specific

## Required Product Surface

### In-App Usage Visibility

Hosts and workspace admins need a simple usage view:

- Current plan.
- Included hours this billing period.
- Used hours.
- Remaining hours.
- Reset date.
- Whether overage is enabled.
- Upgrade/manage billing action.

Host-facing meeting UI should be restrained:

- Show a small warning when the workspace is near limit.
- Avoid scary banners during an active meeting.
- If new analysis is blocked, make it clear that existing boards and briefs remain viewable.

### Billing Management

Workspace admins need:

- Start subscription.
- Change plan.
- Enable or disable overage where supported.
- Update payment method.
- Cancel subscription.
- View invoices.
- See usage by billing period.

Use a hosted billing portal rather than building full invoice/payment management in the app.

### Plan Education

Pricing copy should explain meeting hours in plain language:

```text
Meeting analysis hours are counted only while Room Clarity is actively analyzing a live or uploaded meeting transcript. Viewing boards, editing recaps, and reading briefs do not count against your monthly hours.
```

## Required System Additions

### Billing Provider

Add a billing provider integration, likely Stripe.

Required capabilities:

- Checkout session creation.
- Customer portal session creation.
- Subscription status webhooks.
- Invoice/payment status webhooks.
- Price IDs mapped to internal plans.
- Test-mode billing environment.
- Idempotent webhook handling.

Keep the billing provider as the payment and subscription event source, but keep entitlement decisions inside Room Clarity.

### Workspace Entitlements

Add a durable entitlement record per workspace:

```text
workspace_entitlement
- workspace_id
- plan_key
- status: trialing | active | past_due | canceled | paused | comped
- billing_provider: stripe | manual
- billing_customer_id optional
- billing_subscription_id optional
- current_period_start
- current_period_end
- included_analysis_seconds
- usage_limit_mode
- overage_enabled
- overage_price_key optional
- feature_flags
- updated_at
```

Entitlements should be cached carefully but always recoverable from durable storage.

### Usage Ledger

Add an append-only usage ledger.

Do not rely only on mutable counters. Mutable counters are useful for quick reads, but the ledger is needed for audits, invoice disputes, and plan debugging.

```text
usage_event
- id
- workspace_id
- user_id optional
- meeting_session_id optional
- event_type:
  - analysis_started
  - analysis_stopped
  - cue_analyzed
  - brief_generated
  - regeneration_requested
  - adjustment
- provider optional
- model optional
- input_tokens optional
- output_tokens optional
- analyzed_seconds optional
- billable_seconds optional
- source: zoom_rtms | upload | mock | admin_adjustment
- created_at
- idempotency_key
```

Also maintain a billing-period aggregate for fast enforcement:

```text
usage_period
- workspace_id
- period_start
- period_end
- included_analysis_seconds
- used_analysis_seconds
- billable_overage_seconds
- last_event_at
- updated_at
```

### Metering Hooks

Metering should happen at server boundaries:

- When `POST /api/sessions` creates an analyzable meeting session, check entitlement.
- When Zoom RTMS starts, create or update an `analysis_started` event.
- When transcript cues are analyzed, record cue-level token usage if the provider returns it.
- When RTMS stops or the meeting becomes inactive, record analyzed duration.
- When `/api/analyze-cue` is called by mock playback or uploaded transcript analysis, attribute usage to the workspace and session.
- When recap/brief generation uses the LLM, record a generation usage event.

The system should tolerate duplicate webhook deliveries and retries. Use idempotency keys based on provider event ids, meeting session id, cue id, and operation type.

### Enforcement

Add an entitlement check before any new cost-bearing operation:

```text
can_start_analysis(workspace_id)
- active subscription or trial
- included hours remaining, or overage enabled, or comped access
- workspace not suspended for abuse/payment failure
```

Route-level policy:

- `POST /api/sessions`: may create a non-analyzing session when over limit, but should not start live analysis unless allowed.
- `POST /api/analyze-cue`: require entitlement for real meetings and uploads.
- `POST /api/analyze-runway`: require entitlement unless using static demo data.
- `POST /api/zoom/rtms-webhook`: signed Zoom webhook remains accepted, but analysis should be disabled if the workspace is not entitled to start or continue analysis.
- Brief generation endpoint: require entitlement for new generation; viewing existing briefs stays allowed.

If entitlement fails, return a structured response:

```json
{
  "error": "usage_limit_reached",
  "message": "This workspace has used its included meeting analysis hours for the current billing period.",
  "canViewExistingMeetings": true,
  "upgradeUrl": "/billing"
}
```

### Data Model Dependencies

Subscription billing depends on:

- Durable `workspace` records.
- Durable `user` and `membership` records.
- Durable `meetingSession` ownership.
- Durable session-to-workspace attribution for Zoom and browser-created meetings.
- Server-side auth on cost-bearing endpoints.
- Firestore or another durable database for entitlements and usage.

Do not ship self-serve billing while meetings are only in memory.

## Cost Controls

Add controls that reduce cost without hurting product quality:

- Use Flash-Lite for regular live extraction.
- Keep expensive models behind explicit feature flags.
- Cap rolling transcript windows for cue analysis.
- Avoid resending the full meeting transcript on every cue.
- Batch or defer non-urgent post-meeting synthesis.
- Add per-workspace and per-user rate limits for analysis endpoints.
- Detect repeated identical cue submissions.
- Track provider token usage for actual cost reporting when available.
- Alert internally on unusual cue density, token spikes, or repeated regeneration.

## Abuse and Failure Cases

Plan for:

- A user leaving Room Clarity running in a long meeting.
- A workspace connecting the app to recurring all-day calls.
- A script repeatedly calling `/api/analyze-cue`.
- Zoom webhook retries causing duplicate events.
- A user uploading very large transcripts.
- Payment becoming past due during an active meeting.
- Subscription cancellation while retention obligations still apply.

Default behavior should favor:

- preserving already-created meeting artifacts,
- preventing new spend,
- giving admins a clear path to resolve the issue.

## Privacy and Retention Interaction

Billing records should not contain transcript text.

Usage events may store:

- workspace id,
- meeting session id,
- timestamps,
- duration,
- model/provider,
- token counts,
- source type.

Usage events should not store:

- transcript content,
- meeting titles if avoidable,
- participant names unless required for admin reporting,
- model prompts or raw responses.

If a meeting is deleted, usage records can remain for billing/audit purposes but should refer to a deleted or anonymized meeting id according to the retention policy.

## Implementation Sequence

1. Add durable workspace, user, membership, and meeting-session ownership records.
2. Protect cost-bearing endpoints with workspace authorization.
3. Add entitlement records with manual/comped plans before Stripe.
4. Add usage ledger and billing-period aggregate.
5. Meter live RTMS analysis, uploaded transcript analysis, and brief generation.
6. Add soft-limit warnings in admin and host surfaces.
7. Add hard-next-meeting enforcement for manual plans.
8. Integrate Stripe checkout, portal, and subscription webhooks.
9. Add plan/pricing UI and workspace billing settings.
10. Add overage mode for team/business plans after usage reporting is trusted.
11. Add internal usage/cost dashboard and anomaly alerts.

## MVP Slice

The smallest useful version before full self-serve billing:

- Manual plan assignment per workspace.
- Included analysis hours.
- Usage ledger and aggregate.
- Admin-only usage readout.
- Soft warning near limit.
- Hard block for starting new analyzed meetings after limit.

This lets beta customers test plan limits without introducing payment complexity.

## Open Questions

- Should limits be per host, per workspace, or pooled by default?
- Should a paid plan include unlimited transcript uploads but capped live meetings, or should all analysis share one pool?
- Is the default Pro allowance closer to 25, 50, or 75 meeting hours per month?
- Should overage be enabled by default for teams, or require explicit admin opt-in?
- Should a meeting that starts under the limit always finish, even if it runs for several hours?
- Should post-meeting brief generation consume the same hour pool or a separate generation quota?
- What should happen to integrations and shared links when a subscription is canceled?
- Do annual plans get larger monthly pools, rollover, or only a discount?
- Is pricing anchored around active hosts, workspace seats, or shared meeting hours?
