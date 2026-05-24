# Future Spec: Subscription Billing and Usage Limits

## Status

Future consideration. Do not implement before the auth, workspace, and durable session model exists.

This spec is intended to shape the product and system requirements for a paid Room Clarity subscription model. It should be read with:

- `docs/future-specs/user-management-and-dashboards.md`
- `docs/auth-authorization-plan.md`
- `docs/security-launch-plan.md`
- `docs/model-evaluation-notes.md`
- `docs/google-cloud-run-hosting.md`

## Goal

Support a subscription business model that prices Room Clarity around meeting value while protecting the service from unbounded LLM, transcript, storage, support, and abuse costs.

The first paid model should feel simple to buyers:

- A plan includes a monthly pool of meeting analysis hours.
- Extra usage is softly blocked after warnings and handled manually.
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

Start with two public bundles:

| Plan | Buyer | Included meeting analysis | Suggested price | Notes |
| --- | --- | ---: | ---: | --- |
| Individual Monthly | Individual host | 50 hours / month | $39 / month | Self-serve subscription for PMs, managers, founders, consultants, and other meeting-heavy operators. |
| Individual Annual | Individual host | 50 hours / month | $399 / year | Annual version of the Individual plan. Assumption: `$399/year`, not `$3.99/year`. |
| Enterprise | Team or organization | Contracted pooled hours | Contact us | Shared workspace, admin controls, security review, retention configuration, integrations, procurement, and negotiated support. |

The first public paid package should be:

- `Demo`: synthetic demo board only. No real transcript upload, no live RTMS, no retained real meeting data, and no LLM-backed real meeting analysis.
- `Individual Monthly`: one user, $39/month, 50 meeting analysis hours/month.
- `Individual Annual`: one user, $399/year, 50 meeting analysis hours/month.
- `Enterprise`: contact-us flow that creates a sales/support lead and later provisions a contracted workspace entitlement.

Avoid showing token costs or model names in plan language unless the buyer is technical. Users think in meeting hours and team workflows.

## Trial, Refund, Cancellation, and Pause Rules

Do not offer a time-limited or credit-card trial at first.

The free evaluation path is the demo board with synthetic data. If a user wants Room Clarity for real meetings, they should buy Individual or contact us for Enterprise.

Cancellation rules:

- A canceled paid subscription remains active until the end of the paid billing period.
- Existing meeting boards and briefs remain readable after cancellation, subject to the retention policy and access permissions.
- New analyzed meetings are blocked after the paid period ends unless the subscription is resumed, renewed, comped, or converted to an Enterprise entitlement.

Refund rule:

- Allow refund requests during the first 7 days after the first paid purchase.
- Refunds should be handled through Stripe where possible.
- Refunded accounts should keep read-only access to already-created boards until retention removes them, but should not be able to start new analyzed meetings without an active entitlement.

Pause rule:

- Support a `paused` subscription/entitlement state so a user can stop using Room Clarity for a while and resume later.
- During pause, existing boards and briefs remain readable.
- During pause, new analyzed meetings are blocked.
- For Stripe-backed Individual subscriptions, prefer Stripe's pause/resume subscription behavior when it fits the billing model; otherwise mirror the pause in Room Clarity entitlements and keep Stripe as the payment source of truth.

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
- After the meeting, require renewal, admin action, or a manual Enterprise conversation before starting more analyzed meetings.
- Keep read-only access to existing meetings and briefs even when the subscription is expired or over limit, subject to retention policy.

For early beta, prefer soft limits and manual outreach. For self-serve paid plans, add explicit enforcement.

## Limit Modes

Support three limit modes at the plan/workspace level:

```text
usage_limit_mode
- soft: warn only
- hard_next_meeting: allow current meeting to finish, block new analyzed sessions
```

Suggested defaults:

- Demo: no real analysis allowed
- Individual: `hard_next_meeting` with easy upgrade or billing management
- Enterprise: no automatic overage at first; warn and handle excess usage case-by-case

## Required Product Surface

### In-App Usage Visibility

Hosts and workspace admins need a simple usage view:

- Current plan.
- Included hours this billing period.
- Used hours.
- Remaining hours.
- Reset date.
- Whether the subscription is active, paused, canceled, past due, comped, or pilot.
- Upgrade/manage billing action.

Host-facing meeting UI should be restrained:

- Show a small warning when the workspace is near limit.
- Avoid scary banners during an active meeting.
- If new analysis is blocked, make it clear that existing boards and briefs remain viewable.

### Profile and Usage Page

Each signed-in user should have a profile or account page that shows:

- Authentication methods connected to the account, such as Google and Zoom.
- Current subscription or entitlement state.
- Billing period reset date.
- Meeting analysis hours used in the current period.
- Included meeting analysis hours.
- Recent meetings contributing to usage.
- Manage billing action for Stripe Customer Portal when applicable.
- Pause or resume subscription action when supported.
- Contact support action for refunds, usage questions, Enterprise inquiries, and manual overrides.

### Billing Management

Workspace admins need:

- Start subscription.
- Choose monthly or annual Individual billing.
- Update payment method.
- Cancel subscription.
- Pause or resume subscription where supported.
- View invoices.
- See usage by billing period.

Use a hosted billing portal rather than building full invoice/payment management in the app.

### Enterprise Contact Form

The Enterprise pricing CTA should open a Room Clarity-owned contact-us form rather than a direct checkout flow.

The form should collect only what is needed to qualify and follow up:

- Work email.
- Name.
- Company or organization.
- Role.
- Estimated number of meeting hosts.
- Estimated meeting analysis hours per month.
- Primary meeting platform.
- Security or compliance requirements.
- Desired integrations.
- Free-text notes.

Submitting the form should:

- Create an `enterprise_inquiry` record.
- Send an internal notification to the owner/support address.
- Send the requester a short confirmation email.
- Show a confirmation page with expected response timing.

The first implementation can send email only. A later version can sync the inquiry to a CRM, spreadsheet, or support system.

Suggested record:

```text
enterprise_inquiry
- id
- workspace_id optional
- user_id optional
- email
- name
- company
- role optional
- estimated_hosts optional
- estimated_analysis_hours_per_month optional
- meeting_platform optional
- security_requirements optional
- desired_integrations optional
- notes optional
- source_page
- status: new | contacted | qualified | closed
- created_at
- updated_at
```

Enterprise inquiry forms should be rate-limited and protected against spam. Do not ask for sensitive meeting content, transcript samples, or secrets in the form.

### Plan Education

Pricing copy should explain meeting hours in plain language:

```text
Meeting analysis hours are counted only while Room Clarity is actively analyzing a live or uploaded meeting transcript. Viewing boards, editing recaps, and reading briefs do not count against your monthly hours.
```

## Required System Additions

### Billing Provider

Use Stripe as the billing provider for self-serve Individual subscriptions.

Required capabilities:

- Stripe Checkout session creation for the Individual monthly and annual subscriptions.
- Stripe Customer Portal session creation for payment method, invoice, cancellation, and subscription management.
- Stripe Tax enabled from the beginning, even while sales are US-only.
- Subscription status webhooks.
- Invoice/payment status webhooks.
- Price IDs mapped to internal plans, starting with `individual_monthly` and `individual_annual`.
- Test-mode billing environment.
- Idempotent webhook handling.

Keep the billing provider as the payment and subscription event source, but keep entitlement decisions inside Room Clarity.

Stripe should not be the only source of product permissions. Stripe tells Room Clarity whether a subscription is active, past due, canceled, or trialing. Room Clarity decides the workspace entitlement: included hours, limit mode, overage, feature flags, retention options, and admin roles.

The first launch should be US-only. Stripe Tax should still be enabled so tax calculations, customer location handling, and future expansion do not need to be retrofitted.

Enterprise should not go through self-serve Stripe Checkout at first. Use the contact form plus manual or contract-backed entitlement provisioning. Stripe invoices or custom subscriptions can be added for Enterprise later when contracting and procurement needs are clearer.

Suggested Stripe objects:

```text
stripe_product
- Room Clarity Individual

stripe_price
- individual_monthly: $39 / month
- individual_annual: $399 / year

stripe_webhook_events
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

### User Subscription and Entitlements

Individual subscriptions should be tied to a user account.

For implementation consistency, each paid user can still have a personal workspace behind the scenes, but the commercial entitlement belongs to the user. Enterprise entitlements can belong to an organization/workspace.

Add a durable subscription record per paying user:

```text
user_subscription
- user_id
- plan_key: individual_monthly | individual_annual
- status: active | past_due | canceled | paused | refunded
- billing_provider: stripe
- billing_customer_id
- billing_subscription_id
- current_period_start
- current_period_end
- included_analysis_seconds
- used_analysis_seconds cached optional
- cancel_at_period_end
- pause_collection_state optional
- first_paid_at optional
- refund_window_ends_at optional
- updated_at
```

Add durable entitlement records that can represent user, workspace, or manual access:

```text
entitlement
- workspace_id
- user_id optional
- plan_key
- status: active | past_due | canceled | paused | comped | pilot | internal_test | suspended
- billing_provider: stripe | manual | contract
- billing_customer_id optional
- billing_subscription_id optional
- enterprise_inquiry_id optional
- current_period_start
- current_period_end
- included_analysis_seconds
- usage_limit_mode
- feature_flags
- updated_at
```

Entitlements should be cached carefully but always recoverable from durable storage.

Internal admin controls should support:

- Comped access.
- Pilot access.
- Manual trial access, even though the public flow does not offer trials.
- Internal test access.
- Suspended access for abuse or payment problems.
- Manual extension of a billing period or usage allowance.
- Read-only account state.

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
- user_id optional
- workspace_id optional
- period_start
- period_end
- included_analysis_seconds
- used_analysis_seconds
- excess_analysis_seconds
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
- active user subscription, Enterprise entitlement, pilot, internal test, or comped access
- included hours remaining
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

### Dunning and Payment Failure

Use a 7-day grace period after payment failure.

During the grace period:

- Existing boards and briefs remain readable.
- New analyzed meetings may continue until grace expires, unless abuse controls require earlier blocking.
- Profile/billing surfaces should show the failed-payment state and direct the user to Stripe Customer Portal.

After the grace period:

- Existing boards and briefs remain readable.
- New analyzed meetings are blocked.
- The user can restore access by resolving payment in Stripe or receiving an admin override.

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
- Do not charge automatic overage in the first launch.

## Abuse and Failure Cases

Plan for:

- A user leaving Room Clarity running in a long meeting.
- A workspace connecting the app to recurring all-day calls.
- A script repeatedly calling `/api/analyze-cue`.
- Zoom webhook retries causing duplicate events.
- A user uploading very large transcripts.
- Payment becoming past due during an active meeting.
- Subscription cancellation while retention obligations still apply.
- A user pausing and later resuming after meeting boards have accumulated.

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
2. Protect cost-bearing endpoints with user and workspace authorization.
3. Add user subscriptions and entitlement records with manual/comped/pilot/internal-test states before Stripe.
4. Add usage ledger and billing-period aggregate.
5. Meter live RTMS analysis, uploaded transcript analysis, and brief generation.
6. Add soft-limit warnings in admin and host surfaces.
7. Add hard-next-meeting enforcement for manual plans.
8. Add Enterprise contact-us form and `enterprise_inquiry` persistence.
9. Integrate Stripe Checkout, Customer Portal, Stripe Tax, and subscription webhooks for Individual monthly and annual.
10. Add plan/pricing UI and workspace billing settings.
11. Add cancellation-at-period-end, pause/resume, first-7-day refund support, and 7-day dunning behavior.
12. Add internal usage/cost dashboard and anomaly alerts.

## MVP Slice

The smallest useful version before full self-serve billing:

- User account model with Google login and Zoom account linking.
- Manual plan assignment per workspace.
- Enterprise inquiry form with email notification.
- Included analysis hours.
- Usage ledger and aggregate.
- Profile/account usage readout.
- Admin-only override readout.
- Soft warning near limit.
- Hard block for starting new analyzed meetings after limit.

This lets beta customers test plan limits without introducing payment complexity.

## Open Questions

- Should Individual subscriptions be allowed to operate multiple personal workspaces, or exactly one?
- Should a paid plan include unlimited transcript uploads but capped live meetings, or should all analysis share one pool?
- Is 50 meeting analysis hours the right Individual allowance at $39/month and $399/year?
- Should a meeting that starts under the limit always finish, even if it runs for several hours?
- Should post-meeting brief generation consume the same hour pool or a separate generation quota?
- What should happen to integrations and shared links when a subscription is canceled?
- Should annual plans get larger monthly pools, rollover, or only a discount?
- Should Enterprise pricing anchor around active hosts, workspace seats, shared meeting hours, or a flat annual platform fee?
