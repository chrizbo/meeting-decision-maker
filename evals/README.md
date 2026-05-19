# Prompt Evals

This folder contains a small eval harness for the transcript analysis prompts and skills.

Run the fixture baseline:

```bash
npm run eval
```

Run against a live local analysis service:

```bash
npm start
node evals/run-evals.js --live http://localhost:8787
```

The live mode posts each transcript cue to `/api/analyze-cue` with a rolling transcript window and compact meeting state, matching the browser path. Start the service with `GEMINI_API_KEY` to evaluate the current Gemini prompt path.

Run against the deployed service:

```bash
EVAL_LIVE_URL=https://roomclarity.com npm run eval:live
```

In Cloud Run Jobs, use the same container image as the web service and run `npm run eval:live`.

## What It Scores

- Recall: expected items that were found near the right cue.
- Precision: actual emitted items that match an expected item.
- Timing: matched items should appear close to the expected cue timestamp.
- Title similarity: matched items should use recognizably similar language.
- Duplicate forming decisions: repeated decision records for the same tradeoff are called out separately so the prompt can be tuned toward updates instead of near-duplicate creates.

The first eval uses `sample-transcripts/product-decision-demo.vtt` and `fixtures/mock-llm-output.json` as the gold set. That keeps the harness stable while we iterate on prompt wording and model behavior.

## Case Packs

Synthetic and real transcript packs live under `evals/cases/<case-name>/`:

- `transcript.vtt`: transcript cues for replay.
- `expected.json`: ideal items over time, plus optional human-readable `why` and `should_not_emit` notes.
- `notes.md`: reviewer notes about what the case is testing.

Start new evals as small archetypes. Good synthetic cases include clean decisions, forming-but-not-decided discussions, false-decision traps, risk-rich decisions, assumption-heavy strategy discussions, and low-signal meetings.

## Current Synthetic Suite Signals

The first synthetic suite is intentionally small and currently highlights two useful prompt gaps:

- False-decision traps: the live model can still create a forming decision from one person's strong preference before the group reframes it as a real decision question.
- Strategic/pricing risk: the live model can miss risks where the downside is anchoring, lock-in, or future option loss rather than immediate execution failure.

Keep these as regression targets when tuning the prompt or adding post-processing.
