# Future Spec: Agent-Accessible Meeting Context

## Status

Research note and product direction. Do not implement until durable meeting sessions, auth, and reviewed meeting briefs are stable enough to support scoped external access.

## Question

How can Room Clarity make meeting views and meeting artifacts easier for a person's own agents to use?

The short answer: expose meeting context as a permissioned context product, not as a scraped web page. The meeting dashboard should remain optimized for humans, but each meeting should also have agent-readable views, resources, and tools with explicit access control, provenance, and review boundaries.

## Recommendation

Build this in layers:

1. Add stable, agent-readable HTTP endpoints for meeting context.
2. Add an MCP server that exposes those same records as resources, prompts, and low-risk tools.
3. Add outbound webhooks or event subscriptions for user-owned automations.
4. Consider A2A-style agent handoff only after the product has a real need to coordinate with another agent as a peer.

MCP is the best first interoperability layer because current agent clients already understand it as a way to connect models to tools, resources, and prompts. A2A is better framed as a later agent-to-agent task delegation layer.

## Product Model

Room Clarity should expose four levels of context:

- Live meeting state: current decisions, risks, actions, open questions, agent issues, and transcript window.
- Reviewed meeting artifact: human-edited brief, accepted decisions, confirmed actions, and carry-forward items.
- Evidence graph: transcript snippets, timestamps, speakers, source cue IDs, and provenance linking each item to evidence.
- External binding context: linked issue, repo, project, customer, document, calendar event, or meeting series.

The reviewed meeting artifact should be the default context for personal agents. Full transcript and live state should require stronger permission because they contain more sensitive, ambiguous, and unreviewed content.

## Agent-Readable Meeting View

The browser dashboard should add machine-friendly affordances without compromising the human UI:

- Canonical meeting URL with metadata links.
- `application/json` endpoint for the current viewer's allowed meeting state.
- `text/markdown` endpoint for a concise reviewed brief.
- JSON-LD or simple metadata tags pointing to available agent resources.
- Stable item IDs for decisions, actions, risks, transcript cues, and brief sections.
- Evidence links that resolve to bounded transcript snippets rather than entire raw transcript by default.

Suggested URL shape:

```text
/m/:publicSessionId
/api/meetings/:publicSessionId/context
/api/meetings/:publicSessionId/brief.md
/api/meetings/:publicSessionId/items/:itemId/evidence
```

The API response should be scoped to the caller. A meeting participant, an explicitly invited outside collaborator, and an internal service admin should not all see the same context by default.

## MCP Surface

Expose a remote MCP server once auth is ready:

```text
https://roomclarity.com/mcp
```

### Resources

Resources should be read-oriented and stable:

```text
roomclarity://meetings/{meetingId}/brief
roomclarity://meetings/{meetingId}/state
roomclarity://meetings/{meetingId}/decisions
roomclarity://meetings/{meetingId}/actions
roomclarity://meetings/{meetingId}/risks
roomclarity://meetings/{meetingId}/open-questions
roomclarity://meetings/{meetingId}/agent-issues
roomclarity://meetings/{meetingId}/transcript-snippets/{evidenceId}
roomclarity://series/{seriesId}/carry-forward
```

Default resources:

- `brief`: reviewed or review-ready meeting brief.
- `decisions`: accepted and forming decisions with status, evidence, owner when present, and confidence/provenance.
- `actions`: candidate and confirmed follow-ups with status, owner only when explicitly captured, and due date only when explicit.
- `carry-forward`: host-approved context for the next meeting in a series.

Sensitive resources:

- `state`: full board state, including unreviewed live items.
- `agent-issues`: internal prompts and interventions.
- `transcript-snippets`: bounded evidence snippets.
- full transcript, if ever exposed, should be a separate privileged resource.

### Prompts

Prompts should be user-invoked templates that help a personal agent use meeting context correctly:

- `summarize-meeting-for-me`: creates a concise personal recap from the reviewed brief.
- `prepare-follow-up-draft`: drafts an email, Slack update, issue comment, or doc section from reviewed items.
- `prepare-next-meeting`: uses carry-forward items and open questions to draft a next-meeting prep note.
- `compare-with-my-notes`: reconciles a user's private notes with the reviewed meeting brief.
- `extract-my-commitments`: lists actions explicitly assigned to or accepted by the requesting user.

These prompts should prefer reviewed artifacts over raw transcript and should include provenance expectations.

### Tools

Start with low-risk tools:

```text
list_meetings(range, seriesId?)
search_meetings(query, range?, seriesId?)
get_meeting_context(meetingId, view)
get_evidence(itemId)
create_personal_note(meetingId, text, visibility)
request_access(meetingId, reason)
```

Defer write tools until trust is earned:

```text
propose_brief_edit(meetingId, patch)
propose_action_update(actionId, patch)
create_followup_draft(meetingId, target)
post_approved_followup(draftId)
```

Do not let external agents silently mutate meeting truth. Personal agents can propose edits or create private notes, but changing shared decisions, transcript provenance, access, retention, or external system state should require explicit human approval.

## Authorization

This depends on the app-owned auth model in `docs/auth-authorization-plan.md`.

Minimum rules:

- OAuth for remote MCP access.
- Resource-specific scopes rather than one broad "read meetings" permission.
- Meeting-scoped grants for outsiders.
- Workspace grants for internal members.
- Short-lived access tokens and revocable refresh/session state.
- Audit logs for all MCP resource reads and tool calls.
- No access through dashboard bearer links alone for remote MCP.

Suggested scopes:

```text
meetings:list
meeting:brief.read
meeting:items.read
meeting:evidence.read
meeting:transcript.read
meeting:notes.write.private
meeting:brief.propose
meeting:followup.draft
meeting:followup.post
series:carry_forward.read
```

Default grant for a personal agent should be `meeting:brief.read`, `meeting:items.read`, and `series:carry_forward.read`. Transcript access should be opt-in per meeting or workspace policy.

## Meeting Context Packet

The central data product should be a compact packet that can be returned by HTTP, MCP resources, webhooks, or exports.

```json
{
  "meeting": {
    "id": "mtg_123",
    "title": "Pricing packaging review",
    "startedAt": "2026-05-24T17:00:00Z",
    "endedAt": "2026-05-24T17:45:00Z",
    "seriesId": "series_456",
    "source": "zoom"
  },
  "access": {
    "viewerRole": "participant",
    "view": "reviewed",
    "transcriptIncluded": false
  },
  "brief": {
    "status": "reviewed",
    "summary": "The team narrowed the launch path to two packaging options.",
    "updatedAt": "2026-05-24T18:10:00Z"
  },
  "items": [
    {
      "id": "decision_1",
      "type": "decision",
      "status": "accepted",
      "title": "Pilot annual discount with enterprise prospects",
      "detail": "Use the annual discount only for enterprise prospects during the first pilot.",
      "evidenceIds": ["ev_1"],
      "humanReviewed": true,
      "source": "meeting"
    }
  ],
  "carryForward": [
    {
      "id": "cf_1",
      "type": "open_question",
      "title": "Define discount guardrails before launch",
      "suggestedNextMeetingPrompt": "Confirm maximum discount and approval owner."
    }
  ]
}
```

Design rules:

- Keep IDs stable.
- Include status and review state.
- Include evidence IDs, not raw transcript by default.
- Avoid invented owners, due dates, or agreement.
- Keep `view` explicit: `live`, `reviewed`, `brief`, or `personal`.

## Personal Agent Use Cases

### Personal Prep

"Use my last three pricing meetings to prepare me for today's packaging meeting."

Needs:

- Meeting list/search.
- Reviewed briefs.
- Carry-forward items.
- Participant-scoped access.

### Personal Commitments

"What did I explicitly commit to in the meeting?"

Needs:

- Actions with explicit assignee/proposer evidence.
- Transcript snippets only for matching actions.
- Clear distinction between mentioned, proposed, assigned, and confirmed.

### CRM or Customer Context

"Update my account notes from the reviewed customer meeting recap."

Needs:

- Reviewed brief.
- Audience-safe summary.
- External write as a draft first.

### Engineering Handoff

"Create a draft issue comment from the meeting decisions."

Needs:

- Bound repo/issue context.
- Accepted decisions and open questions.
- Existing MCP-backed GitHub flow from `mcp-backed-prototyping.md`.

### Private Reflection

"Compare the official recap with my private notes and show gaps."

Needs:

- Reviewed brief.
- User-private note resource.
- No sharing back to the team unless explicit.

## MCP vs A2A vs Plain APIs

### Plain HTTP APIs

Use for the product's own frontend, mobile views, exports, and partner integrations. This is also the source of truth for the MCP server.

Best for:

- Stable app contracts.
- Webhooks.
- Internal services.
- Simple partner integrations.

### MCP

Use for personal assistants, coding agents, ChatGPT/Claude/Copilot-style clients, and agent tools that need to discover context and call tools.

Best for:

- Exposing meeting resources to many agent clients.
- Read-heavy context retrieval.
- Controlled draft/proposal tools.
- User-invoked prompt templates.

### A2A

Use later if Room Clarity needs to communicate with another agent as a peer actor, not just expose context.

Best for:

- Delegating a task to another enterprise agent.
- Receiving status from another long-running agent.
- Coordinating multi-agent workflows across vendors.

Not needed for the first version of personal-agent access.

## UX Implications

Add an "Agent access" area to meeting review or sharing:

- Show which agents/apps can access the meeting.
- Let the host choose reviewed brief only, items plus evidence, or full transcript.
- Display last access time and tool/resource usage.
- Provide one-click revoke.
- Provide per-meeting and per-series defaults.
- Show a warning when granting raw transcript access.

Meeting items should expose "copy agent-safe context" and "view evidence packet" actions for debugging and user trust.

## Security and Privacy Risks

Key risks:

- Prompt injection from transcript content.
- Overbroad context exfiltration by a personal agent.
- Meeting URLs used as durable secrets.
- Full transcripts leaked where a reviewed brief would have been enough.
- Agents treating unreviewed model output as ground truth.
- External write tools turning ambiguous meeting discussion into organizational commitments.

Mitigations:

- Treat transcript as untrusted input.
- Default to reviewed brief context.
- Use scoped OAuth grants for remote MCP.
- Require explicit approval for write tools.
- Keep resource access logs.
- Use schema-validated outputs.
- Return bounded evidence snippets instead of entire transcripts.
- Keep generated and human-reviewed state explicit in every resource.

## Implementation Sequence

### Phase 1: Agent-Readable Context API

- Add durable meeting context packet shape.
- Add read-only API endpoints for `brief`, `items`, and bounded `evidence`.
- Add Markdown export for reviewed brief.
- Add tests for role-scoped views.

### Phase 2: Share and Consent UX

- Add "Agent access" controls to review mode.
- Add meeting-scoped grants.
- Add audit log records for context reads.
- Make transcript access a separate explicit grant.

### Phase 3: Remote MCP Read Surface

- Implement MCP resources for meeting brief, decisions, actions, risks, open questions, and carry-forward context.
- Implement `list_meetings`, `search_meetings`, `get_meeting_context`, and `get_evidence`.
- Add OAuth-based remote MCP auth.
- Test in at least two MCP clients before treating the contract as stable.

### Phase 4: Draft/Proposal Tools

- Add private notes.
- Add proposed brief edits.
- Add follow-up draft creation.
- Require human approval before posting externally or changing shared meeting records.

### Phase 5: Agent-to-Agent Handoff

- Revisit A2A or similar protocols only after there is a concrete partner agent workflow that MCP resources/tools do not solve.

## Open Questions

- Should meeting participants be allowed to connect their own personal agents without host approval, or should the host/admin control every external agent grant?
- Should raw transcript access be possible at all for personal agents, or only for workspace-approved agents?
- What should a personal agent see for items that were generated live but never reviewed?
- Should private user notes live inside Room Clarity or remain outside the product?
- How long should MCP access grants survive after a meeting ends?
- Can reviewed meeting briefs become the default long-term memory surface, with full transcript deleted earlier?

## Sources Checked

Checked May 24, 2026.

- Model Context Protocol server concepts: https://modelcontextprotocol.io/docs/learn/server-concepts
- Model Context Protocol authorization: https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization
- OpenAI Apps SDK overview: https://help.openai.com/en/articles/12515353-build-with-the-apps-sdk
- OpenAI apps in ChatGPT announcement: https://openai.com/index/introducing-apps-in-chatgpt/
- Google Agent2Agent announcement: https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/
- Agent2Agent specification: https://google-a2a.github.io/A2A/specification/
- GitHub Copilot MCP overview: https://docs.github.com/en/copilot/concepts/context/mcp
- Claude remote MCP connector overview: https://claude.com/docs/connectors/building/mcp
