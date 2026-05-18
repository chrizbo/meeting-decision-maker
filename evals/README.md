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

## What It Scores

- Recall: expected items that were found near the right cue.
- Precision: actual emitted items that match an expected item.
- Timing: matched items should appear close to the expected cue timestamp.
- Title similarity: matched items should use recognizably similar language.

The first eval uses `sample-transcripts/product-decision-demo.vtt` and `fixtures/mock-llm-output.json` as the gold set. That keeps the harness stable while we iterate on prompt wording and model behavior.
