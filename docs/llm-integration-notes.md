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

## Cue Analysis Providers

The service exposes `POST /api/analyze-cue` as the first live worker boundary. The browser calls it once per newly played mock/uploaded cue when an LLM provider key is configured. The RTMS backend path calls the same provider-neutral analyzer after receiving Zoom transcript callbacks.

Each request includes:

- `cue`: the new transcript cue that just became active.
- `transcriptWindow`: cues from the last 90 seconds, capped at 12 cues, including the current cue.
- `meetingState`: compact lists of current decisions, risks, actions, and open agent issues, including IDs, status, summaries, and evidence.

The backend loads `skills/manifest.yaml`, reads each referenced `SKILL.md`, and sends those instructions with the cue block to the selected provider. The default provider is Gemini with `gemini-2.5-flash-lite`; set `GEMINI_MODEL` to use another Gemini API model. Set `LLM_PROVIDER=openai` and `OPENAI_MODEL=gpt-5.4` to make OpenAI the default provider. OpenAI reasoning defaults to `low`; set `OPENAI_REASONING_EFFORT` for quality/latency experiments. Eval sweeps can override the provider per cue with model strings like `gemini:gemini-2.5-flash-lite`, `openai:gpt-5.4`, or `openai:gpt-5.5`.

Keep `gemini-2.5-flash-lite` as the regular live cue extraction model unless a future eval shows a large quality gain from a more expensive model. GPT-5.4 and GPT-5.5 are supported for comparison, judge passes, slow-lane experiments, and post-meeting synthesis, but they are much more expensive when called on every transcript cue.

The model can either create a new board item or update an existing one:

- Use `updateMode: "create"` for genuinely new decisions, risks, actions, or agent issues.
- Use `updateMode: "update"` plus `targetId` when the latest cue changes the status, wording, evidence, or nuance of an existing item.

Zoom RTMS uses the same analysis contract. The backend normalizes `onTranscriptData` callbacks into cue objects, appends them to an in-memory RTMS session buffer, builds the rolling window, calls the selected provider, and applies create/update records to the server-side RTMS board state. Browser dashboards can poll matching RTMS session records and consume the same item shape whether the source was mock playback, uploaded VTT/TXT, or Zoom live transcript data.


## Structured Contracts

- `schemas/llm-output.schema.json` describes the mock output contract the board can consume now and the shape the Gemini worker emits.
- `schemas/meeting-state.schema.json` describes the dashboard state after host confirmation, including forming/pending/accepted decisions, open/discussed agent issues, and the audit tray.
- Decisions should use `forming` while a decision topic is being discussed, `pending` when a concrete proposal is ready for host confirmation, and `accepted` only when the transcript shows clear agreement. The host can still accept or reject decisions from the modal.
- Agent discussion detection should only set a suggestion flag. The host confirms with Discussed or Dismissed.
