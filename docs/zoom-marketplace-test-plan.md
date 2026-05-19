# Room Clarity Zoom Marketplace Test Plan

This test plan is for Zoom Marketplace review of the Room Clarity Zoom App. It is a Zoom-specific walkthrough for verifying the app installation, Zoom App launch flow, meeting-context usage, dashboard creation, app sharing/opening, and RTMS transcript path.

Zoom's test-plan guidance asks for a clear, step-by-step document that explains how to configure and use each requested Zoom API scope or app capability. Source: https://devforum.zoom.us/t/what-is-a-test-plan-and-how-should-you-approach-creating-it/75646

## App Summary

Room Clarity is a live meeting decision board. A meeting host launches the Zoom App during a Zoom meeting, creates a Room Clarity meeting session, and shares either the Zoom App surface or the generated dashboard URL with meeting participants. The board captures transcript cues and surfaces decisions, risks, action items, and red-team agent prompts.

Important RTMS status note: Room Clarity is still waiting for RTMS to be enabled for this app/account so the team can complete end-to-end live RTMS testing. The app and backend RTMS paths are implemented and ready to test, but live RTMS start may remain blocked by Zoom until access is granted.

Current production URL:

```text
https://roomclarity.com
```

Primary Zoom App URL:

```text
https://roomclarity.com/app
```

## Test Account and Credential Requirements

No separate Room Clarity account credentials are required for the current review flow.

Reviewers only need a Zoom account that can install and launch the Room Clarity Zoom App, then start or join a Zoom meeting where the app can be opened. The app creates a meeting session from Zoom meeting context and returns a scoped dashboard link for that session.

Room Clarity does not currently require reviewers to sign in to a separate Room Clarity account, and there is no seeded customer account or app-specific username/password to provide. Browser dashboard access is controlled by the session dashboard URL and token returned when the Zoom App creates the meeting session.

If Zoom review requires a user email to complete an OAuth/install step, use the reviewer Zoom account email associated with the Zoom test account. If a reviewer cannot install the app due to account pre-approval policy, the Zoom account owner/admin must approve the app installation first.

## Review Environment

Use the production deployment:

```text
https://roomclarity.com
```

Public support pages:

```text
Privacy Policy: https://roomclarity.com/privacy.html
Terms of Use: https://roomclarity.com/terms.html
Support: https://roomclarity.com/support.html
Documentation: https://roomclarity.com/documentation.html
Configuration: https://roomclarity.com/configure.html
```

Webhook endpoint configured in Zoom:

```text
https://roomclarity.com/api/zoom/rtms-webhook
```

OAuth redirect URL configured in Zoom:

```text
https://roomclarity.com/api/zoom/oauth/callback
```

## Requested Zoom Capabilities to Verify

The app flow uses these Zoom App capabilities:

- Install/authorize the Zoom App for use in the Zoom client.
- Launch the app inside a Zoom meeting.
- Read Zoom App user and meeting context through the Zoom Apps SDK.
- Read participant context when available to the host or co-host.
- Create a Room Clarity meeting session from the Zoom meeting context.
- Share the Zoom App surface or open the generated dashboard URL.
- Start, stop, and inspect RTMS status when Zoom grants the app access to RTMS APIs.
- Receive RTMS webhook events and transcript data in the backend.

## Test Scenario 1: Install and Authorize the App

Purpose: verify that the reviewer can install or authorize the Zoom App and complete the OAuth callback.

Steps:

1. Sign in to the Zoom App Marketplace with the Zoom reviewer account.
2. Open the Room Clarity app listing or development review install page.
3. Click the install/add option.
4. Approve the requested permissions.
5. Confirm the OAuth callback completes and shows a Room Clarity connected confirmation page.

Expected result:

- The reviewer can authorize the app without creating a separate Room Clarity account.
- The callback page confirms that Room Clarity is connected.
- If the Zoom account requires app pre-approval, Zoom shows the normal pre-approval request path.

## Test Scenario 2: Launch Room Clarity During a Zoom Meeting

Purpose: verify that the Zoom App loads inside the Zoom desktop client and can read meeting context.

Steps:

1. Open the Zoom desktop app.
2. Start a test Zoom meeting from the reviewer Zoom account.
3. In the Zoom meeting, open Apps.
4. Launch Room Clarity.
5. Wait for the Room Clarity board to load.
6. Confirm that the app shows the current meeting topic or meeting-session state.

Expected result:

- Room Clarity loads inside the Zoom client from `https://roomclarity.com/app`.
- The app initializes the Zoom Apps SDK.
- The app reads available meeting context and displays a meeting session instead of requiring app-specific credentials.

## Test Scenario 3: Create a Meeting Session and Dashboard Link

Purpose: verify that Room Clarity creates a backend meeting session from Zoom meeting context.

Steps:

1. Keep the Zoom test meeting open.
2. Launch Room Clarity if it is not already open.
3. Let the app finish loading and creating the meeting session.
4. Locate the dashboard URL shown in the app.
5. Open the dashboard URL from the app, or copy it into a browser.

Expected result:

- The app sends meeting context to `POST /api/sessions`.
- The backend returns a dashboard URL under `https://roomclarity.com/m/...`.
- The dashboard URL includes scoped access for the created session.
- The dashboard opens without requiring a separate Room Clarity login.

## Test Scenario 4: Share the App or Dashboard

Purpose: verify that the host can share the Room Clarity surface with meeting participants.

Steps:

1. From the Zoom meeting, keep Room Clarity open.
2. Use the app's sharing/open controls.
3. If the app surface is shared, confirm participants can see the Room Clarity board in Zoom.
4. If the dashboard URL is opened in a browser, share the browser window or provide the dashboard URL to test participants.

Expected result:

- The host can share the live decision board as the meeting artifact.
- Participants can view the shared surface or dashboard link chosen by the host.
- Participants do not need separate Room Clarity credentials for this current review flow.

## Test Scenario 5: Verify Browser Dashboard Behavior

Purpose: verify that the generated dashboard works outside the Zoom client for viewing and review.

Steps:

1. Open the generated dashboard URL in a normal browser.
2. Confirm the board loads.
3. Confirm the dashboard shows decisions, risks, action items, agent prompts, and transcript state when data is available.
4. Refresh the browser page.
5. Confirm the dashboard still loads with the tokenized session URL.

Expected result:

- The dashboard is viewable in a standard browser.
- The dashboard does not attempt to start Zoom-only SDK actions outside Zoom.
- Browser mode is available for viewing or screen sharing, but RTMS start controls are only available inside Zoom.

## Test Scenario 6: Start RTMS From the Zoom App

Purpose: verify the app's RTMS control path, subject to Zoom granting RTMS API access for the app. Room Clarity is still waiting for RTMS to be enabled so this end-to-end scenario may not be fully testable yet.

Steps:

1. Start a Zoom test meeting.
2. Launch Room Clarity from the Zoom Apps panel.
3. Confirm the app status area shows RTMS controls or status.
4. Click Start RTMS.
5. If Zoom prompts for host/admin consent or disclosure, approve the prompt.
6. Speak a few short test sentences in the meeting, including one clear decision and one action item.
7. Watch the Room Clarity dashboard for transcript-derived updates.
8. Click Stop RTMS when finished.

Expected result when RTMS is available:

- The app calls the Zoom Apps SDK RTMS start method.
- Zoom sends RTMS webhook events to `https://roomclarity.com/api/zoom/rtms-webhook`.
- The Room Clarity backend joins the RTMS stream.
- Transcript cues appear in the dashboard state.
- Decision, risk, action, or agent-prompt cards update from the transcript.
- Stopping RTMS ends the stream and updates the app status.

Expected result if RTMS is not yet granted:

- Zoom may return an error such as `40316` indicating that the API has not passed marketplace verification or entitlement review.
- The app remains usable as a launcher and dashboard.
- The backend remains configured for RTMS, but live transcript ingestion cannot start until Zoom grants the app RTMS access.
- This is the currently expected limitation until RTMS is enabled for Room Clarity.

## Test Scenario 7: Verify RTMS Webhook URL Validation

Purpose: verify that Zoom can validate the configured RTMS webhook endpoint.

Steps:

1. In the Zoom App Marketplace build configuration, open the RTMS/event subscription settings.
2. Confirm the event notification endpoint is:

   ```text
   https://roomclarity.com/api/zoom/rtms-webhook
   ```

3. Use Zoom's endpoint validation flow.

Expected result:

- Zoom receives a valid encrypted response for endpoint validation.
- Signed runtime webhook events are accepted only when their timestamp and signature are valid.

## Test Scenario 8: Verify Support and Policy Pages

Purpose: verify that required Marketplace support and policy links are reachable.

Steps:

1. Open `https://roomclarity.com/privacy.html`.
2. Open `https://roomclarity.com/terms.html`.
3. Open `https://roomclarity.com/support.html`.
4. Open `https://roomclarity.com/documentation.html`.
5. Open `https://roomclarity.com/configure.html`.

Expected result:

- Each page loads over HTTPS.
- The pages explain privacy, terms, support, documentation, and configuration basics for the app.

## Fresh-User Review Checklist

Before submitting or resubmitting for Zoom review, run this plan with a fresh Zoom user or test Zoom account:

- The reviewer can install or authorize the app.
- The reviewer does not need separate Room Clarity credentials.
- The app launches inside an active Zoom meeting.
- A dashboard URL is created from the Zoom meeting context.
- The dashboard URL opens in a browser.
- App sharing or browser screen sharing works.
- RTMS controls either start successfully or show the expected Zoom entitlement/verification message.
- Public support, documentation, privacy, terms, and configuration pages are reachable.
- The developer contact email for the Zoom Marketplace submission is actively monitored.

## Notes for Zoom Review

Room Clarity is currently designed for the host-led meeting flow. A reviewer should test from inside a Zoom meeting because the app depends on Zoom App launch context to create the intended live meeting session.

The current flow can be used with anyone after the host launches the Zoom App and shares the dashboard or app surface. A separate Room Clarity account is not required for participants or reviewers in this version.

RTMS functionality depends on Zoom granting access to the relevant RTMS APIs. If RTMS start is blocked during review, the remaining Zoom App launcher, meeting-session creation, dashboard sharing, browser dashboard, and webhook configuration paths are still testable.
