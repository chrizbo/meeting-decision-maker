# Future Spec: Product Analytics

## Status

Future consideration. Build before paid launch and before scaling Zoom Marketplace acquisition.

This spec defines how Room Clarity should measure product usage, onboarding, Zoom App installation health, activation, retention, billing conversion, and meeting value without collecting unnecessary meeting content.

It should be read with:

- `docs/future-specs/subscription-billing.md`
- `docs/future-specs/user-management-and-dashboards.md`
- `docs/auth-authorization-plan.md`
- `docs/security-launch-plan.md`
- `docs/zoom-marketplace-test-plan.md`

## Goal

Answer a few operational and product questions quickly:

- Are people finding the product?
- Are they installing the Zoom App successfully?
- Are they launching Room Clarity in a real Zoom meeting?
- Are they getting to a working meeting board?
- Are transcripts or RTMS starting successfully?
- Are users reviewing and trusting generated artifacts?
- Are users returning after the first meeting?
- Are paid users using enough meeting hours to feel value without creating cost surprises?
- Where do users fail or abandon setup?

Analytics should help the product team improve activation and trust. It should not become a surveillance layer over meeting content.

## Product Analytics Principles

- Track behavior and state transitions, not transcript content.
- Prefer durable server-side events for important funnel milestones.
- Use client-side events for UI interaction and friction signals.
- Keep event names stable and documented.
- Avoid sending meeting titles, transcript text, participant names, prompts, model responses, dashboard tokens, OAuth tokens, or repository tokens to analytics tools.
- Use hashed or internal IDs for users, workspaces, sessions, and installations.
- Treat Zoom install and RTMS success as a measurable funnel, not a support mystery.
- Make the first dashboard boring and useful: setup funnel, activation, meeting usage, conversion, retention, and failure rates.

## Recommended Tooling

### Option A: PostHog

Use PostHog for product analytics, funnels, feature flags, session replay where safe, surveys, and experiments.

Pros:

- Good all-in-one fit for an engineering-led product.
- Product analytics, funnels, feature flags, experiments, surveys, and optional session replay in one place.
- Useful for onboarding and activation funnel debugging.
- Can start small and grow usage-based.

Cons:

- Event volume and session replay can become cost drivers.
- Session replay must be disabled or heavily redacted on meeting surfaces.
- Needs clear event governance or the data gets noisy fast.

Recommended use:

- Best default for Room Clarity product analytics.
- Enable product analytics first.
- Use feature flags for staged rollouts.
- Disable session replay on live meeting boards and pages that may show sensitive meeting content unless redaction is proven.

### Option B: Google Analytics 4

Use GA4 for public website traffic, acquisition, referral, and simple conversion tracking.

Pros:

- Good fit for marketing site analytics and acquisition attribution.
- Familiar, free/low-cost starting point.
- Supports recommended and custom events.

Cons:

- Less pleasant for product analytics and activation debugging.
- Event parameter reporting can become awkward without careful setup.
- Should not receive meeting or workspace-sensitive product telemetry.

Recommended use:

- Use GA4 only for the public website and pricing/contact funnels.
- Do not use GA4 as the main app analytics system.

### Option C: Mixpanel

Use Mixpanel for focused product analytics, funnels, segmentation, and retention.

Pros:

- Strong product analytics and funnel analysis.
- Familiar to product teams.
- Good for user journey and retention questions.

Cons:

- Narrower than PostHog if we also want feature flags, surveys, and session replay in one stack.
- Event-volume pricing can become a planning concern.

Recommended use:

- Good alternative if we want a product-analytics-specific tool and do not need PostHog's broader stack.

### Option D: Segment

Use Segment as a customer data platform/event router if analytics destinations multiply.

Pros:

- Strong event collection and routing layer.
- Helpful if we need to send governed events to multiple tools, warehouse, CRM, and marketing systems.

Cons:

- More infrastructure and cost than needed at the start.
- Does not remove the need to define good events.

Recommended use:

- Defer until Room Clarity needs multiple downstream analytics/marketing destinations or a warehouse-centered data strategy.

## Recommendation

Use this sequence:

1. Start with a documented event taxonomy and server-side event logging in Room Clarity.
2. Add PostHog for app/product analytics, funnels, feature flags, and experiments.
3. Add GA4 for public website acquisition and pricing/contact conversion only.
4. Defer Segment until we need a CDP or event-routing layer.
5. Avoid session replay on meeting surfaces unless sensitive content redaction is tested and intentionally enabled.

## Analytics Architecture

Use two event paths:

### Product Analytics Events

Sent to the analytics provider for funnels and behavior analysis.

Rules:

- No transcript text.
- No meeting titles.
- No participant names.
- No raw emails unless the tool is explicitly configured for that and privacy policy covers it.
- No dashboard tokens, OAuth tokens, GitHub tokens, Zoom secrets, or model prompts.
- Include stable IDs and categorical metadata.

### Internal Audit and Operational Events

Stored in Room Clarity's own database for support, billing, security, and debugging.

Rules:

- More complete than product analytics, but still avoid transcript text unless the event is specifically part of meeting-state storage.
- Use for entitlement decisions, usage ledger, webhook troubleshooting, install health, and admin actions.
- Keep retention policy explicit.

## Identity and Grouping

Analytics should support:

- Anonymous visitor id for public website browsing.
- User id after login.
- Workspace id for Enterprise or personal workspace analysis.
- Zoom account id hash.
- Zoom user id hash.
- Zoom app installation id, where available.
- Meeting session id for event grouping.

Identity rules:

- Call `identify` only after authentication or explicit account creation.
- Use hashed provider IDs when sending to third-party analytics.
- Use `group` or equivalent for workspace-level analysis.
- Merge anonymous-to-known behavior only when consent and privacy policy allow it.

Suggested common properties:

```text
common_event_properties
- app_surface: marketing | browser_dashboard | zoom_app | api | admin
- environment: local | staging | production
- user_id_hash optional
- workspace_id_hash optional
- zoom_account_id_hash optional
- zoom_user_id_hash optional
- meeting_session_id_hash optional
- plan_key optional
- entitlement_status optional
- source: zoom_marketplace | direct | referral | demo | unknown
- app_version or git_sha optional
```

## Zoom Install and Activation Funnel

This is the most important first funnel.

Suggested funnel:

```text
zoom_marketplace_listing_viewed
zoom_install_started
zoom_install_completed
zoom_oauth_started
zoom_oauth_completed
zoom_app_opened
zoom_sdk_config_started
zoom_sdk_config_succeeded
zoom_user_context_received
zoom_meeting_context_received
session_create_started
session_create_succeeded
dashboard_ready
rtms_start_requested
rtms_started
transcript_cue_received
analysis_first_item_created
brief_opened
brief_copied
```

Some early events may not be directly observable if Zoom Marketplace does not expose them to us. In that case:

- Use inbound referrer/UTM parameters where available.
- Use OAuth callback completion as the first reliable install proxy.
- Use Zoom App launch as the first reliable usage proxy.
- Use internal support/admin logs to track known installation failures.

## Onboarding Funnel

For non-Zoom website and account setup:

```text
pricing_page_viewed
demo_board_opened
account_signup_started
account_signup_completed
google_login_started
google_login_completed
zoom_identity_link_started
zoom_identity_link_completed
stripe_checkout_started
stripe_checkout_completed
enterprise_inquiry_started
enterprise_inquiry_submitted
account_usage_page_viewed
```

Use these to see whether users understand the path from curiosity to first real meeting.

## Meeting Usage Events

Track the meeting lifecycle without content.

```text
meeting_session_created
meeting_runway_viewed
meeting_runway_skipped
meeting_live_board_viewed
transcript_ingestion_started
transcript_cue_received
analysis_cue_requested
analysis_cue_succeeded
analysis_cue_failed
board_item_created
board_item_updated
board_item_confirmed
board_item_dismissed
agent_issue_opened
agent_issue_discussed
recap_viewed
brief_generated
brief_item_excluded
brief_copied
meeting_session_ended
```

Safe properties:

```text
meeting_usage_properties
- meeting_duration_bucket
- transcript_source: zoom_rtms | upload | mock
- item_type: decision | risk | action | agent_issue
- item_status: forming | pending | accepted | rejected | discussed | dismissed
- model_provider
- model_name
- error_code optional
- count_decisions
- count_risks
- count_actions
- count_agent_issues
```

Do not send:

- item text,
- evidence text,
- transcript cue text,
- speaker names,
- meeting topic/title.

## Billing and Usage Events

Coordinate with `docs/future-specs/subscription-billing.md`.

```text
billing_checkout_started
billing_checkout_completed
billing_portal_opened
subscription_started
subscription_canceled
subscription_pause_requested
subscription_paused
subscription_resumed
payment_failed
payment_recovered
refund_requested
refund_issued
usage_warning_shown
usage_limit_reached
analysis_blocked_by_entitlement
```

Safe properties:

```text
billing_properties
- plan_key
- billing_interval: monthly | annual
- entitlement_status
- usage_percent_bucket
- remaining_hours_bucket
- stripe_event_type optional
```

Do not send:

- full payment details,
- card details,
- invoice PDFs,
- billing address unless needed and approved.

## Enterprise Inquiry Events

```text
enterprise_contact_viewed
enterprise_contact_started
enterprise_contact_submitted
enterprise_contact_failed
enterprise_inquiry_qualified
enterprise_inquiry_closed
```

Safe properties:

```text
enterprise_properties
- estimated_hosts_bucket
- estimated_hours_bucket
- primary_meeting_platform
- security_requirement_bucket
- desired_integrations_count
```

Do not send free-text notes to third-party product analytics. Store inquiry details in the app database and send only categorical/bucketed analytics properties.

## Setup Health Dashboard

The first internal dashboard should show:

- Website visitors to pricing/demo.
- Demo board opens.
- Account signup starts/completions.
- Stripe Checkout starts/completions.
- Enterprise inquiry starts/submissions.
- Zoom OAuth starts/completions.
- Zoom App launches.
- Session creation success/failure.
- RTMS start success/failure.
- First transcript cue received.
- First analysis item created.
- First brief copied.

Useful breakdowns:

- Surface: website, browser dashboard, Zoom App.
- Plan: demo, Individual, Enterprise/pilot.
- Auth path: Google, Zoom, linked.
- Browser/client type.
- Zoom account type where available.
- Error code.
- Day/week cohort.

## Activation Metrics

Track these as product-health metrics:

- Visitor to demo board rate.
- Demo board to signup rate.
- Signup to paid Individual rate.
- Enterprise contact completion rate.
- Zoom OAuth completion rate.
- Zoom App launch after install.
- Dashboard-ready rate after Zoom App launch.
- RTMS-start success rate.
- Transcript-first-cue success rate.
- First useful board item rate.
- Brief copied rate.
- Second meeting within 14 days.
- Paid user hours used in first 30 days.

Activation definition:

```text
activated_user
- signed in
- created or joined at least one real meeting session
- received at least one transcript cue
- generated at least one board item
- opened recap or copied a brief
```

For a lower-friction first activation definition:

```text
setup_activated_user
- signed in
- opened Zoom App
- created a dashboard session
```

## Error Taxonomy

Use stable error codes for setup and analytics.

Suggested setup error codes:

```text
zoom_sdk_config_failed
zoom_user_context_failed
zoom_meeting_context_failed
zoom_oauth_denied
zoom_oauth_callback_failed
session_create_failed
dashboard_token_invalid
rtms_start_unavailable
rtms_marketplace_permission_denied
rtms_webhook_signature_invalid
rtms_join_failed
transcript_timeout
analysis_provider_missing_key
analysis_provider_error
entitlement_required
usage_limit_reached
```

Do not use raw exception messages as analytics properties if they may include secrets, tokens, transcript text, or request bodies.

## Privacy and Consent

Analytics should be covered in privacy policy and in-product notices where needed.

Minimum privacy stance:

- No transcript text in third-party analytics.
- No meeting titles in third-party analytics.
- No participant names in third-party analytics.
- No model prompts or raw model responses in third-party analytics.
- Session replay off by default on authenticated meeting surfaces.
- Admin analytics access limited to support/admin roles.
- Enterprise customers can request analytics restrictions as part of contract terms.

## Event Governance

Create an event dictionary before implementation.

Suggested event dictionary fields:

```text
analytics_event_definition
- event_name
- description
- owner
- source: client | server | webhook | stripe | zoom | admin
- required_properties
- optional_properties
- forbidden_properties
- retention_class
- destination: posthog | ga4 | internal | warehouse
- added_at
- deprecated_at optional
```

Keep event names:

- lowercase,
- snake_case,
- past-tense for completed actions,
- stable after release.

## Implementation Sequence

1. Create an event dictionary in the repo.
2. Add server-side internal analytics event logging.
3. Add product analytics provider config, starting with PostHog.
4. Add GA4 only to public marketing/pricing/demo pages.
5. Instrument the Zoom install/activation funnel from the first reliable observable event.
6. Instrument account signup, Stripe Checkout, Enterprise inquiry, and billing portal events.
7. Instrument meeting lifecycle events without content.
8. Add setup health dashboard.
9. Add activation and retention dashboard.
10. Add internal alerting for install/setup failure spikes.
11. Add event QA checks so forbidden properties cannot be sent accidentally.

## Open Questions

- Can Zoom Marketplace provide install-start or install-complete analytics directly, or do we only see OAuth/app-launch proxies?
- Should the first product analytics provider be PostHog, Mixpanel, or a minimal internal-only logger?
- Should GA4 be used on the demo board or only public marketing pages?
- Should Enterprise customers be able to opt out of third-party product analytics?
- What event volume should trigger re-evaluating analytics costs?
- Should analytics events be mirrored to BigQuery or another warehouse later?

## References

- PostHog pricing and product surface: https://posthog.com/pricing
- Google Analytics recommended events: https://support.google.com/analytics/answer/9267735
- Segment pricing and CDP positioning: https://segment.com/pricing
- Mixpanel pricing and product analytics positioning: https://mixpanel.com/pricing
