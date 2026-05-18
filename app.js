const fakeZoomMeeting = {
  topic: 'Product Decision Review',
  meetingId: '843 2219 0042',
  host: 'Bryce Hoffman',
  attendees: ['Bryce Hoffman', 'Chris Butler'],
  dashboardSlug: '/m/7QK4-MVP'
};

const demoVtt = "WEBVTT\n\nNOTE\nSynthetic transcript fixture for Meeting Decision Maker prototype. No real meeting content.\n\n00:00:02.000 --> 00:00:08.000\nBryce Hoffman: Let's use this session to decide whether the first prototype should focus on a live meeting board or a post-meeting summary.\n\n00:00:08.500 --> 00:00:15.000\nChris Butler: I think the live board is the better first bet because it lets us see decisions forming while the conversation is still happening.\n\n00:00:15.500 --> 00:00:22.000\nBryce Hoffman: The summary is easier to build, though. We could upload a transcript, extract decisions, and avoid the timing problem for now.\n\n00:00:22.500 --> 00:00:31.000\nChris Butler: True, but if we do that first, we may learn a lot about summarization and not much about whether the shared page changes the meeting behavior.\n\n00:00:31.500 --> 00:00:39.000\nBryce Hoffman: So the product decision is whether the MVP optimizes for implementation speed or for testing the live facilitation experience.\n\n00:00:39.500 --> 00:00:47.000\nChris Butler: Exactly. My assumption is that the live facilitation experience is the differentiated part. The decision log is useful, but less novel.\n\n00:00:47.500 --> 00:00:56.000\nBryce Hoffman: What has to be true for that to work is that a host can actually pay attention to the page while also running the meeting.\n\n00:00:56.500 --> 00:01:04.000\nChris Butler: That is the biggest risk. Maybe the host needs a very low-friction queue: decisions, risks, and agent hands, nothing else.\n\n00:01:04.500 --> 00:01:13.000\nBryce Hoffman: Another assumption is that people will tolerate the page being screen-shared. It could feel useful, or it could feel like visual noise.\n\n00:01:13.500 --> 00:01:21.000\nChris Butler: We can test that with mock transcript playback. If the page gets distracting, we simplify before we touch Zoom RTMS.\n\n00:01:21.500 --> 00:01:31.000\nBryce Hoffman: If we imagine the live board failing, I think it fails because the agent suggestions arrive too late or are too generic to influence the discussion.\n\n00:01:31.500 --> 00:01:39.000\nChris Butler: Good point. The warning sign would be the host repeatedly ignoring suggestions or saying the team already covered them.\n\n00:01:39.500 --> 00:01:48.000\nBryce Hoffman: Then the mitigation is to tune the agents around fewer, higher-quality interventions. We should start with three agents, not a whole library.\n\n00:01:48.500 --> 00:01:57.000\nChris Butler: Assumptions Challenge, Pre-Mortem, and Argument Dissection feel like the right first three because they map to decisions, plans, and claims.\n\n00:01:57.500 --> 00:02:07.000\nBryce Hoffman: The argument for the live board is that it creates an observable meeting artifact. What evidence do we have that people want that during the meeting, not after?\n\n00:02:07.500 --> 00:02:15.000\nChris Butler: Mostly intuition and prior feedback. We should not pretend we know yet. The prototype should test whether it helps the host intervene.\n\n00:02:15.500 --> 00:02:24.000\nBryce Hoffman: Then let's make the decision lightweight: build the human-shared live board first, support VTT and TXT fixtures, and replay transcripts on a timer.\n\n00:02:24.500 --> 00:02:33.000\nChris Butler: Agreed. We will keep the post-meeting dashboard, but the first product question is whether live decision support changes the conversation.\n\n00:02:33.500 --> 00:02:42.000\nBryce Hoffman: Let's capture that as the decision. MVP is a timed mock-transcript live board, shared by the host, with three queued red-team agents.\n\n00:02:42.500 --> 00:02:48.000\nChris Butler: And the next action is to build the playback loop and agent queue before we worry about Zoom-native integration.\n\n00:02:49.000 --> 00:02:58.000\nBryce Hoffman: Decision: the transcript rail should be hideable during screen share, because sometimes the board needs to be the main artifact.\n\n00:02:58.500 --> 00:03:07.000\nChris Butler: Agreed. The assumption is that hosts will want both modes: transcript visible while reviewing evidence, hidden when facilitating the group.\n\n00:03:07.500 --> 00:03:16.000\nBryce Hoffman: The risk is that hiding the transcript could make the board feel less grounded if people cannot see why a decision appeared.\n\n00:03:16.500 --> 00:03:25.000\nChris Butler: Then the mitigation is to keep evidence timestamps on each card, even when the transcript panel is hidden.\n\n00:03:25.500 --> 00:03:35.000\nBryce Hoffman: Decision: clicking any decision, risk, action, or agent issue should open a facilitation modal with suggested next steps.\n\n00:03:35.500 --> 00:03:45.000\nChris Butler: The argument for that is that the host should not just see an alert; they need help knowing what to say next.\n\n00:03:45.500 --> 00:03:54.000\nBryce Hoffman: What evidence do we have that hosts will use a modal live rather than just ignore it?\n\n00:03:54.500 --> 00:04:04.000\nChris Butler: We do not know yet. The prototype should tell us whether the modal is helpful or too much interaction during a meeting.\n\n00:04:04.500 --> 00:04:14.000\nBryce Hoffman: Decision: risks and actions should be removable with a small x when the host thinks the capture is wrong or not useful.\n\n00:04:14.500 --> 00:04:23.000\nChris Butler: That creates a failure mode too. If it is too easy to remove things, a host might erase useful dissent too quickly.\n\n00:04:23.500 --> 00:04:32.000\nBryce Hoffman: The warning sign is if the host removes agent issues before the team has a chance to consider them.\n\n00:04:32.500 --> 00:04:42.000\nChris Butler: Action: we should eventually track dismissed items so the meeting record can show what was removed and by whom.\n\n00:04:42.500 --> 00:04:52.000\nBryce Hoffman: Decision: the shared dashboard URL can be open-by-link for the prototype, but it must be hard to guess.\n\n00:04:52.500 --> 00:05:02.000\nChris Butler: Longer term, the dashboard should support account access through Google or Zoom login before we use this with sensitive meetings.\n\n00:05:02.500 --> 00:05:12.000\nBryce Hoffman: Decision: keep the full transcript with the meeting record for now, because the evidence matters while we are learning the product shape.\n\n00:05:12.500 --> 00:05:23.000\nChris Butler: The assumption is that prototype users are comfortable with that retention because they control the uploaded transcript fixtures.\n\n00:05:23.500 --> 00:05:34.000\nBryce Hoffman: If that assumption is wrong, the product needs retention controls earlier than we planned.\n\n00:05:34.500 --> 00:05:44.000\nChris Butler: Action: add retention settings to the production-readiness list, but do not block the static prototype on that.\n";

const state = {
  cues: [],
  playedCueIds: new Set(),
  decisions: [],
  risks: [],
  actions: [],
  agents: [],
  audit: [],
  llmOutput: null,
  currentTime: 0,
  duration: 0,
  playing: false,
  lastTick: 0,
  speed: 1,
  filter: 'all',
  transcriptVisible: true,
  boardDirty: true,
  openModalItem: null,
  zoomSession: null,
  meetingContext: fakeZoomMeeting
};

const els = {
  playButton: document.querySelector('#playButton'),
  resetButton: document.querySelector('#resetButton'),
  toggleTranscriptButton: document.querySelector('#toggleTranscriptButton'),
  workspace: document.querySelector('.workspace'),
  transcriptFile: document.querySelector('#transcriptFile'),
  speedSelect: document.querySelector('#speedSelect'),
  meetingStatus: document.querySelector('#meetingStatus'),
  meetingName: document.querySelector('#meetingName'),
  meetingAttendees: document.querySelector('#meetingAttendees'),
  boardTitle: document.querySelector('#boardTitle'),
  dashboardUrl: document.querySelector('#dashboardUrl'),
  clock: document.querySelector('#clock'),
  progressBar: document.querySelector('#progressBar'),
  transcriptList: document.querySelector('#transcriptList'),
  decisionStrip: document.querySelector('#decisionStrip'),
  riskList: document.querySelector('#riskList'),
  actionList: document.querySelector('#actionList'),
  riskCount: document.querySelector('#riskCount'),
  actionCount: document.querySelector('#actionCount'),
  queueCount: document.querySelector('#queueCount'),
  agentQueue: document.querySelector('#agentQueue'),
  filters: document.querySelectorAll('.agent-filter'),
  modal: document.querySelector('#detailModal'),
  modalClose: document.querySelector('#modalClose'),
  modalEyebrow: document.querySelector('#modalEyebrow'),
  modalTitle: document.querySelector('#modalTitle'),
  modalSummary: document.querySelector('#modalSummary'),
  modalTranscript: document.querySelector('#modalTranscript'),
  modalConversation: document.querySelector('#modalConversation'),
  modalSteps: document.querySelector('#modalSteps'),
  auditSection: document.querySelector('#auditSection'),
  auditList: document.querySelector('#auditList'),
  auditCount: document.querySelector('#auditCount'),
  modalDecisionActions: document.querySelector('#modalDecisionActions'),
  modalAcceptDecision: document.querySelector('#modalAcceptDecision'),
  modalRejectDecision: document.querySelector('#modalRejectDecision'),
  modalAgentActions: document.querySelector('#modalAgentActions'),
  modalDiscussed: document.querySelector('#modalDiscussed'),
  modalDismiss: document.querySelector('#modalDismiss')
};

function applyMeetingContext(meeting) {
  state.meetingContext = meeting;
  els.boardTitle.textContent = meeting.topic;
  els.meetingName.textContent = meeting.meetingId ? 'Zoom meeting ' + meeting.meetingId : 'Meeting session';
  els.meetingAttendees.textContent = meeting.attendees.join(', ');
  els.dashboardUrl.textContent = meeting.dashboardSlug;
  els.meetingStatus.textContent = meeting.topic + ' · host ' + meeting.host;
}

function absoluteDashboardPath(path) {
  if (!path) return fakeZoomMeeting.dashboardSlug;
  if (path.startsWith('http')) return path;
  return window.location.origin + path;
}

function normalizeZoomMeetingContext(context) {
  const meetingId = context.meetingID || context.meetingId || context.meetingNumber || context.meetingUUID || '';
  const topic = context.meetingTopic || context.topic || context.meetingName || fakeZoomMeeting.topic;
  return {
    topic: topic,
    meetingId: String(meetingId || '').trim(),
    host: context.hostName || context.userName || 'Zoom host',
    attendees: context.userName ? [context.userName] : [],
    dashboardSlug: fakeZoomMeeting.dashboardSlug
  };
}

async function createMeetingSession(meeting) {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      platform: 'zoom',
      topic: meeting.topic,
      host: meeting.host,
      attendees: meeting.attendees,
      zoomMeetingId: meeting.meetingId
    })
  });
  if (!response.ok) throw new Error('session request failed');
  return response.json();
}

async function maybeInitializeZoomApp() {
  if (!window.zoomSdk) {
    els.meetingStatus.textContent = fakeZoomMeeting.topic + ' · browser demo mode';
    return;
  }

  try {
    await window.zoomSdk.config({
      version: '0.16.0',
      capabilities: [
        'getMeetingContext',
        'getMeetingParticipants',
        'openUrl',
        'shareApp'
      ]
    });
  } catch (error) {
    els.meetingStatus.textContent = fakeZoomMeeting.topic + ' · Zoom SDK unavailable';
    return;
  }

  document.body.classList.add('zoom-app-surface');
  state.transcriptVisible = false;
  els.workspace.classList.add('transcript-hidden');
  els.toggleTranscriptButton.textContent = 'Show Transcript';

  try {
    const context = await window.zoomSdk.getMeetingContext();
    const meeting = normalizeZoomMeetingContext(context || {});
    let participants = [];
    if (typeof window.zoomSdk.getMeetingParticipants === 'function') {
      try {
        const participantResponse = await window.zoomSdk.getMeetingParticipants();
        participants = Array.isArray(participantResponse.participants)
          ? participantResponse.participants.map(function(person) { return person.screenName || person.userName || person.displayName; }).filter(Boolean)
          : [];
      } catch (error) {
        participants = [];
      }
    }
    if (participants.length) meeting.attendees = participants;

    const session = await createMeetingSession(meeting);
    meeting.dashboardSlug = absoluteDashboardPath(session.dashboardPath);
    state.zoomSession = session;
    applyMeetingContext(meeting);
    els.meetingStatus.textContent = meeting.topic + ' · Zoom session ready';
  } catch (error) {
    els.meetingStatus.textContent = fakeZoomMeeting.topic + ' · Zoom context unavailable';
  }
}

function parseTimestamp(value) {
  const parts = value.trim().split(':');
  const seconds = parts.pop().split('.');
  const sec = Number(seconds[0] || 0);
  const ms = Number((seconds[1] || '0').padEnd(3, '0').slice(0, 3));
  const min = Number(parts.pop() || 0);
  const hr = Number(parts.pop() || 0);
  return hr * 3600 + min * 60 + sec + ms / 1000;
}

function parseSpeaker(text) {
  const match = text.match(/^([^:]{2,48}):\s+([\s\S]+)/);
  if (!match) return { speaker: 'Unknown', text: text };
  return { speaker: match[1].trim(), text: match[2].trim() };
}

function parseVtt(raw) {
  const blocks = raw.replace(/\r/g, '').split(/\n\n+/);
  return blocks.flatMap(function(block, index) {
    const lines = block.split('\n').map(function(line) { return line.trim(); }).filter(Boolean);
    const timeIndex = lines.findIndex(function(line) { return line.includes('-->'); });
    if (timeIndex === -1) return [];
    const times = lines[timeIndex].split('-->').map(function(part) { return part.trim().split(/\s+/)[0]; });
    const body = lines.slice(timeIndex + 1).join(' ');
    if (!body) return [];
    const parsed = parseSpeaker(body);
    return [{
      id: 'cue-' + index,
      start: parseTimestamp(times[0]),
      end: parseTimestamp(times[1]),
      speaker: parsed.speaker,
      text: parsed.text
    }];
  }).sort(function(a, b) { return a.start - b.start; });
}

function parseTxt(raw) {
  const lines = raw.replace(/\r/g, '').split('\n').map(function(line) { return line.trim(); }).filter(Boolean);
  return lines.map(function(line, index) {
    const parsed = parseSpeaker(line);
    return {
      id: 'txt-' + index,
      start: index * 6,
      end: index * 6 + 5.5,
      speaker: parsed.speaker,
      text: parsed.text
    };
  });
}

function loadTranscript(raw, filename) {
  const sourceName = filename || 'product-decision-demo.vtt';
  const isVtt = sourceName.toLowerCase().endsWith('.vtt') || raw.trimStart().startsWith('WEBVTT');
  state.cues = isVtt ? parseVtt(raw) : parseTxt(raw);
  state.duration = Math.max.apply(null, state.cues.map(function(cue) { return cue.end; }).concat([1]));
  resetState(false);
  renderTranscript();
  renderAll();
}

function resetState(keepTranscript) {
  const meeting = state.meetingContext || fakeZoomMeeting;
  state.playedCueIds = new Set();
  state.decisions = [];
  state.risks = [];
  state.actions = [];
  state.agents = [];
  state.audit = [];
  state.currentTime = 0;
  state.openModalItem = null;
  state.boardDirty = true;
  state.playing = false;
  state.lastTick = 0;
  els.playButton.textContent = 'Start';
  els.meetingStatus.textContent = keepTranscript === false
    ? meeting.topic + ' · transcript loaded'
    : meeting.topic + ' · reset';
}

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const min = String(Math.floor(total / 60)).padStart(2, '0');
  const sec = String(total % 60).padStart(2, '0');
  return min + ':' + sec;
}

function renderTranscript() {
  els.transcriptList.innerHTML = state.cues.map(function(cue) {
    return '<article class="transcript-cue" id="' + cue.id + '" data-cue-id="' + cue.id + '">' +
      '<div class="transcript-meta"><span>' + formatTime(cue.start) + '</span><span>' + escapeHtml(cue.speaker) + '</span></div>' +
      '<p class="transcript-text">' + escapeHtml(cue.text) + '</p>' +
      '</article>';
  }).join('');
}

function renderAll() {
  els.clock.textContent = formatTime(state.currentTime);
  els.progressBar.style.width = Math.min((state.currentTime / state.duration) * 100, 100) + '%';
  renderCueHighlight();
  if (state.boardDirty) {
    renderDecisions();
    renderStacks();
    renderAgents();
    renderAudit();
    state.boardDirty = false;
  }
}

function renderCueHighlight() {
  const active = state.cues.find(function(cue) { return state.currentTime >= cue.start && state.currentTime < cue.end; });
  document.querySelectorAll('.transcript-cue.active').forEach(function(node) { node.classList.remove('active'); });
  if (!active) return;
  const node = document.getElementById(active.id);
  if (node) {
    node.classList.add('active');
    node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function renderDecisions() {
  if (!state.decisions.length) {
    els.decisionStrip.innerHTML = '<article class="decision-card empty-state">' +
      '<span class="status-pill">listening</span>' +
      '<h3>No decision captured yet</h3>' +
      '<p>The board will fill as the transcript replays.</p>' +
      '</article>';
    return;
  }
  els.decisionStrip.innerHTML = state.decisions.map(function(item) {
    return '<article class="decision-card interactive-card" data-open-type="decision" data-open-id="' + item.id + '">' +
      '<span class="status-pill ' + item.status + '">' + item.status + '</span>' +
      '<h3>' + escapeHtml(item.title) + '</h3>' +
      '<p>' + escapeHtml(item.detail) + '</p>' +
      '<p class="agent-evidence">' + escapeHtml(item.evidence) + '</p>' +
      '</article>';
  }).join('');
}

function renderStacks() {
  els.riskCount.textContent = state.risks.length;
  els.actionCount.textContent = state.actions.length;
  els.riskList.innerHTML = state.risks.map(function(item) { return stackItem(item, 'risk'); }).join('') || emptyStack('No risks captured');
  els.actionList.innerHTML = state.actions.map(function(item) { return stackItem(item, 'action'); }).join('') || emptyStack('No actions captured');
}

function renderAgents() {
  const visible = state.agents.filter(function(agent) { return state.filter === 'all' || agent.status === state.filter; });
  els.queueCount.textContent = state.agents.filter(function(agent) { return agent.status === 'open'; }).length;
  els.agentQueue.innerHTML = visible.map(function(agent) {
    return '<article class="agent-card ' + agent.status + '" data-open-type="agent" data-open-id="' + agent.id + '" data-agent-id="' + agent.id + '">' +
      '<div class="agent-card-header"><div class="agent-name">' + escapeHtml(agent.agent) + '</div>' +
      '<span class="priority-pill ' + agent.priority + '">' + agent.priority + '</span></div>' +
      (agent.discussionSuggested ? '<div class="agent-auto-note">Possibly discussed</div>' : '') +
      '<p>' + escapeHtml(agent.intervention) + '</p>' +
      '<div class="agent-evidence">' + escapeHtml(agent.evidence) + '</div>' +
      '<div class="agent-actions">' +
      '<button type="button" data-action="discussed" data-agent-id="' + agent.id + '">Discussed</button>' +
      '<button type="button" data-action="dismiss" data-agent-id="' + agent.id + '">Dismiss</button>' +
      '</div></article>';
  }).join('') || emptyStack('No agent suggestions');
}

function stackItem(item, type) {
  return '<article class="stack-item interactive" data-open-type="' + type + '" data-open-id="' + item.id + '">' +
    '<div class="stack-item-header">' +
    '<strong>' + escapeHtml(item.title) + '</strong>' +
    '<button class="remove-item" type="button" aria-label="Remove ' + type + '" data-remove-type="' + type + '" data-remove-id="' + item.id + '">x</button>' +
    '</div>' +
    '<p>' + escapeHtml(item.detail) + '</p>' +
    '<p class="agent-evidence">' + escapeHtml(item.evidence) + '</p>' +
    '</article>';
}

function emptyStack(text) {
  return '<div class="stack-item"><p>' + text + '</p></div>';
}

function tick(now) {
  if (!state.playing) return;
  if (!state.lastTick) state.lastTick = now;
  const elapsed = ((now - state.lastTick) / 1000) * state.speed;
  state.lastTick = now;
  state.currentTime = Math.min(state.currentTime + elapsed, state.duration);
  processCues();
  renderAll();
  if (state.currentTime >= state.duration) {
    state.playing = false;
    els.playButton.textContent = 'Start';
    els.meetingStatus.textContent = (state.meetingContext || fakeZoomMeeting).topic + ' · playback complete';
    return;
  }
  requestAnimationFrame(tick);
}

function processCues() {
  state.cues.forEach(function(cue) {
    if (state.currentTime >= cue.start && !state.playedCueIds.has(cue.id)) {
      state.playedCueIds.add(cue.id);
      analyzeCue(cue);
    }
  });
}

function analyzeCue(cue) {
  const text = cue.text.toLowerCase();
  const evidence = formatTime(cue.start) + ' · ' + cue.speaker;

  if (applyLlmFixtureForCue(cue, evidence)) {
    detectAgentDiscussion(cue, evidence);
    return;
  }

  if (text.includes('product decision') || text.includes('decision is whether')) {
    addDecision('pending', 'MVP focus', 'Choose between implementation speed and testing the live facilitation experience.', evidence);
  }
  if (text.includes("let's make the decision") || text.includes('agreed') || text.includes('capture that as the decision')) {
    addDecision('accepted', 'Build the live board first', 'Use a human-shared page with timed mock transcript playback before Zoom-native integration.', evidence);
  }
  if (text.includes('decision: the transcript rail should be hideable')) {
    addDecision('accepted', 'Make transcript optional', 'Allow the host to hide or show the transcript rail during screen share.', evidence);
  }
  if (text.includes('decision: clicking any decision')) {
    addDecision('accepted', 'Open guidance modals', 'Clicking decisions, risks, actions, and agent issues should open facilitation guidance.', evidence);
  }
  if (text.includes('decision: risks and actions should be removable')) {
    addDecision('accepted', 'Allow cleanup of captures', 'Risks and actions can be removed when the host decides they are not useful.', evidence);
  }
  if (text.includes('decision: the shared dashboard url')) {
    addDecision('accepted', 'Use unguessable shared links', 'Prototype dashboards are open-by-link but should not be easy to guess.', evidence);
  }
  if (text.includes('decision: keep the full transcript')) {
    addDecision('accepted', 'Retain full transcript', 'Keep the full transcript attached to the meeting record during the prototype.', evidence);
  }
  if (text.includes('next action') || text.includes('action:')) {
    const actionTitle = text.includes('retention settings') ? 'Add retention settings later' : 'Build playback and queue';
    const actionDetail = text.includes('retention settings')
      ? 'Add retention settings to production readiness without blocking the static prototype.'
      : 'Implement the transcript playback loop and agent queue before Zoom integration.';
    addAction(actionTitle, actionDetail, evidence);
  }
  if (text.includes('risk') || text.includes('fails') || text.includes('distracting') || text.includes('too late') || text.includes('failure mode')) {
    addRisk(inferRiskTitle(text), inferRiskSummary(text, cue.text), evidence, cue.text);
  }

  detectAgentDiscussion(cue, evidence);
  maybeAddAgent(cue, evidence);
}


function applyLlmFixtureForCue(cue, evidence) {
  if (!state.llmOutput || !Array.isArray(state.llmOutput.events)) return false;
  const event = state.llmOutput.events.find(function(record) {
    return Math.abs(Number(record.at) - cue.start) < 0.01;
  });
  if (!event || !Array.isArray(event.items)) return false;
  event.items.forEach(function(item) {
    if (item.type === 'decision') addDecision(item.status || 'pending', item.title, item.summary, evidence, { transcriptText: cue.text });
    if (item.type === 'risk') addRisk(item.title, item.summary, evidence, cue.text);
    if (item.type === 'action') addAction(item.title, item.summary, evidence);
    if (item.type === 'agent_issue') addAgent({
      agent: item.agent,
      priority: item.priority || 'medium',
      intervention: item.summary,
      evidence: evidence,
      createdCueId: cue.id
    });
  });
  return true;
}

async function loadLlmOutput() {
  try {
    const response = await fetch('./fixtures/mock-llm-output.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('fixture unavailable');
    state.llmOutput = await response.json();
    els.meetingStatus.textContent = (state.meetingContext || fakeZoomMeeting).topic + ' · mock LLM fixture loaded';
  } catch (error) {
    state.llmOutput = null;
    els.meetingStatus.textContent = (state.meetingContext || fakeZoomMeeting).topic + ' · using browser fallback rules';
  }
}

function maybeAddAgent(cue, evidence) {
  const text = cue.text.toLowerCase();
  if (text.includes('assumption') || text.includes('has to be true') || text.includes('pretend we know')) {
    addAgent({
      agent: 'Assumptions Challenge',
      priority: text.includes('has to be true') ? 'high' : 'medium',
      intervention: 'What evidence would make us confident that the host can use the shared page while still running the meeting?',
      evidence: evidence,
      createdCueId: cue.id
    });
  }
  if (text.includes('failing') || text.includes('fails') || text.includes('warning sign') || text.includes('mitigation')) {
    addAgent({
      agent: 'Pre-Mortem',
      priority: text.includes('fails because') ? 'high' : 'medium',
      intervention: 'If the live board fails, the likely path is late or generic suggestions; the mitigation is fewer, sharper agent interventions.',
      evidence: evidence,
      createdCueId: cue.id
    });
  }
  if (text.includes('argument') || text.includes('evidence') || text.includes('intuition') || text.includes('feedback')) {
    addAgent({
      agent: 'Argument Dissection',
      priority: text.includes('what evidence') ? 'high' : 'medium',
      intervention: 'Before relying on this rationale, separate what is evidence from what is intuition or prior feedback.',
      evidence: evidence,
      createdCueId: cue.id
    });
  }
}

function inferRiskTitle(text) {
  if (text.includes('host can actually pay attention')) return 'Host attention risk';
  if (text.includes('screen-shared') || text.includes('visual noise')) return 'Screen-share distraction risk';
  if (text.includes('too late') || text.includes('too generic')) return 'Agent timing and quality risk';
  if (text.includes('hiding the transcript') || text.includes('less grounded')) return 'Evidence visibility risk';
  if (text.includes('modal is helpful') || text.includes('too much interaction')) return 'Modal interaction burden';
  if (text.includes('too easy to remove') || text.includes('erase useful dissent')) return 'Dismissal of useful dissent';
  if (text.includes('removes agent issues')) return 'Premature agent dismissal';
  if (text.includes('sensitive meetings') || text.includes('google or zoom login')) return 'Access control risk';
  if (text.includes('retention controls') || text.includes('assumption is wrong')) return 'Transcript retention risk';
  if (text.includes('fails')) return 'Plan failure risk';
  if (text.includes('risk')) return 'Unresolved risk';
  return 'Meeting concern';
}

function inferRiskSummary(text, originalText) {
  if (text.includes('host can actually pay attention')) return 'The host may not be able to facilitate the meeting and monitor the shared board at the same time.';
  if (text.includes('screen-shared') || text.includes('visual noise')) return 'The shared page may distract participants or create visual noise during the meeting.';
  if (text.includes('too late') || text.includes('too generic')) return 'Agent suggestions may arrive too late or be too generic to influence the conversation.';
  if (text.includes('hiding the transcript') || text.includes('less grounded')) return 'Hiding the transcript could make captured items feel less grounded in evidence.';
  if (text.includes('modal is helpful') || text.includes('too much interaction')) return 'Opening modals during a live meeting may add too much interaction burden for the host.';
  if (text.includes('too easy to remove') || text.includes('erase useful dissent')) return 'Hosts may remove useful dissent or unresolved risks too quickly.';
  if (text.includes('removes agent issues')) return 'Agent issues may be dismissed before the team has considered them.';
  if (text.includes('sensitive meetings') || text.includes('google or zoom login')) return 'Open dashboard links may not be appropriate for sensitive meetings without account-based access controls.';
  if (text.includes('retention controls') || text.includes('assumption is wrong')) return 'Full transcript retention may need configurable controls earlier than planned.';
  if (text.includes('fails')) return 'The plan has a plausible failure mode that should be named and mitigated.';
  return summarizeRiskText(originalText);
}

function summarizeRiskText(text) {
  return text.length > 120 ? text.slice(0, 117).trim() + '...' : text;
}

function buildTranscriptReference(evidence, detail) {
  return (evidence || 'No timestamp available') + ' — ' + (detail || 'No transcript excerpt captured.');
}

function addDecision(status, title, detail, evidence, options) {
  const decisionStatus = 'pending';
  const key = 'decision:' + title;
  if (state.decisions.some(function(item) { return item.key === key; })) return;
  state.boardDirty = true;
  state.decisions.unshift({
    id: makeId('decision'),
    key: key,
    status: decisionStatus,
    suggestedStatus: status || 'pending',
    title: title,
    detail: detail,
    evidence: evidence,
    transcriptReference: buildTranscriptReference(evidence, options && options.transcriptText ? options.transcriptText : detail),
    conversation: 'Name the pending decision out loud and ask whether the room accepts, rejects, or needs to revise it before it becomes part of the meeting record.',
    steps: ['Confirm the exact commitment.', 'Ask for blocking objections or missing evidence.', 'Accept or reject the decision from this modal.']
  });
}

function addRisk(title, detail, evidence, transcriptText) {
  if (state.risks.some(function(item) { return item.detail === detail; })) return;
  state.boardDirty = true;
  state.risks.unshift({
    id: makeId('risk'),
    title: title,
    detail: detail,
    evidence: evidence,
    transcriptReference: buildTranscriptReference(evidence, transcriptText || detail),
    conversation: 'Ask whether this risk is acceptable, preventable, or something the team should monitor as a warning sign.',
    steps: ['Decide whether to mitigate, monitor, or dismiss the risk.', 'Assign an owner if mitigation is needed.', 'Define the earliest observable warning sign.']
  });
}

function addAction(title, detail, evidence) {
  if (state.actions.some(function(item) { return item.title === title; })) return;
  state.boardDirty = true;
  state.actions.unshift({
    id: makeId('action'),
    title: title,
    detail: detail,
    evidence: evidence,
    transcriptReference: buildTranscriptReference(evidence, detail),
    conversation: 'Confirm the action owner, expected output, and what decision or risk this action supports.',
    steps: ['Assign an owner.', 'Set a review date or next meeting checkpoint.', 'Connect the action to the decision it advances.']
  });
}

function addAgent(agent) {
  const key = agent.agent + ':' + agent.intervention;
  if (state.agents.some(function(item) { return item.key === key; })) return;
  state.boardDirty = true;
  state.agents.unshift(Object.assign({
    id: makeId('agent'),
    key: key,
    status: 'open',
    discussionSuggested: false,
    discussedByTranscript: false,
    followUp: '',
    topics: agentTopics(agent.agent),
    transcriptReference: buildTranscriptReference(agent.evidence, agent.intervention),
    conversation: agentConversation(agent.agent),
    steps: agentSteps(agent.agent)
  }, agent));
}

function agentTopics(agentName) {
  if (agentName === 'Assumptions Challenge') return ['assumption', 'what has to be true', 'evidence', 'confidence', 'if that assumption is wrong', 'we do not know'];
  if (agentName === 'Pre-Mortem') return ['failure', 'fails', 'risk', 'warning sign', 'mitigation', 'contingency'];
  if (agentName === 'Argument Dissection') return ['argument', 'evidence', 'intuition', 'feedback', 'rationale', 'alternative'];
  return [];
}

function detectAgentDiscussion(cue, evidence) {
  const text = cue.text.toLowerCase();
  state.agents.forEach(function(agent) {
    if (agent.status !== 'open' || agent.discussionSuggested || agent.createdCueId === cue.id) return;
    const matched = (agent.topics || []).some(function(topic) { return text.includes(topic); });
    if (!matched) return;
    agent.discussionSuggested = true;
    agent.followUp = 'The team appears to be discussing this issue now. The host should decide whether the issue was actually resolved, should stay open, or should be dismissed.';
    agent.transcriptReference = agent.transcriptReference + '\nPossibly discussed at ' + evidence + ' — ' + cue.text;
    state.boardDirty = true;
  });
}

function makeId(prefix) {
  const value = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : String(Date.now() + Math.random());
  return prefix + '-' + value;
}

function agentConversation(agentName) {
  if (agentName === 'Assumptions Challenge') return 'Ask the team to say what must be true for this decision to work and what evidence would increase confidence.';
  if (agentName === 'Pre-Mortem') return 'Invite the group to imagine the decision failed and name the most likely path to that failure.';
  if (agentName === 'Argument Dissection') return 'Separate the claim, evidence, and conclusion before the team relies on this rationale.';
  return 'Ask whether this point should be discussed now, captured for later, or dismissed.';
}

function agentSteps(agentName) {
  if (agentName === 'Assumptions Challenge') return ['Identify the assumption underneath the decision.', 'Ask what evidence supports it.', 'Decide whether to test, mitigate, or accept the uncertainty.'];
  if (agentName === 'Pre-Mortem') return ['Name the failure scenario.', 'Identify the cause that would make it happen.', 'Capture one mitigation and one warning sign.'];
  if (agentName === 'Argument Dissection') return ['Restate the argument in one sentence.', 'Ask what evidence is missing or ambiguous.', 'Consider one alternative explanation before deciding.'];
  return ['Decide whether to discuss now.', 'Capture the follow-up owner.', 'Mark the item discussed or dismiss it.'];
}

function findBoardItem(type, id) {
  if (type === 'decision') return state.decisions.find(function(item) { return item.id === id; });
  if (type === 'risk') return state.risks.find(function(item) { return item.id === id; });
  if (type === 'action') return state.actions.find(function(item) { return item.id === id; });
  if (type === 'agent') return state.agents.find(function(item) { return item.id === id; });
  if (type === 'audit') return state.audit.find(function(item) { return item.id === id; });
  return null;
}

function openDetailModal(type, id) {
  const item = findBoardItem(type, id);
  if (!item) return;
  els.modalEyebrow.textContent = type === 'agent' ? 'Agent Issue' : type;
  els.modalTitle.textContent = type === 'agent' ? item.agent : item.title;
  els.modalSummary.textContent = item.detail || item.intervention;
  els.modalTranscript.textContent = item.transcriptReference || item.evidence || 'No transcript reference captured.';
  els.modalConversation.textContent = item.followUp || item.conversation || 'Use this item to slow the conversation down, clarify what is being decided, and name the next useful question.';
  els.modalSteps.innerHTML = (item.steps || []).map(function(step) { return '<li>' + escapeHtml(step) + '</li>'; }).join('');
  state.openModalItem = { type: type, id: id };
  els.modalDecisionActions.hidden = type !== 'decision';
  els.modalAgentActions.hidden = type !== 'agent';
  if (type === 'decision') {
    els.modalAcceptDecision.disabled = item.status === 'accepted';
    els.modalRejectDecision.disabled = item.status === 'rejected';
  }
  els.modal.classList.add('open');
  els.modal.setAttribute('aria-hidden', 'false');
}

function closeDetailModal() {
  els.modal.classList.remove('open');
  els.modal.setAttribute('aria-hidden', 'true');
  state.openModalItem = null;
}

function markAgent(id, action) {
  const agent = state.agents.find(function(item) { return item.id === id; });
  if (!agent) return;
  if (action === 'dismiss') {
    addAuditRecord('agent', agent, 'dismissed');
    state.agents = state.agents.filter(function(item) { return item.id !== id; });
    closeDetailModal();
  } else {
    agent.status = 'discussed';
    agent.discussedByTranscript = agent.discussedByTranscript || false;
    agent.discussionSuggested = false;
    if (!agent.followUp) agent.followUp = 'Marked discussed by the host.';
  }
  state.boardDirty = true;
  renderAll();
}

function removeBoardItem(type, id) {
  const item = findBoardItem(type, id);
  if (!item) return;
  addAuditRecord(type, item, 'dismissed');
  if (type === 'risk') state.risks = state.risks.filter(function(record) { return record.id !== id; });
  if (type === 'action') state.actions = state.actions.filter(function(record) { return record.id !== id; });
  state.boardDirty = true;
  renderAll();
}


function markDecision(id, action) {
  const decision = state.decisions.find(function(item) { return item.id === id; });
  if (!decision) return;
  if (action === 'accepted') {
    decision.status = 'accepted';
    decision.conversation = 'The host accepted this decision. Ask whether the team wants to capture an owner, review point, or decision-log destination.';
    decision.steps = ['Capture the owner of the decision record.', 'Confirm the next action tied to the decision.', 'Log unresolved assumptions as risks if needed.'];
  }
  if (action === 'rejected') {
    addAuditRecord('decision', decision, 'rejected');
    state.decisions = state.decisions.filter(function(item) { return item.id !== id; });
    closeDetailModal();
  }
  state.boardDirty = true;
  renderAll();
}

function addAuditRecord(type, item, disposition) {
  state.audit.unshift({
    id: makeId('audit'),
    type: type,
    disposition: disposition,
    title: item.title || item.agent || type,
    detail: item.detail || item.intervention || '',
    evidence: item.evidence || '',
    transcriptReference: item.transcriptReference || buildTranscriptReference(item.evidence, item.detail || item.intervention),
    conversation: 'This item was moved out of the active board. Review whether it should stay dismissed, be restored, or become a follow-up after the meeting.',
    steps: ['Review the original evidence.', 'Decide whether the dismissal should stand.', 'If needed, recreate the item as a new risk, action, or decision.']
  });
}

function renderAudit() {
  els.auditCount.textContent = state.audit.length;
  els.auditList.innerHTML = state.audit.map(function(item) {
    return '<article class="audit-item interactive" data-open-type="audit" data-open-id="' + item.id + '">' +
      '<div><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.type + ' · ' + item.disposition) + '</span></div>' +
      '<p>' + escapeHtml(item.detail) + '</p>' +
      '</article>';
  }).join('') || '<div class="audit-empty">Dismissed and rejected items will appear here.</div>';
}

function handleOpenClick(event) {
  const target = event.target.closest('[data-open-type][data-open-id]');
  if (!target) return;
  openDetailModal(target.dataset.openType, target.dataset.openId);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, function(char) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#039;',
      '"': '&quot;'
    }[char];
  });
}

els.playButton.addEventListener('click', function() {
  const meeting = state.meetingContext || fakeZoomMeeting;
  state.playing = !state.playing;
  state.lastTick = 0;
  els.playButton.textContent = state.playing ? 'Pause' : 'Start';
  els.meetingStatus.textContent = state.playing ? meeting.topic + ' · live playback' : meeting.topic + ' · paused';
  if (state.playing) requestAnimationFrame(tick);
});

els.toggleTranscriptButton.addEventListener('click', function() {
  state.transcriptVisible = !state.transcriptVisible;
  els.workspace.classList.toggle('transcript-hidden', !state.transcriptVisible);
  els.toggleTranscriptButton.textContent = state.transcriptVisible ? 'Hide Transcript' : 'Show Transcript';
});

els.resetButton.addEventListener('click', function() {
  resetState();
  renderAll();
});

els.speedSelect.addEventListener('change', function(event) {
  state.speed = Number(event.target.value);
});

els.transcriptFile.addEventListener('change', async function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  loadTranscript(text, file.name);
});

document.addEventListener('click', function(event) {
  const removeButton = event.target.closest('[data-remove-type]');
  if (removeButton) {
    event.preventDefault();
    event.stopPropagation();
    removeBoardItem(removeButton.dataset.removeType, removeButton.dataset.removeId);
    return;
  }

  const agentButton = event.target.closest('button[data-agent-id]');
  if (agentButton) {
    event.preventDefault();
    event.stopPropagation();
    markAgent(agentButton.dataset.agentId, agentButton.dataset.action);
    return;
  }

  handleOpenClick(event);
});

els.modalAcceptDecision.addEventListener('click', function() {
  if (!state.openModalItem || state.openModalItem.type !== 'decision') return;
  const id = state.openModalItem.id;
  markDecision(id, 'accepted');
  openDetailModal('decision', id);
});

els.modalRejectDecision.addEventListener('click', function() {
  if (!state.openModalItem || state.openModalItem.type !== 'decision') return;
  markDecision(state.openModalItem.id, 'rejected');
});

els.modalDiscussed.addEventListener('click', function() {
  if (!state.openModalItem || state.openModalItem.type !== 'agent') return;
  markAgent(state.openModalItem.id, 'discussed');
  openDetailModal('agent', state.openModalItem.id);
});

els.modalDismiss.addEventListener('click', function() {
  if (!state.openModalItem || state.openModalItem.type !== 'agent') return;
  markAgent(state.openModalItem.id, 'dismiss');
});

els.modalClose.addEventListener('click', closeDetailModal);
els.modal.addEventListener('click', function(event) {
  if (event.target === els.modal) closeDetailModal();
});
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') closeDetailModal();
});

els.filters.forEach(function(button) {
  button.addEventListener('click', function() {
    state.filter = button.dataset.filter;
    els.filters.forEach(function(item) { item.classList.toggle('active', item === button); });
    state.boardDirty = true;
    renderAll();
  });
});

applyMeetingContext(fakeZoomMeeting);
maybeInitializeZoomApp();
loadLlmOutput().finally(function() {
  loadTranscript(demoVtt, 'product-decision-demo.vtt');
});
