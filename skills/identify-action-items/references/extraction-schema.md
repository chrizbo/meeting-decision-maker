# Action Item Extraction Schema

Example compact record:

```json
{
  "type": "action_item",
  "title": "Build playback and agent queue",
  "summary": "Implement the transcript playback loop and queued agent issues before Zoom-native integration.",
  "owner": null,
  "owner_inferred": false,
  "due_or_review_date": null,
  "linked_decision_or_risk": "Build the live board first",
  "expected_output": "A static prototype that replays transcript cues and updates the board.",
  "dependencies": ["Synthetic VTT fixture", "Agent skill configs"],
  "evidence": { "time": "02:42", "speaker": "Jordan Lee" },
  "suggested_next_step": "Confirm owner and review checkpoint."
}
```

Action quality hints:

- Strong: clear task plus owner or review point.
- Medium: clear task but missing owner or timing.
- Weak: vague desire without a concrete deliverable.
