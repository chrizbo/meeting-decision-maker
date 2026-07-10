# Room Clarity — Functional Specification

_UI-agnostic. Describes what the product does, not how it looks._

---

## Overview

Room Clarity is a decision-support layer for Zoom meetings. It helps meeting hosts surface candidate decisions, risks, actions, and open questions from live or imported transcripts, then produces a reviewed post-meeting brief. The product is intentionally scoped to artifacts — it does not replace the host or the facilitation process.

The product operates across three sequential phases for every meeting: **Runway**, **Meeting**, and **Brief**.

---

## Board view modes

Independent of phase, the host can toggle between two board views:

- **Focus** (default) — reduces each phase to the single most relevant item: one decision in view plus one agent note during the Meeting phase, with the full decision/risk/action grid and agent queue hidden. The same reduction applies during Runway and Brief. The agent queue remains reachable from a queue toggle so open agent issues aren't lost, just deferred.
- **Classic** — shows the full board (all decisions, risks, actions, agent queue, and audit tray) at all times, at every phase.

The choice persists across sessions (stored client-side) and applies uniformly across Runway, Meeting, and Brief — a host who prefers Focus should not see the full board reappear just because they moved to a different phase.

---

## Phase 1 — Runway

The Runway phase occurs before and at the start of the meeting. Its purpose is to orient the host and participants around what the meeting is trying to decide and how.

### Inputs

Runway content is assembled from one or more of the following sources:

- The meeting topic and agenda (from Zoom or manual entry)
- A prior meeting brief from a related session
- Linked reference documents (e.g. a design doc, GitHub issue, shared spec)
- LLM-generated analysis of the above inputs (`/api/analyze-runway`)

### Runway data model

| Field | Description |
|---|---|
| `title` | Short label for this meeting's decision focus |
| `purpose` | One or two sentences on what this meeting is trying to accomplish |
| `agendaTitle` | Label for the agenda block |
| `agendaItems[]` | Ordered list of discussion items. Each item has a title, a desired outcome, and an optional source doc link. |
| `decisionFrame` | Structured block: decision owner, success condition, and out-of-scope notes |
| `participationNorm` | A single sentence describing how participants should engage |
| `openingPrompt` | A suggested first question to open the meeting |
| `contextNotes[]` | Optional notes about what prior context or carry-forward items are relevant |

If no structured agenda or prior brief is available, the runway is generated as a lightweight stub with minimal framing rather than invented content.

### Runway timer

The runway is displayed for a configurable countdown duration (default: 90 seconds). When the timer expires the runway collapses and the live board takes over. The host can also dismiss the runway manually or re-open it at any time.

### Seeded agenda decision candidates

Agenda items in the runway that have a clear decision framing (a desired outcome that looks like a choice) may be pre-seeded onto the board as `forming` decision candidates before the meeting begins. This gives the host a starting scaffold.

---

## Phase 2 — Meeting (Live Board)

The meeting phase is the primary active phase. The board displays and updates live as the transcript is processed.

### Transcript sources

Two paths deliver transcript data to the board:

1. **Live RTMS (Zoom Real-Time Media Streaming):** Zoom sends signed webhook events with per-cue transcript segments. Each cue has a speaker, text, and timestamps in microseconds.
2. **Imported transcript (VTT or TXT file):** The host uploads a file. The system replays it through the same analysis pipeline.

### LLM analysis pipeline

Each transcript cue (or batch of cues) is sent to the configured LLM provider (Gemini or OpenAI) via `/api/analyze-cue`. The LLM returns structured JSON conforming to the output schema in `schemas/`. The pipeline:

1. Assembles the cue text, recent transcript context, and runway framing into a prompt
2. Calls the LLM
3. Validates the response against the JSON schema
4. Applies the result to the board state

The LLM output is always treated as candidate artifacts, never as authoritative records.

### Board artifacts

The board tracks four types of artifacts:

#### Decisions

| Status | Meaning |
|---|---|
| `forming` | The group is discussing this; a decision has not been made |
| `accepted` | The host has confirmed this decision was made |
| `rejected` | The host has explicitly rejected or overturned this |

Each decision has: `title`, `summary`, `evidence` (transcript timestamps and quoted text), and `status`.

The LLM may update an existing decision's status if new transcript evidence matches an already-captured title.

#### Risks

Candidate concerns or failure modes surfaced from the transcript. Each has: `title`, `summary`, `evidence`. A risk may be flagged as an **open question** (something the group hasn't answered yet, distinct from a failure mode).

#### Actions

Candidate follow-up tasks. Each has: `title`, `summary`, `evidence`. Actions are not assumed to be assigned or committed — they carry a `mentioned`/`candidate` framing until a human confirms them.

#### Agent issues

Issues raised by built-in analysis agents that run against the transcript. Agent types include:

- **Assumptions Challenge** — flags an implicit assumption that should be tested
- **Pre-Mortem** — surfaces a plausible failure scenario
- **Argument Dissection** — identifies a weak or unsupported argument

Each agent issue has: `type`, `title`, `summary`, `evidence`, and `status` (`active`, `discussed`, or `dismissed`).

### Item detail and host actions

Any board item can be opened to show its full detail, including:

- Summary and evidence (transcript quote + timestamp)
- Conversation prompts — a direct, provocative question the host can read aloud to push the room toward a real decision rather than a generic status check
- Suggested next steps
- For decisions: `Accept` and `Reject` actions
- For agent issues: `Mark discussed`, `Dismiss`, `Promote to risk`, or `Promote to open question`
- For decisions: ability to propose a linked GitHub issue

All host actions require explicit interaction. Nothing is auto-accepted.

### Shared board view

The board URL can be shared with meeting participants. Participants see the same board the host sees, but without host-action controls. The shared view:

- Updates in real time (polling every 4 seconds)
- Shows accepted decisions, risks, actions, and agent issues
- Does not show the raw transcript feed unless the host enables it
- Can be shared via a high-entropy URL (no login required for beta; stronger auth planned)

### Board phases for shared viewers

The shared view has three sub-states depending on meeting lifecycle:

| Meeting state | Shared view behavior |
|---|---|
| Meeting hasn't started yet | Shows runway context |
| Meeting is live | Shows live board, hides runway |
| Meeting ended / review mode | Shows brief panel above the board |

---

## Phase 3 — Brief

The Brief phase begins when the host enters review mode after the meeting. The brief is a reviewed, evidence-linked summary of the meeting's outputs.

### Entering review mode

The host explicitly enters review mode. This transitions the board into a curation state where every item can be marked for inclusion or exclusion from the brief.

### Brief curation

In review mode, each board item shows an exclude/re-include control. Items excluded from the brief remain visible on the board (with a visual indicator) but are omitted from the generated brief. Dismissed agent issues and rejected decisions are excluded by default but can be re-included.

### Brief generation

Once the host has curated the board, the brief is generated via `/api/analyze-brief`. The LLM receives:

- All included decisions (with evidence and status)
- All included risks and open questions
- All included actions
- All included agent issues (with their resolution status)

The brief format:

- **Decisions** — each accepted decision, grouped with the risks and open questions that were live while it was being discussed
- **Open questions** — unresolved questions that the group acknowledged but did not close
- **Actions** — candidate follow-ups with evidence, no fabricated owners or due dates
- **Agent issues** — what agents flagged, whether they were discussed or dismissed, and any related evidence
- **Carry-forward context** — items from prior briefs or runway that were relevant and should thread into the next meeting

If LLM generation fails, the brief falls back to a locally generated Markdown summary using the same curated item set.

### Brief export options

From the brief, the host can:

- **Copy** the brief as Markdown
- **Post to GitHub** as a Discussion (with host approval required; uses the GitHub proxy route)
- **Create GitHub issues** for accepted decisions or actions that have been linked to GitHub items (one issue per item, host-approved)

---

## Access and sharing model

| Context | Access rule |
|---|---|
| Host in Zoom app | Full access via Zoom app identity |
| Shared board URL | High-entropy link; scoped to this meeting only |
| Direct dashboard URL | Requires valid session token in URL or cookie |
| Admin session list | Requires `x-admin-token` header |

Sharing outside the meeting must be explicit (host shares the URL). There is no automatic sharing to calendars or connected channels.

---

## Key behavioral constraints

- LLM output is never treated as ground truth. Every artifact requires host action to move from candidate to record.
- Transcript text is treated as untrusted input. The analysis pipeline ignores any instructions embedded in the transcript.
- Decisions are not marked `accepted` without explicit host action.
- Owners, due dates, and priorities are not invented for actions.
- Dismissed or excluded items are preserved in the session record so the brief can surface what was considered and excluded.
- The product does not decide — it surfaces, organizes, and waits for human judgment.
