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

The live mode posts each transcript cue to `/api/analyze-cue` with a rolling transcript window and compact meeting state, matching the browser path. Start the service with `GEMINI_API_KEY` to evaluate the Gemini prompt path, or `OPENAI_API_KEY` plus `LLM_PROVIDER=openai` to evaluate the default OpenAI path.

Run against the deployed service:

```bash
EVAL_LIVE_URL=https://roomclarity.com npm run eval:live
```

In Cloud Run Jobs, use the same container image as the web service and run `npm run eval:live`.

Run live evals with an LLM-as-judge pass:

```bash
EVAL_LIVE_URL=https://roomclarity.com EVAL_JUDGE_MODEL=gemini-2.5-pro npm run eval:judge
```

Judge mode uses Gemini as a qualitative reviewer, not as the deterministic pass/fail gate. It defaults to `gemini-2.5-pro` and requires `GEMINI_API_KEY` or `GOOGLE_API_KEY` in the environment.

Compare multiple live analysis models in one run:

```bash
EVAL_LIVE_URL=https://roomclarity.com EVAL_MODELS=gemini:gemini-2.5-flash-lite,openai:gpt-5.4,openai:gpt-5.5 npm run eval:models
```

The model sweep sends `model` to `/api/analyze-cue` for each cue, prints per-case scores for each model, then prints a model comparison table. Use provider-qualified model strings (`gemini:<model>` or `openai:<model>`) when comparing providers. Unqualified Gemini model names still work for the current default path, and unqualified `gpt-*` names are treated as OpenAI models. The sweep exits successfully when at least one model clears the aggregate F1 gate, so experimental weaker models can be compared without hiding the stronger candidate.

Live evals also print average and max response time per cue. The timing wraps the full `/api/analyze-cue` request from the eval runner's perspective, including retry delay if a cue has to be retried.

The product default for live cue extraction remains `gemini-2.5-flash-lite`. Treat OpenAI models in sweeps as quality and cost comparisons before using them in regular live meetings.

Current model comparison notes and cost interpretation are captured in [../docs/model-evaluation-notes.md](../docs/model-evaluation-notes.md).

## What It Scores

- Recall: expected items that were found near the right cue.
- Precision: actual emitted items that match an expected item.
- Timing: matched items should appear close to the expected cue timestamp.
- Title similarity: matched items should use recognizably similar language.
- Duplicate forming decisions: repeated decision records for the same tradeoff are called out separately so the prompt can be tuned toward updates instead of near-duplicate creates.

The first eval uses `sample-transcripts/product-decision-demo.vtt` and `fixtures/mock-llm-output.json` as the gold set. That keeps the harness stable while we iterate on prompt wording and model behavior.

## LLM Judge

The optional judge pass reviews live outputs for softer product qualities:

- useful friction at the right moment
- decision discourse vs commitment
- consensus handling
- risk relevance
- agent note helpfulness
- support for human judgment
- artifact density and host usability
- meeting bridge quality for absent stakeholders
- proactive-supportive movement rather than critique-only notes

The judge prints qualitative scores and findings. It should be treated as review aid, not a replacement for deterministic regression scoring.

## Case Packs

Synthetic and real transcript packs live under `evals/cases/<case-name>/`:

- `transcript.vtt`: transcript cues for replay.
- `expected.json`: ideal items over time, plus optional human-readable `why` and `should_not_emit` notes.
- `notes.md`: reviewer notes about what the case is testing.

Start new evals as small archetypes. Good synthetic cases include clean decisions, forming-but-not-decided discussions, false-decision traps, risk-rich decisions, assumption-heavy strategy discussions, and low-signal meetings.

## Product Principle Metadata

Use optional metadata fields in `expected.json` to make product-principle expectations explicit before the runner scores them.

At the case level:

- `principles_under_test`: product principles or failure modes the case is meant to exercise.
- `decision_context`: optional notes about the meeting type, decision owner, stakeholders, or timing pressure.
- `should_not_emit`: negative labels for behavior the model should avoid.

At the item level:

- `decision_stage`: `question`, `discourse`, `proposal`, `commitment`, `rejected`, or `parked`.
- `consensus`: `none`, `partial`, `unclear`, or `strong`.
- `decision_type`: `product`, `strategy`, `technical`, `process`, `policy`, `personnel`, or `prioritization`.
- `decision_tempo`: `chronos`, `kairos`, or `unclear`.
- `discourse_state`: `needs_discourse`, `active_discourse`, `ready_for_confirmation`, or `closed`.
- `decision_maker`: person, role, group, or `unknown`.
- `stakeholders_missing`: perspectives that should be in the discourse.
- `tradeoff`: concise "X even over Y" style tradeoff when applicable.
- `strategic_ambiguity`: `too_vague`, `too_specific`, `appropriate`, or `not_applicable`.
- `reversibility`: `one_way`, `two_way`, or `unclear`.
- `option_value`: future flexibility, switching cost, or lock-in concern.
- `bias_check`: bias or decision pattern under test.
- `useful_friction`: why an agent note should slow the meeting at this moment.
- `human_judgment_role`: how the note supports human judgment rather than replacing it.

## Current Synthetic Suite Signals

The first synthetic suite is intentionally small and currently highlights two useful prompt gaps:

- False-decision traps: the live model can still create a forming decision from one person's strong preference before the group reframes it as a real decision question.
- Strategic/pricing risk: the live model can miss risks where the downside is anchoring, lock-in, or future option loss rather than immediate execution failure.

Keep these as regression targets when tuning the prompt or adding post-processing.

## Density and Agent Response Evals

Use [../docs/meeting-artifact-density-research.md](../docs/meeting-artifact-density-research.md) when creating synthetic or live-annotated evals. Expected counts should be meeting-type-specific, not universal.

For a normal 30-minute decision-oriented meeting, a healthy target is roughly 6-15 visible artifacts and 2-6 agent responses. Penalize outputs that emit a card on most cues, create an agent note for every assumption, duplicate risk cards and agent notes for the same concern, or turn an evolving decision into a long running log.

Add judge notes for:

- Would this many cards be usable by a host live?
- Did agent responses appear at the few moments where facilitation mattered?
- Did the artifact set work as a meeting bridge for someone who missed the meeting?
- Did the system encourage constructive next movement instead of only critique?
