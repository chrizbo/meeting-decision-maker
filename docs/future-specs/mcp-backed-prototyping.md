# Future Spec: MCP-Backed Prototyping and GitHub Planning

## Status

Future consideration. Do not implement until the core meeting board, review workflow, and basic post-meeting artifact flow are stable.

## Idea

Allow Room Clarity to use approved MCP capabilities to turn meeting discussion into durable execution artifacts:

- A plan PR in GitHub.
- A comment or update on the issue being discussed.
- A prototype branch or PR when the team explicitly asks to explore an idea.
- Optional supporting artifacts such as screenshots, preview links, fixtures, or design files.

MCPs should be treated as capability adapters, not as agents themselves. Agents decide what to do, MCPs provide controlled access to systems such as GitHub, local dev environments, browsers, data sources, design tools, and deployment providers.

## Product Rationale

Meetings often produce good intent but weak handoff. MCP-backed actions could help by making the output concrete before context disappears:

- Convert decisions into a reviewable plan.
- Attach meeting context to the relevant issue.
- Create a prototype PR from a scoped idea.
- Ground prototypes in real repo conventions and team workflows.
- Keep humans in control of writes to external systems.

The first version should emphasize proposals and review boundaries, not silent mutation of project state.

## Core Model

### Agents

Agents are actors with a goal and judgment.

Candidate agents:

- Planning Agent: drafts implementation plans and meeting follow-up artifacts.
- Prototype Agent: creates code or design prototypes from an approved scope.
- Issue Steward: summarizes decisions and proposes issue updates.
- Data Analyst: uses approved data sources to answer empirical questions or create sanitized prototype fixtures.

### MCP Capabilities

MCPs are hands and eyes. They expose capabilities that agents may use when authorized.

Suggested capability categories:

- `github.read`: read repos, files, issues, PRs, labels, milestones, and project metadata.
- `github.write.plan`: create a branch, commit markdown planning files, and open a draft PR.
- `github.write.issue_comment`: add comments to existing issues.
- `github.write.issue_mutation`: edit issue title, body, labels, assignees, milestones, or state.
- `github.write.project`: update GitHub Project fields.
- `github.write.code`: commit prototype code changes.
- `dev.local`: run local setup, tests, builds, and dev servers in an approved workspace.
- `browser.verify`: open local previews, click through flows, and capture screenshots.
- `deploy.preview`: publish a preview environment.
- `data.query`: query approved data sources.
- `data.fixture`: create sanitized or synthetic fixtures for prototypes.
- `design.create`: create design artifacts in tools such as Figma or Canva.

Capabilities should be permissioned separately. Creating a markdown plan PR is lower risk than editing production code, updating project status, or deploying a preview.

## Context Binding

Before writing to an external system, the meeting needs a working context.

### Explicit Binding

The host or operator selects:

- GitHub organization.
- Repository.
- Optional GitHub Project.
- Optional milestone or label set.
- Optional issue being discussed.

This is the recommended MVP path because it is clear, auditable, and easy to explain.

### Detected Binding

The system can infer likely context from:

- Pasted GitHub issue, PR, project, or repo URLs.
- References such as `owner/repo#123`.
- Branch names.
- Meeting series defaults.
- Prior meeting context.
- Transcript mentions of repo or project names.

Detected context should be presented as a suggestion: "Looks like this is about `owner/repo#123`. Use that?"

### Team Defaults

A recurring meeting can have defaults:

- Product sync maps to a repo and project.
- Engineering planning maps to a repo, project, label set, and milestone.
- Customer escalation maps to a support project or issue template.

Team defaults are useful later, but the first version should work with manual binding.

## Recommended Scope

### Version 1: GitHub Plan PR and Issue Comment

Support two explicit actions:

- Create plan PR.
- Add meeting update to existing issue.

The plan PR flow should:

1. Confirm the target repo.
2. Confirm or create a concise plan title.
3. Create a branch.
4. Add a markdown file to a conventional location.
5. Open a draft PR.
6. Link the PR back to the meeting board.
7. Optionally comment on the bound issue with the PR link.

The issue comment flow should:

1. Confirm the target issue.
2. Draft a structured comment from the meeting context.
3. Ask for approval before posting.
4. Link back to the meeting board or plan PR when available.

Do not edit issue bodies, labels, assignees, project fields, or production code in the first version unless the user explicitly chooses an advanced action.

### Version 2: Prototype PR

Add a "Create prototype PR" action.

The prototype flow should:

1. Confirm repo and issue context.
2. Ask for a bounded prototype scope.
3. Create a branch.
4. Make focused code or fixture changes.
5. Run available checks when the environment supports it.
6. Use browser verification for frontend changes.
7. Open a draft PR with a prototype summary, screenshots, and known limitations.
8. Comment on the bound issue with the PR link.

The prototype should be clearly labeled as exploratory. It should not imply production readiness.

### Version 3: Project and Deployment Integrations

Later versions can add:

- GitHub Project field updates.
- Milestone or label updates.
- Child issue creation.
- Preview deployments.
- Data-backed sanitized fixtures.
- Design-tool mockups.
- Cross-system updates to Linear, Jira, Notion, Slack, or docs.

These should require stronger configuration because project schemas and team norms vary widely.

## GitHub Plan PR Shape

The system should prefer repo conventions when they exist. If no convention is detected, use a path such as:

```text
docs/plans/YYYY-MM-DD-short-topic.md
```

Suggested plan sections:

- Title.
- Meeting context.
- Problem statement.
- Decisions made.
- Proposed approach.
- Prototype scope, when applicable.
- Acceptance criteria.
- Risks and assumptions.
- Open questions.
- Issue updates proposed.
- Follow-up owners.

The PR description should summarize:

- Why the plan exists.
- Which meeting or issue it came from.
- What changed.
- What kind of review is requested.

## Issue Update Options

### Comment on Existing Issue

Recommended first option.

Use a structured comment with:

- Meeting summary.
- Decisions.
- Proposed plan or PR link.
- Open questions.
- Next actions.

This is low risk because it preserves the existing issue body and creates an audit trail.

### Update Issue Body

Useful only when the issue body is known to be canonical and structured.

Risks:

- Can overwrite or confuse human-authored context.
- Requires careful patching.
- May conflict with team-specific issue templates.

This should be an explicit advanced action.

### Create Child Issues

Useful when a plan produces clear work items.

Risks:

- Can create noisy project management artifacts.
- Requires deduplication.
- Needs owner, label, milestone, and project-field conventions.

This should happen only after user approval of a proposed issue list.

### Update GitHub Project Fields

Useful when teams use GitHub Projects as their execution surface.

Risks:

- Project field schemas vary.
- Status changes are socially meaningful.
- Mistakes can disrupt team planning.

This should require project-level configuration before it becomes a normal action.

## Prototyping Options With MCPs

### GitHub-Only Prototype

Use GitHub capabilities to create branch, commit files, and open PR.

Best for:

- Markdown plans.
- Small code spikes.
- Mocked UI states.
- Repo-native documentation or fixtures.

### Local Dev Prototype

Use local dev capabilities with GitHub.

Best for:

- Running the app.
- Installing dependencies.
- Running tests or builds.
- Capturing proof that the prototype works.

This requires reliable environment setup and clear sandbox permissions.

### Browser-Verified Prototype

Use browser automation to inspect the prototype.

Best for:

- Frontend flows.
- Visual QA.
- Screenshots for PRs.
- Desktop and mobile layout checks.

### Data-Backed Prototype

Use data MCPs to answer questions or generate sanitized fixtures.

Best for:

- Analytics dashboards.
- Workflow tools using real examples.
- Decision-support features.

Avoid connecting early prototypes directly to production data. Prefer sanitized or synthetic fixtures with provenance.

### Design Prototype

Use design-tool capabilities to create mockups rather than code.

Best for:

- Early product concepts.
- Non-engineering audiences.
- UI exploration before implementation.

Design prototypes should be a separate action from code prototypes.

### Preview Deployment

Use deployment capabilities to create a shareable preview URL.

Best for:

- Stakeholder demos.
- Async review.
- Customer feedback.

This is high value but should come after branch and PR creation are reliable.

## UX Principles

- Show the current bound repo, project, and issue clearly.
- Ask before writing to GitHub or other external systems.
- Distinguish read-only lookup from write actions.
- Make draft/proposed status obvious.
- Keep artifacts linked: meeting board, plan PR, issue, prototype PR, preview URL.
- Prefer "Create proposal" over "Apply changes" language for early versions.
- Provide concise provenance: what transcript, issue, repo, and data source informed the artifact.

## Permission Rules

Suggested default permissions:

- Reading repo and issue context can be allowed after repo binding.
- Creating a plan PR requires approval.
- Posting an issue comment requires approval.
- Creating prototype code requires approval.
- Editing issue bodies, labels, assignees, milestones, project fields, or deployment state requires explicit advanced approval.
- Querying sensitive data requires data-source-specific permission and visible provenance.

## Data Dependencies

This feature depends on:

- Durable meeting sessions.
- Durable meeting summaries or briefs.
- Decision and action extraction.
- User identity.
- External account connection state.
- Repo/project/issue binding records.
- Audit logs for external writes.
- MCP capability registry and permission model.

## Open Questions

- Should the first plan PR live in the product repo or in a dedicated planning repo?
- How should the app detect repo conventions for plan files?
- Should meeting hosts configure repo/project defaults at the meeting-series level or team level?
- What is the minimum approval UI for posting an issue comment during a live meeting?
- Should prototype PRs and plan PRs be separate branches or the same branch?
- How should screenshots or preview artifacts be stored and linked from PRs?
- What MCP capability registry belongs in the app versus in deployment configuration?
- How should failed local setup be reported without making the meeting feel blocked?
- When should the system suggest a data-backed fixture instead of a purely synthetic mock?
