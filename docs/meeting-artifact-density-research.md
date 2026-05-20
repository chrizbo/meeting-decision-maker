# Meeting Artifact Density Research

Last updated: May 19, 2026

## Question

How many decisions, risks, assumptions, and agent notes should Meeting Decision Maker expect in a 30-minute meeting?

## Short Answer

There is no universal standard for artifact density in meetings. The best evidence suggests a useful default expectation of roughly:

| Artifact | Expected range per 30 minutes | High-noise warning range |
| --- | ---: | ---: |
| Accepted decisions | 2-5 | More than 7 |
| Forming decisions | 1-4 | More than 6 |
| Risks / issues / blockers | 1-5 | More than 8 |
| Assumptions worth testing | 1-5 | More than 8 |
| Agent responses / notes | 2-6 | More than 8-10 |
| Concrete action items | 1-4 | More than 6 |

For the live dashboard, a good operating target is **6-15 total visible artifacts per 30 minutes**, with no more than **3-6 high-priority host interventions**. A 30-minute meeting that produces 20+ visible cards is probably over-capturing unless it is explicitly a planning, design, incident, or decision-review session.

The recommended agent-response budget is **one response for every material decision topic or meeting-process breakdown**, not one response for every possible critique. In practice, that means about **2-6 agent responses per 30 minutes**, with a soft cap of **one active response every five minutes**.

After reviewing the shared Google Drive research folder, I would add one more product principle: the best artifact is not merely a live meeting alert. It is a **meeting bridge**: a structured artifact that helps people carry decisions, rationale, risks, tasks, and unresolved discourse into asynchronous follow-up.

## Evidence Base

### Decisions

The strongest quantitative anchor comes from AMI meeting-corpus decision work. In one AMI decision-detection study, 50 meetings averaged **four decisions per meeting**. The same paper reports 554 decision-related dialogue acts out of 37,400 dialogue acts, about **1.4%** of all dialogue acts.

AMI decision-discussion annotation guidelines describe the same order of magnitude: an AMI meeting has around **five decisions listed in the summary**, with typically one to three related dialogue acts per decision.

The AMI meetings used in this line of work are often around 30 minutes for scenario meetings, so a reasonable product expectation is **about 3-5 decisions per 30 minutes** when the meeting is decision-oriented. Natural operational meetings may have fewer accepted decisions but more forming or deferred decisions.

Sources:

- https://www.idiap.ch/webarchives/sites/publications.amiproject.org/lnai-hsueh-final-errata.pdf
- https://groups.inf.ed.ac.uk/ami/corpus/Guidelines/decision_annotation-boundary-v1.4.pdf
- https://groups.inf.ed.ac.uk/ami/corpus/annotation.shtml

### Action Items

Action items are better studied than risks or assumptions, but still hard to benchmark because annotation agreement is low and meeting types differ. The ICSI action-item detection work describes action items as sparse and difficult to detect, with high class imbalance and low inter-annotator agreement. One accessible summary of the task reports an average of just under **three action-item dialogue acts per meeting**.

The AIMU extension of the ICSI corpus annotated 22 public ICSI meetings and 21K utterances with ten kinds of actionable intents. That is useful evidence that meetings contain many possible assistant actions, but only a small subset should become visible action items.

For product expectations, this supports **1-4 concrete action items per 30 minutes** for a normal working meeting, with higher counts only in planning or work-assignment meetings.

Sources:

- https://research.google/pubs/automatically-detecting-action-items-in-audio-meeting-recordings/
- https://www.microsoft.com/en-us/research/wp-content/uploads/2016/06/LREC16_AIMU.pdf
- https://www.pure.ed.ac.uk/ws/portalfiles/portal/14860467/Detecting_Action_Items_in_Meetings.pdf

### Risks and Assumptions

I did not find a research standard for "risks per meeting" or "assumptions per meeting" in general workplace meetings. The best comparable practice standard is project-management logging: RAID logs track Risks, Assumptions or Actions, Issues, and Dependencies or Decisions. Meeting-minutes templates often include sections for risks, issues, decisions, and action items, especially in project status meetings.

This means risks and assumptions should be treated as **decision-support artifacts**, not generic transcript highlights. A risk or assumption is worth surfacing when it could materially change a decision, invalidate a plan, identify a missing stakeholder, or create a useful host question.

For product expectations, assume **1-5 risks** and **1-5 assumptions** per 30-minute decision-oriented meeting. In routine status meetings, the right number may be zero. In strategy, project kickoff, incident review, or architecture meetings, higher counts are plausible.

Sources:

- https://asana.com/resources/raid-log
- https://www.projectmanagementdocs.com/template/project-documents/meeting-minutes/
- https://www.pmi.org/learning/library/project-tracking-meeting-recommended-agenda-4630

### Topics and Agent Response Budget

Topic density gives a better anchor for agent responses than raw error density. AMI meeting research reports that scenario meetings take about **30 minutes**, include around **800 dialogue acts**, and contain **eight top-level topic segments** plus **seven subtopic segments** on average. A later agenda-aware summarization paper reports roughly **four agenda sections per AMI meeting** and about **five inferred agenda items per ICSI meeting**.

This suggests a 30-minute meeting may naturally contain **4-8 material topics** and potentially more subtopics. Meeting Decision Maker should not respond to every topic. It should respond when a topic contains a decision-relevant pattern: unresolved consensus, weak evidence, hidden assumption, failure mode, missing stakeholder, option-value loss, or a drift from discourse into premature commitment.

Operationally:

- For a normal decision meeting, expect **0-1 agent responses per material topic**.
- For a dense strategy or risk review, expect **1 response for the few topics where the meeting quality would materially improve**.
- For low-signal status meetings, expect **zero** unless a clear blocker, owner gap, or false consensus appears.

Sources:

- https://www.idiap.ch/webarchives/sites/publications.amiproject.org/lnai-hsueh-final-errata.pdf
- https://link.springer.com/article/10.1007/s44443-025-00304-y
- https://groups.inf.ed.ac.uk/ami/corpus/Guidelines/TopicSegmentationGuidelines.pdf

### Meeting Mistakes and Errors

I did not find a defensible standard like "X meeting mistakes per 30 minutes." The research describes categories and effects more than universal per-minute rates.

The most useful evidence comes from meeting-process studies on counterproductive meeting behaviors. These include behaviors such as going off topic, complaining, criticizing, interrupting, unrelated activities, nonparticipation, dominant communication, and inappropriate interpersonal behavior. The evidence review from CIPD/CEBMa summarizes that focused communication is associated with meeting effectiveness, and that meeting frequency can be more harmful than total meeting duration because frequent interruptions carry costs.

One process-analysis paper reports that an average team meeting contained **69 counteractive statements** such as complaining and only **17 proactive statements**. Those meetings were 60-90 minutes and the authors standardized counts per 60 minutes, so the rough 30-minute equivalent would be approximately **35 counteractive statements** and **8-9 proactive statements**. That does **not** mean the agent should respond 35 times. It means meeting dysfunction can be frequent, cyclic, and socially contagious, so the product should identify clusters and intervene sparingly.

The most important product implication is that agent responses should target **meeting-control leverage points**:

- The group is treating silence or one strong voice as consensus.
- The conversation has shifted from evidence to repeated complaint.
- The group has lost the decision question.
- A forming decision is about to close without the right people or evidence.
- A risk or assumption has been named but not converted into a test, owner, or tripwire.
- The meeting is producing many cards without a clear decision owner or next step.

Sources:

- https://www.cipd.org/globalassets/media/knowledge/knowledge-hub/evidence-reviews/2023-pdfs/8385-productive-meetings-scientific-summary-may23.pdf
- https://research.vu.nl/ws/portalfiles/portal/833560/L-W_%20Allen_%20Kauffeld.2013.pdf
- https://journals.sagepub.com/doi/10.1177/23294906251413692
- https://digitalcommons.unomaha.edu/psychfacpub/177/

### Useful Signals from the Shared Drive

I reviewed the Drive folder listing and selectively downloaded/extracted a relevant subset:

- `Meeting Bridges: Designing Information Artifacts that Bridge from Synchronous Meetings to Asynchronous Collaboration`
- `Lucid-MeetingPerformanceMaturityModelv1-1`
- `Proactive verbal behavior in team meetings: effects of supportive and critical responses on satisfaction and performance`
- `ImprovingTeamMeetings_EVALUATION CRITERIA` was present, but the PDF text did not extract cleanly in this environment.

The most useful takeaways:

1. **Meeting artifacts should bridge, not just summarize.** The Meeting Bridges paper identifies five post-meeting uses for meeting information: archive, task reminders, onboarding/inclusion, group sensemaking, and launching follow-on collaboration. This supports keeping decisions, risks, assumptions, evidence, and actions as durable objects rather than one-off alerts.
2. **Skimmability matters.** Meeting Bridges participants wanted rich linked media and evidence, but not raw recordings or raw notes as the primary interface. This maps well to concise cards with traceable evidence, timestamps, and richer detail on demand.
3. **Different audiences need different views.** The same artifact may need a host view, participant recap, absent-stakeholder recap, and broad-share view. That argues against stuffing every nuance into the live card.
4. **Meeting maturity starts with clear purpose and documented results.** The Lucid Meeting Performance Maturity Model treats documented outcomes as a basic professional practice, then moves toward meeting-type-specific designs, traceability across related meetings, stakeholder satisfaction, and performance metrics.
5. **Decision-making method should be explicit.** The maturity model specifically calls out meeting designs that clarify the process for making decisions. This reinforces our `forming`, consensus, decision-maker, and discourse-needed metadata.
6. **Agent responses should encourage proactive-supportive patterns.** The proactive verbal behavior study found that proactive verbal behavior followed by supportive peer reactions predicted meeting satisfaction and performance. For our product, the best agent response is not just a criticism; it should help the host convert discourse into constructive next movement.

Sources:

- https://doi.org/10.1145/3637312
- https://www.lucidmeetings.com/meeting-performance-maturity-model
- https://doi.org/10.1007/s12144-024-05806-y
- Google Drive folder: https://drive.google.com/drive/folders/1plEQo9PNyzw-GJED59FoJFBBDjIeHmi5

## Product Interpretation

Meeting Decision Maker should not optimize for total capture. It should optimize for **decision quality per card shown**.

The dashboard is probably healthy when:

- Accepted decisions are sparse and explicit.
- Forming decisions appear before commitment, but preserve lack of consensus.
- Risks are decision-relevant and not every uncertainty.
- Assumptions are captured only when they are central enough to test.
- Agent notes are host-sayable and few enough to act on.
- Agent notes are tied to material topics or recurring meeting-process breakdowns, not isolated imperfections.
- Each durable artifact can support post-meeting sensemaking: what happened, why it mattered, who needs to act, and what remains unresolved.

The dashboard is probably noisy when:

- It emits a card on most transcript cues.
- One evolving decision becomes a running log instead of a stable card.
- A broad parent decision absorbs distinct child decisions.
- Every assumption becomes an agent issue.
- Risk cards duplicate agent notes.
- Agent notes outnumber decisions, risks, and actions combined.
- Agent notes appear more often than once every few minutes without the host acting on them.
- Live cards become the only artifact and do not preserve enough structure for later follow-up.

## Recommended Eval Targets

Use the following density profiles for synthetic evals:

| Meeting type | 30-minute expected artifacts |
| --- | --- |
| Routine status | 2-5 topics, 0-2 decisions, 1-3 risks/issues, 0-2 assumptions, 1-4 actions, 0-2 agent responses |
| Product decision | 4-8 topics, 2-5 decisions, 1-4 risks, 1-4 assumptions, 1-3 actions, 2-5 agent responses |
| Strategy discourse | 4-8 topics, 1-4 forming decisions, 2-6 risks, 2-6 assumptions, 0-2 actions, 3-6 agent responses |
| Architecture/design review | 4-10 topics, 2-6 decisions, 2-5 risks, 1-4 assumptions, 1-4 actions, 2-6 agent responses |
| Incident/postmortem | 3-7 topics, 1-3 decisions, 3-8 risks/issues, 2-6 assumptions, 3-8 actions, 2-5 agent responses |
| Low-signal meeting | 1-4 topics, 0-1 decisions, 0-1 risks, 0-1 assumptions, 0-1 actions, 0-1 agent response |

For the current eval suite, add at least two density tests:

1. **Noisy product discussion**: 30 minutes of discussion with many preferences, only 3 real decisions, 3 risks, 2 assumptions, and 3 agent notes expected. This should punish over-capture.
2. **Risk-rich planning meeting**: 30 minutes with 2 accepted decisions, 5 risks, 4 assumptions, and 4 actions. This should punish under-capture of material risks and assumptions.
3. **Dysfunctional meeting process**: 30 minutes with repeated complaint, off-topic drift, and one dominant speaker. Expect only 2-4 agent responses that cluster the dysfunction into useful facilitation moves.
4. **Many topics, few decisions**: 30 minutes with 7-8 topic shifts and only one real decision. Expect the model to avoid creating a decision or agent response for every topic.
5. **Post-meeting bridge**: a meeting with two decisions, one deferred decision, two risks, two actions, and one absent stakeholder. Expect artifacts to preserve rationale, ownership, and unresolved discourse well enough for an absent person to understand what changed.
6. **Proactive-supportive response**: a meeting where someone proposes a constructive change and others partially support it. Expect the agent to help clarify endorsement, conditions, and next step rather than treating the proposal as only a risk.

## Suggested Runtime Guardrails

Use these as product heuristics rather than hard limits:

- Soft cap visible new artifacts at **12 per 30 minutes** unless the meeting is explicitly risk review, planning, incident, or postmortem.
- Soft cap agent notes at **6 per 30 minutes** and **1 active agent note per 5 minutes**.
- Add an agent-note cooldown unless the new note concerns a different material topic or a higher-severity breakdown.
- If the transcript contains repeated instances of the same meeting mistake, update or strengthen the existing agent note rather than creating a new one.
- Prefer updating a forming decision over creating another card until a distinct decision object appears.
- Prefer turning weak assumptions into decision-detail text instead of agent cards.
- If risks and agent notes overlap, keep the risk as the durable artifact and make the agent note the facilitation question.
- Track artifact density by meeting type so later evals can compare model behavior against expected ranges.
- Track agent responses per topic, not just per minute. The quality question is: "Did the agent speak at the few moments where facilitation would matter?"
- Add a bridge-quality judge dimension: "Would these artifacts help someone who missed the meeting understand decisions, rationale, risks, open questions, and follow-up work?"
- Add a proactive-support judge dimension: "Did agent responses help the group move from critique or ambiguity toward constructive next action?"

## Implications for Current Tuning

The recent live eval showed `product-decision-demo` producing 41 actual artifacts against 24 expected items. That is high but not absurd for a dense synthetic meeting. The larger problem is that some emitted items are duplicate updates, broad running summaries, or overlapping risk/agent cards.

The next tuning goal should be:

- Preserve distinct child decisions.
- Reduce visible agent-note churn.
- Keep risk cards durable and concise.
- Avoid converting every assumption into an intervention.
- Add density-aware judge criteria: "Would this many cards be usable by a host in a 30-minute live meeting?"
