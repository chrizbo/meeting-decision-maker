# Decision Extraction Schema

Example compact record:

```json
{
  "type": "decision",
  "title": "Build the live board first",
  "status": "accepted",
  "summary": "Use a human-shared live board with timed transcript playback before Zoom-native integration.",
  "options_considered": ["live board", "post-meeting summary"],
  "rationale": "The live board tests the differentiated meeting behavior earlier.",
  "assumptions": ["The host can use the page while facilitating."],
  "open_questions": ["Will the page distract participants?"],
  "owner": null,
  "evidence": { "time": "02:33", "speaker": "Maya Patel" },
  "suggested_next_step": "Confirm the exact MVP scope and owner."
}
```

Confidence hints:

- High: explicit agreement or decision language.
- Medium: convergence language without explicit agreement.
- Low: one speaker proposes a direction but the group has not responded.
