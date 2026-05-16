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


## Structured Contracts

- `schemas/llm-output.schema.json` describes the mock output contract the board can consume now and the future LLM worker should emit.
- `schemas/meeting-state.schema.json` describes the dashboard state after host confirmation, including pending/accepted decisions, open/discussed agent issues, and the audit tray.
- Decisions should enter the board as `pending` until the host accepts or rejects them.
- Agent discussion detection should only set a suggestion flag. The host confirms with Discussed or Dismissed.
