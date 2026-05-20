# Model Evaluation Notes

Last updated: 2026-05-20

These notes summarize the current model-learning from the live cue extraction evals. Treat them as directional until the suite includes more real meeting transcripts.

## Current Recommendation

Use `gemini-2.5-flash-lite` as the regular live cue extraction model.

Reasons:

- It is dramatically cheaper for cue-by-cue analysis.
- It has acceptable latency for live meeting use.
- The current prompt and post-processing were tuned against this path.
- GPT-5.4 and GPT-5.5 are useful comparison models, but per-cue live use is expensive at 30-minute meeting scale.

Use GPT-5.4 or GPT-5.5 for:

- model comparison sweeps
- qualitative judge passes
- selective slow-lane analysis on high-value moments
- post-meeting synthesis or QA

## Pricing Snapshot

Current listed text-token prices:

| Model | Input / 1M tokens | Output / 1M tokens | Relative to Flash Lite |
| --- | ---: | ---: | ---: |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | baseline |
| Gemini 2.5 Flash | $0.30 | $2.50 | 3x input, 6.25x output |
| Gemini 2.5 Pro | $1.25 | $10.00 | 12.5x input, 25x output |
| Gemini 3 Flash Preview | $0.50 | $3.00 | 5x input, 7.5x output |
| Gemini 3.1 Flash-Lite | $0.25 | $1.50 | 2.5x input, 3.75x output |
| Gemini 3.1 Pro Preview | $2.00 | $12.00 | 20x input, 30x output |
| Gemini 3.5 Flash | $1.50 | $9.00 | 15x input, 22.5x output |
| GPT-5.4 | $2.50 | $15.00 | 25x input, 37.5x output |
| GPT-5.5 | $5.00 | $30.00 | 50x input, 75x output |

GPT-5.5 is 2x GPT-5.4 on both input and output.

Gemini 2.5 Pro and 3.1 Pro prices above use the <=200k-token standard pricing tier. Larger prompts have higher prices. Gemini 3.1 Flash-Lite is the cheapest current 3.x Gemini text option in the public pricing table, but it is still more expensive than the older Gemini 2.5 Flash-Lite path we have tested most.

Rough cue-by-cue cost estimate for a 30-minute meeting, assuming about 10k input tokens and 500 output tokens per cue:

| Model | 100 cues | 180 cues | 300 cues |
| --- | ---: | ---: | ---: |
| Gemini 2.5 Flash-Lite | $0.12 | $0.22 | $0.36 |
| Gemini 2.5 Flash | $0.43 | $0.77 | $1.28 |
| Gemini 2.5 Pro | $1.75 | $3.15 | $5.25 |
| Gemini 3 Flash Preview | $0.65 | $1.17 | $1.95 |
| Gemini 3.1 Flash-Lite | $0.33 | $0.59 | $0.98 |
| Gemini 3.1 Pro Preview | $2.60 | $4.68 | $7.80 |
| Gemini 3.5 Flash | $1.95 | $3.51 | $5.85 |
| GPT-5.4 | $3.25 | $5.85 | $9.75 |
| GPT-5.5 | $6.50 | $11.70 | $19.50 |

The expensive part is repeating the full skill/prompt context on every cue. A post-meeting synthesis pass over the whole transcript should be much cheaper than per-cue GPT-5.5 extraction.

Pricing sources:

- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- OpenAI GPT-5.4: https://developers.openai.com/api/docs/models/gpt-5.4
- OpenAI GPT-5.5: https://developers.openai.com/api/docs/models/gpt-5.5

## Live Eval Signals So Far

### Clean Decision Case

This small case is not enough to choose a model by itself, but it is useful for latency and basic structured-output behavior.

| Model | F1 | Avg response | Max response | Notes |
| --- | ---: | ---: | ---: | --- |
| Gemini 2.5 Flash-Lite | 100% | 2.3s | 7.4s | Perfect score, one slow max response in this run. |
| GPT-5.4 | 88.9% | 3.1s | 4.2s | Full recall, but split one follow-up into an extra action. |
| GPT-5.5 | 100% | 2.4s | 3.0s | Matched Flash Lite on this case with competitive latency. |

### Full Synthetic Suite, Partial/Recent Signals

Recent live runs vary because each cue is independently analyzed by the deployed service. The numbers below should be read as a rough signal, not a stable benchmark.

- Gemini 2.5 Flash-Lite has landed around the mid-70s to low-80s aggregate F1 in live runs. It often does well on clean/forming cases but can over-produce agent issues and miss some risk cards in the longer product-decision demo.
- Gemini 2.5 Flash completed a prior sweep at about 70% aggregate F1. It was noisier than Flash-Lite and did not show enough quality gain to justify its higher per-cue cost.
- Gemini 2.5 Pro completed a prior sweep at about 69% aggregate F1. It was slower and more expensive, and did not beat Flash-Lite on deterministic extraction.
- Gemini 3 Flash Preview did not complete the earlier full cue-by-cue comparison within the Cloud Run job timeout, so it does not currently look practical for this live extraction path without a smaller scope or a different deployment setup.
- Gemini 3.1 Flash-Lite has not been tested yet. It is worth adding to the eval matrix because it is the current low-cost 3.x Gemini option, but it is still meaningfully more expensive than Gemini 2.5 Flash-Lite.
- Gemini 3.5 Flash has not been tested yet. Its pricing is closer to Pro-class live extraction economics than Flash-Lite economics, so it should be evaluated only if we expect a large quality improvement.
- Gemini 3.1 Pro Preview has not been tested yet and is likely better suited to post-meeting synthesis, judge passes, or slow-lane analysis than every-cue live extraction.
- GPT-5.4 reached about 74% aggregate F1 in one full run. It was good at durable risks and decisions but tended to create extra risks/actions and sometimes converted useful agent nudges into durable artifacts.
- GPT-5.5 looked strong on the clean-decision case and had promising recall on the longer product-decision demo, but one full sweep was stopped before a complete timing-aware aggregate finished. Early output suggested it may over-create risks/decisions in nuanced product discussions.

## Product Interpretation

For live meetings, the model needs to be not only accurate but also restrained. A model that finds more plausible risks can still be worse if it floods the board or creates facilitation notes too often.

The strongest current pattern:

- Flash Lite is best for regular live extraction economics.
- Gemini 2.5 Flash and 2.5 Pro have not beaten Flash-Lite on this task so far.
- Gemini 3.1 Flash-Lite is the most interesting next Gemini candidate to test because it may offer better 3.x behavior without jumping to Pro-class cost.
- Gemini 3.5 Flash and Gemini 3.1 Pro Preview are more likely to belong in slow-lane or post-meeting workflows unless live evals show a large quality gain.
- GPT-5.5 is worth keeping in the eval matrix because it may improve judgment on consensus, forming decisions, and nuanced risks.
- GPT-5.4 has not yet shown enough quality advantage over GPT-5.5 or Flash Lite to justify live use.

## Next Evals To Run

Run a full timing-aware comparison:

```bash
node evals/run-evals.js \
  --live https://meeting-decision-maker-web-eval-60699219360.us-central1.run.app \
  --models gemini:gemini-2.5-flash-lite,gemini:gemini-3.1-flash-lite,openai:gpt-5.5
```

Then run judge mode if deterministic results look close:

```bash
EVAL_JUDGE_MODEL=gemini-2.5-pro node evals/run-evals.js \
  --judge \
  --live https://meeting-decision-maker-web-eval-60699219360.us-central1.run.app \
  --models gemini:gemini-2.5-flash-lite,gemini:gemini-3.1-flash-lite,openai:gpt-5.5
```

When real annotated meeting transcripts are available, prioritize:

- decision density and artifact density
- forming decisions with no consensus
- option-value and lock-in risks
- missed agent-note opportunities
- over-triggering of agent notes
- whether the final board works as a meeting bridge for someone who missed the meeting
