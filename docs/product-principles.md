# Product Principles

Room Clarity helps people make better meeting decisions by turning live or imported transcript evidence into candidate decisions, risks, actions, and facilitation prompts. These principles describe how the product should behave as it grows.

They are intentionally broader than security. They cover product behavior, AI interaction, meeting access, privacy, uncertainty, and the way we should build the system.

## Product Stance

### Support Human Judgment

Room Clarity supports human decision making; it does not replace it.

- Agents surface patterns, questions, and candidate artifacts.
- Humans keep ownership of judgment, escalation, exceptions, empathy, and opt-out.
- The product should make disagreement and uncertainty easier to handle, not smooth them away.
- The app should help the host facilitate the meeting, not become the facilitator.

### Scope Automation to Artifacts

The system should automate artifacts, not roles.

- Produce candidate decision records, risks, actions, recaps, briefs, and prompts.
- Do not pretend to be the PM, facilitator, compliance officer, or decision-maker.
- Keep the artifact boundary clear: what was generated, from what evidence, and what human state it has.
- "Done" should mean the artifact is ready for human review or use, not that the organization has committed.

### Keep Policy Reviewable

Product behavior should be governed by reviewable docs, schemas, config, and tests where possible.

- Access, sharing, retention, and model-output policies should not live only in prompts.
- Prompt and model behavior should be evaluated against fixtures.
- Product principles should evolve as real meeting use reveals gaps.

## AI Interaction Principles

### LLM Output Is Never Ground Truth

Room Clarity should never treat LLM output as true by itself.

- Model output is a candidate artifact, not a decision record.
- A generated decision, risk, action, or agent issue should be presented as something for humans to review.
- A meeting artifact becomes more reliable only when a human validates, edits, accepts, or rejects it.
- The system should preserve uncertainty and evidence links so people can inspect why something appeared.
- The UI should avoid language that implies the model knows what the group decided.

### Action Items Are Candidate Follow-Ups

The app should not assume that tasks or action items mentioned in a meeting must be done.

- Many tasks are negotiated, prioritized, delegated, rejected, or rewritten after the meeting.
- A captured action should be treated as a candidate follow-up until a human confirms it.
- The product should distinguish `mentioned`, `proposed`, `assigned`, and `confirmed` where possible.
- Owners, due dates, and priority should not be invented.
- Exported actions should carry their status and evidence.

### Preserve Disagreement and Uncertainty

The product should not make messy decision discourse look cleaner than it was.

- Do not infer final agreement from silence, confidence, or lack of objections.
- Distinguish forming decisions from accepted decisions.
- Keep open questions, missing evidence, and dissent visible enough for a host to act on.
- Do not collapse a tradeoff into a single recommendation unless the group has actually chosen.

## Meeting Security and Privacy Principles

### Meeting Access Belongs to Meeting Participants

Only people who are in the meeting should have default access to the meeting view.

- A meeting view should be scoped to the people present in the meeting.
- A dashboard link should not be treated as sufficient proof of entitlement forever.
- Zoom meeting context and future app identity should be used to decide who belongs by default.
- Participants should understand when a meeting view exists and who can access it.

### Sharing Outside the Meeting Must Be Explicit

People may share a meeting with people outside the meeting, but that sharing must be intentional and visible.

- Sharing should require an explicit action by a host, operator, or authorized participant.
- The product should show who the meeting has been shared with when feasible.
- Shared access should be revocable.
- Shared access should be scoped to the meeting, not the whole workspace.
- Meeting participants should not be surprised that outsiders can see the meeting view.

### Do Not Leak Adoption or Content

The app must not leak who is using Room Clarity or what their meetings contain to the outside world.

- Meeting URLs should not reveal organization names, meeting topics, participant names, or sensitive content.
- Logs should avoid raw transcripts, prompts, model responses, OAuth tokens, RTMS payloads, and dashboard tokens.
- Public pages should not expose whether a specific organization, person, or meeting is using the product.
- Analytics and support tooling should use minimal metadata and avoid transcript content by default.
- Error messages should not confirm that a meeting exists unless the requester is authorized.

### Access Must Be Revocable

Access should be revocable when someone leaves the organization or no longer needs the meeting.

- Workspace membership should eventually be checked at access time, not only when a dashboard link is created.
- Organization offboarding should remove access to future and past meeting views according to retention policy.
- Dashboard tokens should be revocable and rotatable.
- Explicit external shares should be individually revocable.
- Admins should be able to audit who can access a meeting.

## Interaction Design Policies

For AI and access-control critical moments, use the interaction-design-policy frame from People + AI Research: acceptable actions, unacceptable actions, thresholds of uncertainty, and vulnerabilities.

Reference: https://medium.com/people-ai-research/interaction-design-policies-design-for-the-opportunity-not-just-the-task-239e7f294b29

### Critical Moment: Opening a Meeting View

Acceptable actions:

- Let meeting participants open the meeting view.
- Let explicitly invited outsiders open the meeting view.
- Ask unauthenticated or unauthorized users to sign in or request access.
- Show authorized users who else can access the meeting when feasible.

Unacceptable actions:

- Let anyone with a guessed or forwarded URL access the meeting indefinitely.
- Reveal the meeting topic, participants, organization, or transcript to unauthorized users.
- Confirm sensitive meeting existence through detailed error messages.

Thresholds of uncertainty:

- If we are unsure whether a user belongs to the meeting, deny by default or require explicit approval.
- If link-based access is enabled for beta, it must be high-entropy, rate-limited, revocable, and treated as weaker than authenticated membership.

Vulnerabilities:

- URL sharing can escape the meeting boundary.
- Former employees may retain old links.
- Meeting existence can leak through logs, errors, analytics, or URL previews.

### Critical Moment: Sharing a Meeting

Acceptable actions:

- Let an authorized host/operator explicitly invite someone outside the meeting.
- Show who has access and how they received it.
- Allow revocation of individual shares.
- Preserve an audit trail for share and revoke events.

Unacceptable actions:

- Automatically share with everyone in a connected calendar, channel, or workspace without an explicit rule.
- Hide external sharing from meeting participants.
- Grant access to adjacent meetings or workspace data because one meeting was shared.

Thresholds of uncertainty:

- It is acceptable for early beta to support simple link sharing only for low-sensitivity meetings if users understand the risk.
- It is not acceptable to use simple link sharing for sensitive customer, HR, legal, financial, or strategy meetings without stronger access control.

Vulnerabilities:

- A well-intended share can expose confidential content to a stakeholder who should not see the full transcript.
- People may confuse "can view a decision summary" with "can view the full transcript."

### Critical Moment: Model Captures a Decision, Risk, or Action

Acceptable actions:

- Present generated items as suggestions with evidence.
- Let humans accept, edit, reject, or leave items as forming.
- Preserve uncertainty and missing information.
- Distinguish accepted decisions from forming decision discourse.

Unacceptable actions:

- Mark decisions accepted without explicit transcript evidence or human confirmation.
- Invent owners, agreement, priority, due dates, or rationale.
- Treat model output as authoritative.
- Convert every mention of work into an assigned task.

Thresholds of uncertainty:

- Low-cost false positives are acceptable when they are clearly labeled as suggestions and easy to dismiss.
- False accepted decisions are not acceptable because they can create downstream organizational harm.
- Action item extraction should favor precision over recall until human confirmation workflows exist.

Vulnerabilities:

- Teams may over-trust polished generated summaries.
- People may later cite an unconfirmed generated action as a commitment.
- The system may erase disagreement if it summarizes too confidently.

### Critical Moment: Prompt Injection or Adversarial Meeting Speech

Acceptable actions:

- Treat transcript content as untrusted input.
- Keep model output constrained to structured, validated fields.
- Ignore instructions in the transcript that attempt to control system behavior.
- Preserve evidence so suspicious outputs can be traced to transcript cues.

Unacceptable actions:

- Let a participant's spoken words change system instructions, permissions, destinations, retention, or sharing.
- Let transcript content cause secrets, tokens, or hidden prompts to be revealed.
- Trust a late or isolated participant statement as a meeting-wide decision without evidence.

Thresholds of uncertainty:

- It is acceptable if a prompt-injection attempt causes a low-stakes bad suggestion that a human can dismiss.
- It is not acceptable if prompt injection changes access control, exports data, mutates meeting records without human review, or mislabels a decision as accepted.

Vulnerabilities:

- A participant may speak instructions after others leave.
- A participant may intentionally or jokingly tell the AI to ignore rules.
- The model may confuse quoted text, transcript content, and system instructions.

## Must Do

- Default meeting access to meeting participants.
- Require explicit sharing outside the meeting.
- Make shared access visible and revocable.
- Avoid leaking adoption, meeting existence, participants, or content.
- Preserve human validation as the path from candidate artifact to meeting record.
- Treat transcript text as untrusted input.
- Keep security-sensitive behavior out of model control.
- Maintain evidence links for generated decisions, risks, actions, and agent issues.
- Rate-limit access attempts to reduce URL and token hunting.
- Document uncertainty thresholds and revisit them after user testing.

## Should Not Do

- Do not treat LLM output as true.
- Do not infer final agreement from silence, confidence, or lack of objections.
- Do not assume mentioned tasks must be done.
- Do not invent owners, deadlines, priorities, or rationale.
- Do not make external sharing invisible.
- Do not expose meeting details through public URLs, logs, previews, analytics, or error messages.
- Do not let transcript content alter access control, retention, exports, or system prompts.
- Do not build a product that makes disagreement look cleaner than it was.

## Known Uncertainties

- How much prompt injection or adversarial speech will happen in real meetings?
- What level of false-positive agent suggestions will hosts tolerate during a live meeting?
- When is link-based access acceptable versus authenticated access only?
- How much participant visibility into sharing is helpful versus distracting?
- Should former employees lose access to historical meeting views immediately, or according to retention and legal-hold policy?
- Should external viewers see the full transcript, generated artifacts only, or a redacted view?
- What recovery controls do users expect when the model captures something wrong?

## Acceptable Failure Thresholds

These thresholds should be tested with users and revised.

- Acceptable: a low-priority suggestion is wrong, visible as AI-generated, and easy to dismiss.
- Acceptable: a forming decision is captured too early if it remains labeled forming and cites evidence.
- Acceptable: an action candidate is captured as `mentioned` when no owner or commitment is clear.
- Not acceptable: unauthorized people access meeting content.
- Not acceptable: the product reveals that a specific organization or person is using the app.
- Not acceptable: a model-generated decision is treated as accepted without human validation.
- Not acceptable: prompt injection changes permissions, sharing, retention, exports, or hidden instructions.
- Not acceptable: offboarded organization members retain access after revocation controls exist.

## Related References

- People + AI Research, Interaction Design Policies: https://medium.com/people-ai-research/interaction-design-policies-design-for-the-opportunity-not-just-the-task-239e7f294b29
- Related process-automation discussion: https://github.com/chrizbo/agentics-beyond-code/discussions/111
