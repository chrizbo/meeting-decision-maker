# LLM Integration Notes

The static prototype now prefers `fixtures/mock-llm-output.json` to simulate extraction and agent behavior. Deterministic keyword rules remain in `app.js` only as a fallback for direct file opening or fixture load failures.

The intended production path is to use a real LLM worker for two related jobs:

1. Extraction skills identify meeting artifacts:
   - `skills/identify-decisions/SKILL.md`
   - `skills/identify-risks/SKILL.md`
   - `skills/identify-action-items/SKILL.md`

2. Red-team skills generate queued interventions:
   - `skills/assumptions-challenge/SKILL.md`
   - `skills/pre-mortem/SKILL.md`
   - `skills/argument-dissection/SKILL.md`

The meeting backend should load `skills/manifest.yaml`, then invoke the appropriate skill with a transcript cue, transcript window, or full transcript. Each skill folder contains a machine-readable config file:

- `extractor.yaml` for extraction skills
- `agent.yaml` for red-team agent skills

A likely processing loop is:

1. Receive or replay a transcript cue.
2. Build a rolling transcript window around the cue.
3. Run extraction skills to update decisions, risks, and actions.
4. Run red-team agent skills against current meeting state and recent transcript context.
5. Return structured records to the shared board.
6. Let the host confirm, dismiss, or open guidance on each item.

The LLM should preserve evidence, including timestamp and speaker when available, and should avoid inventing owners, decisions, or agreement that are not supported by the transcript.

## Gemini Cue Analysis

The service exposes `POST /api/analyze-cue` as the first live worker boundary. The browser calls it once per newly played cue when `GEMINI_API_KEY` is configured.

Each request includes:

- `cue`: the new transcript cue that just became active.
- `transcriptWindow`: cues from the last 90 seconds, capped at 12 cues, including the current cue.
- `meetingState`: compact lists of current decisions, risks, actions, and open agent issues, including IDs, status, summaries, and evidence.

The backend loads `skills/manifest.yaml`, reads each referenced `SKILL.md`, and sends those instructions with the cue block to Gemini. The default model is `gemini-2.5-flash-lite`; set `GEMINI_MODEL` to use another Gemini API model.

Gemini can either create a new board item or update an existing one:

- Use `updateMode: "create"` for genuinely new decisions, risks, actions, or agent issues.
- Use `updateMode: "update"` plus `targetId` when the latest cue changes the status, wording, evidence, or nuance of an existing item.

This same boundary should be reused for Zoom RTMS. A live Zoom transcript handler should normalize incoming transcript events into cue objects, append them to the meeting transcript buffer, build the rolling window, and call the analyzer. The shared board can then consume the same item shape whether the source was mock playback, uploaded VTT/TXT, or Zoom live transcript data.


## Structured Contracts

- `schemas/llm-output.schema.json` describes the mock output contract the board can consume now and the future LLM worker should emit.
- `schemas/meeting-state.schema.json` describes the dashboard state after host confirmation, including pending/accepted decisions, open/discussed agent issues, and the audit tray.
- Decisions should enter the board as `pending` until the host accepts or rejects them.
- Agent discussion detection should only set a suggestion flag. The host confirms with Discussed or Dismissed.
