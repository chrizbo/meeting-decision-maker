---
name: RTMS Timestamp Behavior
description: How Zoom RTMS webhook payloads carry timestamps and what fields to use for cue timing
type: project
---

## Key finding (2026-05-21)

Zoom RTMS webhook transcript payloads include three timestamp fields:
- `start_time` — Unix timestamp (ms) of when THIS transcript segment began. **Use this for cue start.**
- `end_time` — Unix timestamp (ms) of when THIS transcript segment ended. **Use this for cue end.**
- `timestamp` — Generic event-level Unix timestamp. This is the same value for every cue in a batch and must NOT be used as the cue's start time.

Using `payload.timestamp` (the old bug) caused all cues to hash to the same raw value, so `timestampToSeconds` returned 0 for every cue → all times displayed as 00:00.

**Why:** Confirmed from Zoom RTMS Event Reference docs. The SDK callback (`onTranscriptData`) passes `timestamp` as a `uint64_t` / separate param — unit is **microseconds** (confirmed by log inspection 2026-05-21: values ~1.779e15, which is Unix µs for 2026).

**How to apply:** When ingesting RTMS transcript webhooks, always use `payload.start_time || payload.timestamp || event.event_ts` — in that priority order. When ingesting via the SDK, the `timestamp` param IS the cue-specific timestamp. Pass `timestampUnit: 'us'` — NOT 'ns'. Using 'ns' causes all relative diffs to be ~microseconds wide, which floor to 00:00.

## Timestamp unit detection (server.js `transcriptTimestampUnit`)

The server auto-detects units by magnitude:
- ≥ 1e18 → ns
- ≥ 1e15 → µs
- ≥ 1e12 → ms
- ≥ 1e9 → s (Unix seconds)

All times are then converted to session-relative seconds by subtracting the first cue's timestamp.

## 00:00 debugging checklist

If all transcript entries show 00:00:
1. Check whether `payload.start_time` is present on the webhook payload — if missing, cues fall back to `payload.timestamp` (generic, same for all).
2. Check `state.firstTranscriptTimestamp` — if it equals every subsequent cue's timestamp, relative diff = 0 for all.
3. Check whether `normalizedTranscriptStart` fallback (`arrivalStart`) is working — if cues arrive in a rapid burst from a replay or batch, wall-clock arrival times may cluster near zero too.
