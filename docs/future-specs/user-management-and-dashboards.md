# Future Spec: User Management and Dashboards

## Status

Future consideration. Build before self-serve billing and real meeting data retention.

This spec defines options for user accounts, login providers, customer account pages, billing surfaces, and internal admin dashboards. It should be read with:

- `docs/auth-authorization-plan.md`
- `docs/future-specs/subscription-billing.md`
- `docs/security-launch-plan.md`
- `docs/future-specs/meeting-library.md`

## Goal

Add a user management system that supports:

- Individual paid users.
- Zoom and Google login.
- Linking a Zoom identity to a Google-authenticated account.
- Profile and usage transparency.
- Internal admin controls for comped, pilot, trial, suspended, and internal-test access.
- Enterprise inquiry handling.
- Off-the-shelf dashboards where practical.

The first version should avoid building a custom admin console unless the off-the-shelf tools create more operational risk than they remove.

## Product Decisions

Current direction:

- Free access is the synthetic demo board only.
- Real meeting analysis requires a signed-in user with an active entitlement.
- Individual subscriptions are tied to a user account.
- A paid Individual user may have a personal workspace behind the scenes, but the subscription belongs to the user.
- Enterprise access is provisioned manually or by contract after a contact-us inquiry.
- Google and Zoom should both be supported at launch if feasible.

## User Model

Use an app-owned user record even if authentication is delegated to a provider.

```text
user
- id
- primary_email
- display_name optional
- avatar_url optional
- auth_provider_user_id optional
- created_at
- updated_at
- last_login_at
- status: active | read_only | suspended | deleted
```

Identity links:

```text
user_identity
- id
- user_id
- provider: google | zoom | email | github | sso
- provider_subject
- email optional
- display_name optional
- access_token_ref optional
- refresh_token_ref optional
- scopes
- connected_at
- last_used_at
```

Rules:

- One human should have one Room Clarity user even if they sign in with Google and later launch from Zoom.
- Account linking should be explicit when two identities share an email but were created separately.
- Store OAuth tokens server-side only.
- Store provider subject IDs, not just email, because emails can change.
- Use the app-owned user id for subscriptions, usage, meetings, and admin overrides.

## Workspace Model

Keep a lightweight workspace model even for Individual.

```text
workspace
- id
- name
- type: personal | enterprise | internal
- owner_user_id
- created_at
- updated_at
```

```text
membership
- workspace_id
- user_id
- role: owner | admin | host | viewer | billing_admin | support_admin
- status: active | invited | removed
- created_at
- updated_at
```

Rationale:

- Individual can start as a one-person personal workspace.
- Enterprise can later add shared libraries, pooled hours, admin controls, SSO, and multiple hosts without replacing the data model.
- Meeting sessions, dashboards, briefs, and integrations can belong to a workspace while the Individual commercial subscription remains tied to the user.

## Login Options

### Option A: Clerk

Use Clerk for hosted user authentication, account management components, Google sign-in, organizations if needed, and user metadata.

Pros:

- Fastest path to polished sign-in and account management.
- Good fit for Google login and future organization features.
- Reduces custom auth UI and session handling.
- Supports user metadata and account linking patterns.

Cons:

- Another vendor in the critical path.
- Zoom identity still likely needs custom linking.
- Need to decide whether to use Clerk billing features or keep Stripe directly. Current direction is to keep Stripe directly.

Recommended use:

- Customer sign-in and profile identity.
- Google login.
- Email login if needed later.
- Keep Stripe Billing and Room Clarity entitlements separate.

### Option B: Firebase Authentication / Google Identity Platform

Use Firebase Authentication or Google Cloud Identity Platform for Google sign-in and user sessions.

Pros:

- Fits the current Google Cloud and Firestore deployment direction.
- Firebase Authentication supports federated sign-in providers such as Google.
- Pricing can be favorable at early scale.
- Fewer platform vendors if Firestore remains the durable database.

Cons:

- More custom product UI than Clerk.
- Organization/workspace UX and admin flows are more app-owned.
- Zoom identity linking remains custom.

Recommended use:

- Good pragmatic default if we want fewer vendors and are comfortable building the account page ourselves.

### Option C: Auth0 / Okta Customer Identity

Use Auth0 for customer identity, social login, enterprise auth path, and future SSO.

Pros:

- Strong enterprise identity story.
- Mature auth platform for customer identity, social login, and SSO.
- Useful if Enterprise SSO becomes important quickly.

Cons:

- More enterprise-oriented operational overhead.
- Can become expensive or complex earlier than needed.
- Overkill for the first Individual + Google + Zoom path.

Recommended use:

- Revisit when Enterprise SSO becomes an actual buyer requirement.

### Option D: App-Owned Auth with Auth.js

Use an app-owned auth layer with Auth.js or similar, backed by Firestore/Cloud SQL.

Pros:

- More control.
- Fewer paid auth vendors.
- Direct support for custom providers such as Zoom and Google.

Cons:

- More security and maintenance responsibility.
- More custom UI.
- Slower than using a hosted auth provider.

Recommended use:

- Only if hosted auth vendors create unacceptable constraints around Zoom linking, cost, or data control.

## Recommendation

Start with **Clerk** if speed and polished account UX matter most.

Start with **Firebase Authentication / Google Identity Platform** if vendor simplicity and Google Cloud alignment matter most.

My product-engineering preference:

1. Use Clerk for customer login and user profile if the first goal is to ship self-serve Individual billing quickly.
2. Link Zoom identities inside Room Clarity as `user_identity` records after Zoom OAuth or Zoom App launch.
3. Keep Stripe Billing direct rather than routing billing through the auth provider.
4. Keep the Room Clarity user, workspace, subscription, entitlement, and usage records as the product source of truth.

## Account Linking

Required flows:

### Google First

1. User signs in with Google.
2. Room Clarity creates `user`, `user_identity(provider=google)`, and personal `workspace`.
3. User starts Stripe Checkout for Individual.
4. User later launches Room Clarity in Zoom.
5. Zoom identity is linked to the existing user after explicit confirmation.

### Zoom First

1. User launches Room Clarity from Zoom.
2. Room Clarity receives Zoom identity context or completes Zoom OAuth.
3. If no matching Room Clarity user exists, ask the user to create or sign into an account.
4. User signs in with Google or another supported method.
5. Room Clarity links `user_identity(provider=zoom)`.

### Matching Rule

Email match is a hint, not the only proof.

When a Zoom identity email matches an existing Google-authenticated user, show a clear account-linking confirmation before attaching the identity.

## Customer Account Page

Build a small customer-facing account/profile page inside Room Clarity.

Suggested route:

```text
/account
```

Sections:

- Profile.
- Connected accounts.
- Subscription.
- Usage.
- Meeting access and retention.
- Support.

Profile should show:

- Name.
- Email.
- Authentication providers.
- Connected Zoom identity, if any.

Subscription should show:

- Plan.
- Monthly or annual billing.
- Status: active, paused, past due, canceled, comped, pilot, internal test, suspended.
- Billing period end.
- Manage billing button to Stripe Customer Portal.
- Pause/resume where supported.
- Cancel state and period-end access explanation.

Usage should show:

- Used meeting analysis hours this period.
- Included meeting analysis hours.
- Reset date.
- Recent meetings contributing to usage.
- Warning when usage is near limit.

Support should show:

- Refund request path for the first 7 days.
- Enterprise contact path.
- Billing support email.
- Data deletion or retention request path.

## Internal Admin Dashboards

Prefer off-the-shelf dashboards for internal operations.

### Dashboard Needs

Internal admins need to:

- Search users by email, name, provider id, Stripe customer id, or Zoom id.
- View user identities and account links.
- View current subscription, entitlement, usage, and reset date.
- Apply manual states: comped, pilot, manual trial, internal test, suspended, read-only.
- Adjust included hours or period end.
- Review Enterprise inquiries.
- Mark Enterprise inquiries as contacted, qualified, closed.
- Inspect meeting/session metadata without exposing transcript text by default.
- Trigger support actions such as resend confirmation, revoke dashboard token, or open Stripe customer.

### Option A: Retool

Use Retool for internal admin dashboards.

Pros:

- Fastest path to internal tools over Firestore/Cloud SQL/APIs.
- Built for admin panels, dashboards, workflows, and operational tooling.
- Permission controls and audit logging are available on higher plans.

Cons:

- Per-user pricing can grow if many internal users need access.
- Another vendor with access to internal operational data.
- Needs careful permissions so transcript content is not casually exposed.

Recommended use:

- Best first choice for internal admin if only a small number of operators need access.

### Option B: Forest Admin

Use Forest Admin as a structured back-office layer over the app data model.

Pros:

- Purpose-built admin/back-office product.
- Strong fit for CRUD over user, entitlement, inquiry, and usage records.
- Governance, permissions, and audit-log oriented.

Cons:

- Less flexible than Retool for custom workflow screens.
- Pricing may be more than needed for a tiny internal team.

Recommended use:

- Good alternative if the data model is stable and the need is mostly admin CRUD, review, and operational governance.

### Option C: Stripe Dashboard + Minimal App Admin

Use Stripe Dashboard for billing and build only a very small Room Clarity admin page for entitlements and usage.

Pros:

- Lowest vendor count.
- Stripe already has excellent customer, invoice, subscription, refund, and payment failure views.
- Room Clarity only builds the product-specific parts Stripe cannot know.

Cons:

- Split-brain operations: billing in Stripe, usage/entitlements in Room Clarity.
- Internal support may need to jump between systems.
- Custom admin still needs security, audit logs, and careful permissions.

Recommended use:

- Good MVP if admin needs are light and only the founder/operator is using it.

### Option D: Appsmith / ToolJet / Budibase

Use an open-source or lower-cost internal tool builder.

Pros:

- More deployment and cost control.
- Can self-host if needed.
- Flexible enough for dashboards and operations.

Cons:

- More setup and maintenance than Retool.
- Polished permissions, audit, and hosting may require more work.

Recommended use:

- Consider if Retool pricing or data-access constraints become uncomfortable.

## Dashboard Recommendation

Use this sequence:

1. **Stripe Dashboard** for early billing operations.
2. **Small internal admin route** only for manual entitlement states that Stripe cannot manage.
3. **Retool** once usage, inquiries, and support operations become too annoying to manage manually.
4. Revisit Forest Admin if governance and back-office auditability become more important than workflow flexibility.

Do not expose raw transcript content in any off-the-shelf admin dashboard by default. Admin views should show meeting metadata, usage, and generated artifact counts first, with transcript access requiring a separate elevated action and audit log.

## Data and Security Rules

- Admin actions must require service-admin or support-admin role.
- Admin changes should create append-only audit events.
- Admin dashboards should use least-privilege service accounts or API scopes.
- Usage and billing views should avoid raw transcript text.
- OAuth tokens, Stripe webhook secrets, dashboard tokens, and model keys should never appear in dashboards.
- Manual entitlement changes should record actor, reason, before state, after state, and timestamp.

Suggested audit record:

```text
admin_audit_event
- id
- actor_user_id
- action
- target_type
- target_id
- reason optional
- before_state_hash optional
- after_state_hash optional
- created_at
```

## Implementation Sequence

1. Choose auth provider: Clerk or Firebase Authentication / Google Identity Platform.
2. Add `user`, `user_identity`, `workspace`, and `membership` records.
3. Add Google login.
4. Add Zoom identity linking.
5. Add `/account` page with profile, connected accounts, subscription, usage, and support sections.
6. Add user-tied subscription and entitlement checks.
7. Add Stripe Customer Portal link from `/account`.
8. Add Enterprise inquiry records and admin review flow.
9. Add manual internal admin route for comped, pilot, trial, suspended, and internal-test states.
10. Move internal admin operations to Retool or Forest Admin when manual routes become too limiting.

## Open Questions

- Should the first auth provider be Clerk or Firebase Authentication / Google Identity Platform?
- Should Zoom login be a true sign-in method or only a connected identity after Google login?
- Should every Individual user get exactly one personal workspace?
- Should account deletion remove the user record or mark it deleted while preserving billing/audit records?
- Which internal admin actions require two-step confirmation?
- Should Enterprise admins eventually manage members in Room Clarity, or should that wait for SSO?

## References

- Clerk pricing and feature surface: https://clerk.com/pricing
- Firebase Authentication docs: https://firebase.google.com/docs/auth/
- Firebase pricing: https://firebase.google.com/pricing
- Auth0 pricing: https://www.okta.com/pricing/auth0/
- Retool pricing and internal tools positioning: https://retool.com/pricing
- Forest Admin pricing and back-office positioning: https://www.forestadmin.com/pricing
