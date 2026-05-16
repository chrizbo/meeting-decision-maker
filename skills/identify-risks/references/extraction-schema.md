# Risk Extraction Schema

Example compact record:

```json
{
  "type": "risk",
  "title": "Live board adoption risk",
  "summary": "The shared page may distract participants or be ignored by the host during facilitation.",
  "linked_decision_or_action": "Build the live board first",
  "severity": "medium",
  "confidence": "medium",
  "mitigation": "Keep the queue low-friction and evidence-backed.",
  "warning_sign": "The host repeatedly ignores suggestions or says the team already covered them.",
  "owner": null,
  "evidence": { "time": "01:21", "speaker": "Bryce Hoffman" },
  "suggested_next_step": "Test whether the host can use suggestions without interrupting the meeting flow."
}
```

Severity hints:

- High: could invalidate the decision or create serious trust, legal, security, customer, or cost impact.
- Medium: could materially reduce success but is likely mitigable.
- Low: useful to track but not central to the current decision.
