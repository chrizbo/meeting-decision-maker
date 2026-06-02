const fakeZoomMeeting = {
  topic: 'Product Decision Review',
  meetingId: '843 2219 0042',
  host: 'Maya Patel',
  attendees: ['Maya Patel', 'Jordan Lee'],
  dashboardSlug: '/m/7QK4-MVP',
  durationMinutes: 30,
  agenda: 'Team sync: pick our first build direction\n\nWe need to decide between a live facilitation board and a post-meeting decision summary as our first prototype. Both paths have merit but we can only build one first.\n\nTentative agenda:\n- Review the tradeoffs (Jordan, ~15 min)\n- Name the top risks and open assumptions on each path\n- Make the call — Maya owns the decision\n\nPlease come prepared with your top assumption about which path will teach us more.\n\nGoal: leave with one clear direction and one assigned next step.'
};

const DEFAULT_RUNWAY_SECONDS = 90;

const runwayCases = {
  default: {
    title: 'Live board vs. recap: choose the first build slice',
    agendaTitle: 'Agenda',
    purpose: 'Choose a first prototype direction so the team can start building Monday. The two paths are a live facilitation board and a post-meeting recap tool.',
    agendaItems: [
      {
        title: 'Agree on what this decision is really about',
        owner: 'Maya',
        timeBudget: 5,
        desiredOutcome: 'The room names the core product bet, not just a build choice.'
      },
      {
        title: 'Surface the top risks and assumptions for each path',
        owner: 'Jordan',
        timeBudget: 15,
        desiredOutcome: 'At least one falsifiable assumption per path is on the board before we choose.'
      },
      {
        title: 'Choose a direction and assign the first action',
        owner: 'Maya',
        timeBudget: 10,
        desiredOutcome: 'One direction chosen, one named risk owner, one concrete next step assigned.'
      }
    ],
    decisionFrame: {
      mode: 'Decide',
      owner: 'Maya Patel',
      successCondition: 'One direction chosen, one risk owned, one next action clear before we leave.'
    },
    roles: [
      { label: 'Host', value: 'Maya Patel' },
      { label: 'Decision owner', value: 'Maya Patel' },
      { label: 'Notes owner', value: 'Room Clarity' }
    ],
    participationNorm: 'Name your assumptions out loud — especially the ones you think are obvious.',
    carryForwardItems: [
      'Test whether the shared board changes live meeting behavior.',
      'Keep the first agent set small: assumptions, pre-mortem, argument dissection.',
      'Do not let Zoom-native integration block the static prototype.'
    ],
    openingPrompt: 'What would have to be true for us to be confident in this choice by end of meeting?'
  },
  'messy-agenda': {
    title: 'Start by naming the meeting shape',
    agendaTitle: 'Likely Topics',
    purpose: 'The source agenda is loose, so use these inferred topics to quickly decide what this meeting is really for.',
    agendaItems: [
      {
        title: 'Pricing comments',
        owner: 'Possibly Maya',
        desiredOutcome: 'Clarify whether this is a decision, review, or follow-up topic.'
      },
      {
        title: 'Beta timing concern',
        owner: 'Not clear',
        desiredOutcome: 'Name whether timing needs a choice today.'
      },
      {
        title: 'Customer feedback thread',
        owner: 'Jordan',
        desiredOutcome: 'Separate new evidence from background context.'
      }
    ],
    decisionFrame: {
      mode: 'Needs confirmation',
      owner: 'Not clear',
      successCondition: 'The room agrees what must be decided, reviewed, or parked.'
    },
    roles: [
      { label: 'Host', value: 'Maya Patel' },
      { label: 'Topic owner', value: 'Needs confirmation' },
      { label: 'Notes owner', value: 'Room Clarity' }
    ],
    participationNorm: 'If the agenda feels fuzzy, say what outcome you thought this meeting was supposed to produce.',
    carryForwardItems: [
      'Meeting description mentioned pricing, beta timing, and customer feedback without a sequence.',
      'No explicit decision owner was found.',
      'Treat these as editable guesses, not commitments.'
    ],
    openingPrompt: 'What needs to be decided, reviewed, or unblocked today?'
  },
  'docs-attached': {
    title: 'Start from the attached docs',
    agendaTitle: 'Agenda and Doc Signals',
    purpose: 'Use the attached materials to orient the room without turning the opening into document review.',
    agendaItems: [
      {
        title: 'Confirm beta scope',
        docTitle: 'PRD draft',
        url: 'https://docs.google.com/document/d/mock-prd-draft',
        owner: 'Maya',
        desiredOutcome: 'Use the recently changed pricing and packaging section as decision context.'
      },
      {
        title: 'Close launch owner gaps',
        docTitle: 'Launch checklist',
        url: 'https://docs.google.com/spreadsheets/d/mock-launch-checklist',
        owner: 'Jordan',
        desiredOutcome: 'Resolve three remaining owner gaps.'
      },
      {
        title: 'Resolve prior beta cutoff',
        docTitle: 'Prior meeting notes',
        url: 'https://docs.google.com/document/d/mock-prior-meeting-notes',
        owner: 'Room Clarity',
        desiredOutcome: 'Use the unresolved prior decision as the carry-forward thread.'
      }
    ],
    decisionFrame: {
      mode: 'Review then decide',
      owner: 'Maya Patel',
      successCondition: 'Confirm whether the docs support a beta scope decision today.'
    },
    roles: [
      { label: 'Host', value: 'Maya Patel' },
      { label: 'Doc owner', value: 'Jordan Lee' },
      { label: 'Decision owner', value: 'Maya Patel' }
    ],
    participationNorm: 'Reference the doc when it changes the decision; skip it when it is just background.',
    carryForwardItems: [
      'Open PRD comment asks whether beta users get advanced reporting.',
      'Checklist is missing owners for support docs, analytics review, and sales enablement.',
      'Prior notes asked for a smaller beta but did not define the cutoff.'
    ],
    openingPrompt: 'Which attached-doc signal should change what we decide today?'
  },
  'weak-frame': {
    title: 'The decision frame needs confirmation',
    agendaTitle: 'Possible Focus',
    purpose: 'The meeting has useful context, but the decision authority and success condition are not yet clear.',
    agendaItems: [
      {
        title: 'Live board usefulness',
        owner: 'Maya',
        desiredOutcome: 'Decide whether this is evidence gathering or a product direction choice.'
      },
      {
        title: 'Host attention risk',
        owner: 'Jordan',
        desiredOutcome: 'Clarify whether the risk blocks the next slice.'
      },
      {
        title: 'Prototype next step',
        owner: 'Not clear',
        desiredOutcome: 'Assign one concrete follow-up if the room aligns.'
      }
    ],
    decisionFrame: {
      mode: 'Decide, align, or explore?',
      owner: 'Needs confirmation',
      successCondition: 'The room chooses the kind of meeting before treating anything as a decision.'
    },
    roles: [
      { label: 'Host', value: 'Maya Patel' },
      { label: 'Decision owner', value: 'Unconfirmed' },
      { label: 'Risk owner', value: 'Unconfirmed' }
    ],
    participationNorm: 'Do not let silence turn an unclear frame into accidental agreement.',
    carryForwardItems: [
      'There are signs of a product decision, but no explicit owner.',
      'The group may only need alignment before a later decision.',
      'The board should capture uncertainty rather than invent authority.'
    ],
    openingPrompt: 'Are we deciding something today, or getting aligned enough to decide later?'
  },
  'sparse-context': {
    title: 'Start with one useful question',
    agendaTitle: 'Available Clues',
    purpose: 'There is not enough structured context to build a confident runway, so keep the start lightweight.',
    agendaItems: [
      {
        title: 'Meeting topic only',
        owner: 'Unknown',
        desiredOutcome: 'Product Decision Review'
      },
      {
        title: 'Participants',
        owner: 'Unknown',
        desiredOutcome: 'Maya Patel and Jordan Lee are expected.'
      }
    ],
    decisionFrame: {
      mode: 'Unknown',
      owner: 'Unknown',
      successCondition: 'The host names the goal before the conversation drifts.'
    },
    roles: [
      { label: 'Host', value: 'Maya Patel' },
      { label: 'Decision owner', value: 'Unknown' },
      { label: 'Notes owner', value: 'Room Clarity' }
    ],
    participationNorm: 'Name missing context early instead of filling it in silently.',
    carryForwardItems: [
      'No agenda, docs, or prior brief are attached in this simulation.',
      'Runway content should stay modest when confidence is low.',
      'The first minute should help the host frame the meeting.'
    ],
    openingPrompt: 'What would make this meeting worth ending early?'
  }
};

const runwayStub = configuredRunwayData();

const demoVtt = "WEBVTT\n\nNOTE\nSynthetic transcript fixture for Room Clarity demo. No real meeting content.\n\n00:00:02.000 --> 00:00:08.000\nMaya Patel: Let's work through the open issues in agentics-beyond-code and make some decisions on direction today.\n\n00:00:08.500 --> 00:00:16.000\nJordan Lee: There are five open issues. The core question is issue two — the shared live board with transcript playback — do we build that first?\n\n00:00:16.500 --> 00:00:24.000\nMaya Patel: That is the decision. Live facilitation board first, or post-meeting summary first? Both are in scope, but we can only build one to start.\n\n00:00:24.500 --> 00:00:33.000\nJordan Lee: My position is the live board. Issue one — researching live facilitation patterns — is the question the prototype will answer. We build to learn.\n\n00:00:33.500 --> 00:00:42.000\nMaya Patel: The summary path is lower risk. We could upload a transcript, extract decisions, and defer the timing problem until we have validated demand.\n\n00:00:42.500 --> 00:00:52.000\nJordan Lee: But then we'd spend a sprint learning about summarization and nothing about whether a shared live board changes the meeting dynamic. That's the core bet.\n\n00:00:52.500 --> 00:01:02.000\nMaya Patel: What has to be true for the live board to work is that a host can actually pay attention to the board while also running the meeting.\n\n00:01:02.500 --> 00:01:11.000\nJordan Lee: That's the open assumption in issue two. And the only way to test it is to have something running. The prototype is the research for issue one.\n\n00:01:11.500 --> 00:01:21.000\nMaya Patel: Decision: build the live board prototype first. Issue two is the priority this sprint. The live facilitation experience is the differentiated bet.\n\n00:01:21.500 --> 00:01:31.000\nJordan Lee: The action is to build the playback loop with VTT fixtures so we can replay transcripts and test the board behavior without a live Zoom session.\n\n00:01:31.500 --> 00:01:41.000\nMaya Patel: If we imagine that failing, the risk is that agent suggestions arrive too late or too generic. The host ignores them and the board becomes noise.\n\n00:01:41.500 --> 00:01:51.000\nJordan Lee: The warning sign is the host dismissing everything. The mitigation is starting with three focused agents. Assumptions Challenge, Pre-Mortem, and Argument Dissection.\n\n00:01:51.500 --> 00:02:01.000\nMaya Patel: Next: issue four, decision card modal and host guidance UX. What does the modal show when a host clicks a decision or agent issue?\n\n00:02:01.500 --> 00:02:11.000\nJordan Lee: It needs to give the host something useful to say next. Not just a summary of what was captured — actual conversation prompts and suggested next steps.\n\n00:02:11.500 --> 00:02:20.000\nMaya Patel: The open question is whether hosts will open a modal at all during a live meeting. The interaction cost during facilitation might be too high.\n\n00:02:20.500 --> 00:02:30.000\nJordan Lee: Decision: clicking a decision or agent issue opens a facilitation modal with suggested conversation prompts. We test whether hosts actually use it.\n\n00:02:30.500 --> 00:02:40.000\nMaya Patel: The risk is that opening a modal takes cognitive bandwidth away from running the room. That's the main failure mode for the modal guidance UX.\n\n00:02:40.500 --> 00:02:50.000\nJordan Lee: Issue five — dashboard access control and link sharing. The URL needs to be hard to guess even while the board is open-by-link.\n\n00:02:50.500 --> 00:03:00.000\nMaya Patel: Decision: use a cryptographically random slug. Open by link for the prototype, but unguessable. That unblocks us without requiring account login yet.\n\n00:03:00.500 --> 00:03:10.000\nJordan Lee: The assumption in issue five is that prototype users accept that tradeoff. Longer term we need Zoom or Google login before this is used in sensitive meetings.\n\n00:03:10.500 --> 00:03:20.000\nMaya Patel: The board should also be screen-shareable without the transcript visible. Sometimes the board is the artifact, not the live feed.\n\n00:03:20.500 --> 00:03:30.000\nJordan Lee: Decision: the transcript rail should be hideable during screen share. Keep evidence timestamps on each card so the board stays grounded when the feed is hidden.\n\n00:03:30.500 --> 00:03:40.000\nMaya Patel: Now issue three — defining the transcript retention and access policy. This needs to be settled before we go to production with live Zoom audio.\n\n00:03:40.500 --> 00:03:50.000\nJordan Lee: For the prototype, the assumption is that users uploading their own fixture transcripts are comfortable with retention. But live Zoom audio changes the obligation.\n\n00:03:50.500 --> 00:04:00.000\nMaya Patel: Decision: keep the full transcript with the meeting record for the prototype, but add a retention specification to the production-readiness list.\n\n00:04:00.500 --> 00:04:10.000\nJordan Lee: Action: update issue three to include a deletion endpoint and retention spec as explicit requirements before the production milestone.\n\n00:04:10.500 --> 00:04:20.000\nMaya Patel: The risk is that prototype users share transcripts and later want them removed before we have a deletion path. We should build that early.\n\n00:04:20.500 --> 00:04:30.000\nJordan Lee: The cost of building a deletion endpoint now is low compared to the cost of losing early users over a trust issue. Scope it into issue three.\n\n00:04:30.500 --> 00:04:40.000\nMaya Patel: Last item — risks and actions on the board should be removable, but we need to track what gets removed so the brief shows the full picture.\n\n00:04:40.500 --> 00:04:50.000\nJordan Lee: The failure mode is a host removing useful dissent or open questions before the team has a chance to consider them. The audit trail prevents silent erasure.\n\n00:04:50.500 --> 00:05:00.000\nMaya Patel: Action: track dismissed items in the meeting record so the brief can surface what agents flagged and what the host decided to exclude.\n\n00:05:00.500 --> 00:05:10.000\nJordan Lee: That rounds out today. Live board first, modal guidance, unguessable dashboard link, retention spec for issue three, and an audit trail for dismissed items.\n\n00:05:10.500 --> 00:05:20.000\nMaya Patel: Good. Jordan owns the live board prototype. I'll update the issues with today's decisions and share the brief with the team after this.\n";

const state = {
  cues: [],
  playedCueIds: new Set(),
  decisions: [],
  risks: [],
  actions: [],
  agents: [],
  audit: [],
  llmOutput: null,
  analysisConfig: { enabled: false, provider: 'fixture', model: '' },
  pendingAnalysisCueIds: new Set(),
  currentTime: 0,
  duration: 0,
  playing: false,
  lastTick: 0,
  speed: 1,
  filter: 'all',
  transcriptVisible: true,
  recordMode: 'on',
  recordModeUpdating: false,
  boardDirty: true,
  openModalItem: null,
  zoomSession: null,
  meetingContext: fakeZoomMeeting,
  runwayData: runwayStub,
  runwayVisible: true,
  runwayTimerActive: true,
  runwayDuration: configuredRunwayDuration(),
  runwayRemaining: configuredRunwayDuration(),
  runwayLastTick: 0,
  demoMode: false,
  demoTranscript: false,
  reviewMode: false,
  briefMarkdown: '',
  briefLoading: false,
  briefError: '',
  briefRequestKey: '',
  githubToken: localStorage.getItem('githubToken') || '',
  githubConfig: tryParseJson(localStorage.getItem('githubConfig')),
  githubRelatedIssues: {},
  githubItemLinks: {},
  githubProposals: [],
  githubTranscriptUpload: false,
  githubDiscussionPost: false,
  githubDiscussionCategories: null,
  githubDiscussionCategoryId: localStorage.getItem('githubDiscussionCategoryId') || '',
  githubPublishing: false,
  githubPublishResult: null,
  trackerProvider: localStorage.getItem('trackerProvider') ||
    (localStorage.getItem('githubToken') ? 'github' : null) ||
    (localStorage.getItem('atlassianToken') ? 'atlassian' : null),
  // trackerProvider: 'github' | 'atlassian' | null
  atlassianToken: localStorage.getItem('atlassianToken') || '',
  atlassianRefreshToken: localStorage.getItem('atlassianRefreshToken') || '',
  atlassianCloudId: localStorage.getItem('atlassianCloudId') || '',
  atlassianSite: localStorage.getItem('atlassianSite') || '',
  atlassianTokenExpired: false,
  jiraConfig: tryParseJson(localStorage.getItem('jiraConfig')),
  // jiraConfig shape: { projectKeys: ['ENG'], activeSprintOnly: false, confluenceSpaceKey: '' }
  jiraProjects: null,       // null = not loaded, [] = loaded empty, [...] = loaded
  confluenceSpaces: null,   // null = not loaded
  jiraRelatedIssues: {},
  jiraItemLinks: {},
  jiraProposals: [],
  jiraPublishing: false,
  jiraPublishResult: null
};

const els = {
  menuButton: document.querySelector('#menuButton'),
  controlsMenu: document.querySelector('#controlsMenu'),
  recordModeButton: document.querySelector('#recordModeButton'),
  playButton: document.querySelector('#playButton'),
  resetButton: document.querySelector('#resetButton'),
  transcriptHeaderToggle: document.querySelector('#transcriptHeaderToggle'),
  showFeedButton: document.querySelector('#showFeedButton'),
  workspace: document.querySelector('.workspace'),
  transcriptFile: document.querySelector('#transcriptFile'),
  speedSelect: document.querySelector('#speedSelect'),
  meetingStatus: document.querySelector('#meetingStatus'),
  streamError: document.querySelector('#streamError'),
  streamErrorTitle: document.querySelector('#streamErrorTitle'),
  streamErrorSummary: document.querySelector('#streamErrorSummary'),
  streamErrorDetails: document.querySelector('#streamErrorDetails'),
  retryStreamButton: document.querySelector('#retryStreamButton'),
  board: document.querySelector('.board'),
  meetingName: document.querySelector('#meetingName'),
  meetingAttendees: document.querySelector('#meetingAttendees'),
  meetingProgressLabel: document.querySelector('#meetingProgressLabel'),
  boardTitle: document.querySelector('#boardTitle'),
  stepper: document.querySelector('#meetingStepper'),
  stepRunway: document.querySelector('#stepRunway'),
  stepMeeting: document.querySelector('#stepMeeting'),
  stepRecap: document.querySelector('#stepRecap'),
  openDashboardButton: document.querySelector('#openDashboardButton'),
  copyDashboardButton: document.querySelector('#copyDashboardButton'),
  shareDashboardButton: document.querySelector('#shareDashboardButton'),
  runwayPanel: document.querySelector('#runwayPanel'),
  runwayLiveButton: document.querySelector('#runwayLiveButton'),
  runwayProgress: document.querySelector('#runwayProgress'),
  runwayTimer: document.querySelector('#runwayTimer'),
  runwayTitle: document.querySelector('#runwayTitle'),
  runwayPurpose: document.querySelector('#runwayPurpose'),
  runwayAgendaTitle: document.querySelector('#runwayAgendaTitle'),
  runwayAgendaList: document.querySelector('#runwayAgendaList'),
  runwayDecisionFrame: document.querySelector('#runwayDecisionFrame'),

  runwayNorm: document.querySelector('#runwayNorm'),
  runwayOpeningPrompt: document.querySelector('#runwayOpeningPrompt'),
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
  modalDismiss: document.querySelector('#modalDismiss'),
  modalPromoteRisk: document.querySelector('#modalPromoteRisk'),
  modalPromoteOpenQuestion: document.querySelector('#modalPromoteOpenQuestion'),
  briefPanel: document.querySelector('#briefPanel'),
  briefContent: document.querySelector('#briefContent'),
  copyBriefButton: document.querySelector('#copyBriefButton'),
  runwayTrackerContent: document.querySelector('#runwayTrackerContent'),
  githubBriefSection: document.querySelector('#githubBriefSection'),
  githubBriefStatus: document.querySelector('#githubBriefStatus'),
  githubBriefContent: document.querySelector('#githubBriefContent'),
  modalGithubSection: document.querySelector('#modalGithubSection'),
  modalGithubIssues: document.querySelector('#modalGithubIssues'),
  jiraBriefSection: document.querySelector('#jiraBriefSection'),
  jiraBriefStatus: document.querySelector('#jiraBriefStatus'),
  jiraBriefContent: document.querySelector('#jiraBriefContent'),
  modalJiraSection: document.querySelector('#modalJiraSection'),
  modalJiraIssues: document.querySelector('#modalJiraIssues')
};

function tryParseJson(value) {
  try { return value ? JSON.parse(value) : null; } catch (e) { return null; }
}

let rtmsPollTimer = null;
let rtmsStarted = false;
let rtmsClockTimer = null;
let rtmsClockBase = null; // { wallMs, sessionSeconds } snapshot when clock started
let runwayTimerFrame = null;

function configuredRunwayDuration() {
  const params = new URLSearchParams(window.location.search);
  const requested = Number(params.get('runwaySeconds'));
  if (Number.isFinite(requested) && requested > 0) {
    return Math.min(Math.max(Math.round(requested), 5), 180);
  }
  return DEFAULT_RUNWAY_SECONDS;
}

function configuredRunwayData() {
  const params = new URLSearchParams(window.location.search);
  const requestedCase = params.get('runwayCase') || 'default';
  return runwayCases[requestedCase] || runwayCases.default;
}

function applyMeetingContext(meeting) {
  state.meetingContext = meeting;
  els.boardTitle.textContent = meeting.topic;
  els.meetingName.textContent = meeting.meetingId ? 'Zoom meeting ' + meeting.meetingId : 'Meeting session';
  if (els.meetingAttendees) els.meetingAttendees.textContent = meeting.attendees.join(', ');
  els.meetingStatus.textContent = meeting.topic + ' · host ' + meeting.host;
  renderMeetingProgress();
}

function currentDashboardUrl() {
  const meeting = state.meetingContext || fakeZoomMeeting;
  return absoluteDashboardPath(meeting.dashboardSlug || fakeZoomMeeting.dashboardSlug);
}

function absoluteDashboardPath(path) {
  if (!path) return fakeZoomMeeting.dashboardSlug;
  if (path.startsWith('http')) return path;
  return window.location.origin + path;
}

function currentDashboardSessionId() {
  const match = window.location.pathname.match(/^\/m\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function currentDashboardToken() {
  return new URLSearchParams(window.location.search).get('t') || '';
}

function isSharedDashboardView() {
  return Boolean(currentDashboardSessionId());
}

function isEndedMeetingStatus(status) {
  return /ended|stopped/i.test(String(status || ''));
}

function applySharedDashboardPhase(session) {
  if (!isSharedDashboardView()) return;

  if (session && isEndedMeetingStatus(session.status)) {
    if (state.runwayVisible) hideRunway();
    if (!state.reviewMode) setReviewMode(true);
    return;
  }

  if (state.cues.length > 0 || (session && session.transcript && session.transcript.length > 0)) {
    if (state.reviewMode) setReviewMode(false);
    if (state.runwayVisible) hideRunway();
    return;
  }

  if (state.reviewMode) setReviewMode(false);
  if (!state.runwayVisible) showRunway();
}

async function loadDashboardSession() {
  const sessionId = currentDashboardSessionId();
  if (!sessionId || sessionId === 'demo-session') return null;

  try {
    const token = currentDashboardToken();
    const tokenParam = token ? '?t=' + encodeURIComponent(token) : '';
    const response = await fetch('/api/sessions/' + encodeURIComponent(sessionId) + tokenParam, { cache: 'no-store' });
    if (response.status === 404) {
      els.meetingStatus.textContent = 'Session not found · demo mode';
      return null;
    }
    if (response.status === 403) {
      els.meetingStatus.textContent = 'Dashboard link needs a valid access token';
      return null;
    }
    if (!response.ok) throw new Error('session fetch failed');
    const session = await response.json();
    const meeting = {
      topic: session.topic || fakeZoomMeeting.topic,
      meetingId: session.zoomMeetingId || '',
      host: session.host || 'Meeting host',
      attendees: Array.isArray(session.attendees) ? session.attendees : [],
      meetingUuid: session.zoomMeetingUuid || '',
      dashboardSlug: session.dashboardUrl || absoluteDashboardPath(session.dashboardPath)
    };
    state.zoomSession = session;
    state.recordMode = normalizeRecordMode(session.recordMode);
    renderRecordMode();
    applyMeetingContext(meeting);
    els.meetingStatus.textContent = meeting.topic + ' · shared dashboard';
    return session;
  } catch (error) {
    els.meetingStatus.textContent = fakeZoomMeeting.topic + ' · dashboard session unavailable';
    console.info('Meeting Decision Maker session load error', error);
    return null;
  }
}

function normalizeZoomMeetingContext(context) {
  const meetingId = context.meetingID || context.meetingId || context.meetingNumber || context.meetingUUID || '';
  const topic = context.meetingTopic || context.topic || context.meetingName || fakeZoomMeeting.topic;
  const agenda = context.agenda || context.meetingAgenda || context.description || '';
  const durationMinutes = parseInt(context.duration || context.durationMinutes || context.meeting_duration || '', 10) || null;
  return {
    topic: topic,
    meetingId: String(meetingId || '').trim(),
    host: context.hostName || context.userName || 'Zoom host',
    attendees: context.userName ? [context.userName] : [],
    dashboardSlug: fakeZoomMeeting.dashboardSlug,
    agenda: agenda,
    durationMinutes: durationMinutes
  };
}

function zoomErrorMessage(error) {
  if (!error) return 'unknown';
  return error.reason || error.message || error.errorMessage || error.errorCode || String(error);
}

function showStreamError(title, summary, details) {
  if (!els.streamError) return;
  els.streamErrorTitle.textContent = title || 'Unable to receive the live meeting stream.';
  els.streamErrorSummary.textContent = summary || 'Room Clarity can still show the meeting shell, but live transcript and decision updates are unavailable.';
  els.streamErrorDetails.textContent = details || 'No additional details were provided.';
  els.streamError.hidden = false;
  document.querySelector('.app-shell').classList.add('stream-error-visible');
  console.info('Meeting Decision Maker stream error', {
    title: els.streamErrorTitle.textContent,
    summary: els.streamErrorSummary.textContent,
    details: els.streamErrorDetails.textContent
  });
}

function clearStreamError() {
  if (els.streamError) els.streamError.hidden = true;
  document.querySelector('.app-shell').classList.remove('stream-error-visible');
}

function setOpenDashboardVisible(visible) {
  if (els.openDashboardButton) els.openDashboardButton.hidden = !visible;
}

function isBrowserUnsupportedZoomError(error) {
  return zoomErrorMessage(error).toLowerCase().includes('zoom apps sdk is not supported by this browser');
}

async function openDashboard() {
  const url = currentDashboardUrl();
  if (window.zoomSdk && typeof window.zoomSdk.openUrl === 'function') {
    try {
      await window.zoomSdk.openUrl({ url: url });
      return;
    } catch (error) {
      console.info('Meeting Decision Maker openUrl fallback', error);
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function shareDashboard() {
  if (window.zoomSdk && typeof window.zoomSdk.shareApp === 'function') {
    try {
      await window.zoomSdk.shareApp({ action: 'start' });
      return;
    } catch (error) {
      console.info('Meeting Decision Maker shareApp fallback', error);
    }
  }
  await copyDashboardUrl();
}

async function copyDashboardUrl() {
  const url = currentDashboardUrl();
  try {
    await navigator.clipboard.writeText(url);
    els.copyDashboardButton.textContent = 'Copied';
    setTimeout(function() {
      els.copyDashboardButton.textContent = 'Copy';
    }, 1400);
  } catch (error) {
    els.meetingStatus.textContent = (state.meetingContext || fakeZoomMeeting).topic + ' · dashboard URL: ' + url;
  }
}

function rtmsStatusText(response) {
  if (!response) return '';
  const raw = response.status || response.state || response.rtmsStatus || response.message || response.result;
  if (raw === null || raw === undefined || raw === '') return '';
  if (typeof raw !== 'string') {
    // Zoom SDK may return { status: [{displayName, status, timestamp}, ...] }
    if (Array.isArray(raw)) {
      const first = raw[0];
      return first ? String(first.status || first.state || first.message || 'connecting') : '';
    }
    // Zoom SDK may return { status: { rtmsStatus: "inactive", ... } }
    if (typeof raw === 'object') {
      const inner = raw.rtmsStatus || raw.status || raw.state || raw.message;
      return inner ? String(inner) : JSON.stringify(raw).slice(0, 80);
    }
    return String(raw);
  }
  return raw;
}

function setRtmsButton(status) {
  if (status) console.info('Meeting Decision Maker stream status', status);
}

async function refreshRtmsStatus() {
  if (!window.zoomSdk || typeof window.zoomSdk.getRTMSStatus !== 'function') {
    setRtmsButton('API unavailable');
    return '';
  }
  try {
    const response = await window.zoomSdk.getRTMSStatus();
    const status = rtmsStatusText(response);
    setRtmsButton(status);
    return status;
  } catch (error) {
    showStreamError(
      'Unable to check the live stream.',
      'Room Clarity could not verify whether the meeting stream is available.',
      zoomErrorMessage(error)
    );
    return '';
  }
}

async function maybeAutoStartRtms(options) {
  const force = Boolean(options && options.force);
  if (!window.zoomSdk || typeof window.zoomSdk.startRTMS !== 'function') {
    setRtmsButton('startRTMS unavailable');
    showStreamError(
      'Live stream is not available in this meeting.',
      'The Zoom client did not expose a live transcript stream API to Room Clarity.',
      'startRTMS is unavailable from the Zoom Apps SDK in this running context.'
    );
    return;
  }
  if (rtmsStarted && !force) return;
  if (force) rtmsStarted = false;

  try {
    if (els.retryStreamButton) els.retryStreamButton.disabled = true;
    clearStreamError();
    setRtmsButton(force ? 'restarting' : 'starting');
    const response = await window.zoomSdk.startRTMS();
    rtmsStarted = true;
    const status = rtmsStatusText(response) || 'start requested';
    setRtmsButton(status);
  } catch (error) {
    const message = zoomErrorMessage(error);
    console.warn('RTMS auto-start:', message);
    showStreamError(
      'Unable to start the live meeting stream.',
      'Room Clarity opened, but Zoom did not start sending live transcript data. You can retry without resetting this board.',
      message
    );
    rtmsStarted = false;
    setRtmsButton('start failed');
  } finally {
    const status = await refreshRtmsStatus();
    if (/active|started|running|listening/i.test(status)) {
      rtmsStarted = true;
      clearStreamError();
    }
    if (els.retryStreamButton) els.retryStreamButton.disabled = false;
  }
}

async function retryLiveMeetingStream() {
  await maybeAutoStartRtms({ force: true });
  startRtmsPolling();
}

async function safeZoomCall(name, fallback) {
  if (!window.zoomSdk || typeof window.zoomSdk[name] !== 'function') {
    return { ok: false, value: fallback, error: name + ' unavailable' };
  }
  try {
    return { ok: true, value: await window.zoomSdk[name]() };
  } catch (error) {
    return { ok: false, value: fallback, error: zoomErrorMessage(error) };
  }
}

async function loadRunwayFromAgenda(meeting) {
  const agenda = meeting.agenda || '';
  if (!agenda.trim()) return;
  try {
    const response = await fetch('/api/analyze-runway', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        topic: meeting.topic,
        agenda: agenda,
        host: meeting.host,
        participants: meeting.attendees || []
      })
    });
    if (!response.ok) return;
    const data = await response.json();
    if (data.runway && data.runway.agendaItems && data.runway.agendaItems.length) {
      state.runwayData = data.runway;
      seedAgendaDecisionCandidates(state.runwayData);
      renderAll();
    }
  } catch (error) {
    console.info('Meeting Decision Maker runway analysis unavailable', error && error.message);
  }
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
      zoomMeetingId: meeting.meetingId,
      meetingUuid: meeting.meetingUuid || ''
    })
  });
  if (!response.ok) throw new Error('session request failed');
  return response.json();
}

async function maybeInitializeZoomApp() {
  if (!window.zoomSdk) {
    if (!currentDashboardSessionId()) {
      els.meetingStatus.textContent = fakeZoomMeeting.topic + ' · browser demo mode';
    }
    return;
  }

  try {
    const configResponse = await window.zoomSdk.config({
      version: '0.16.0',
      capabilities: [
        'getMeetingContext',
        'getMeetingUUID',
        'getMeetingParticipants',
        'getUserContext',
        'getRunningContext',
        'getSupportedJsApis',
        'openUrl',
        'shareApp',
        'startRTMS',
        'stopRTMS',
        'pauseRTMS',
        'resumeRTMS',
        'getRTMSStatus',
        'onRTMSStatusChange'
      ]
    });
    if (Array.isArray(configResponse.unsupportedApis) && configResponse.unsupportedApis.length) {
      console.info('Meeting Decision Maker unsupported Zoom APIs', configResponse.unsupportedApis);
    }
  } catch (error) {
    if (isBrowserUnsupportedZoomError(error)) {
      els.meetingStatus.textContent = (state.meetingContext || fakeZoomMeeting).topic + ' · browser dashboard';
      return;
    }
    els.meetingStatus.textContent = fakeZoomMeeting.topic + ' · Zoom SDK unavailable';
    showStreamError(
      'Unable to initialize the Zoom app.',
      'Room Clarity could not connect to the Zoom app environment for this meeting.',
      zoomErrorMessage(error)
    );
    return;
  }

  document.body.classList.add('zoom-app-surface');
  setOpenDashboardVisible(true);
  setTranscriptVisible(false);
  setRtmsButton('checking APIs');

  if (currentDashboardSessionId()) return;

  try {
    const contextResult = await safeZoomCall('getMeetingContext', {});
    const uuidResult = await safeZoomCall('getMeetingUUID', {});
    const runningContextResult = await safeZoomCall('getRunningContext', {});
    const userContextResult = await safeZoomCall('getUserContext', {});
    const supportedApisResult = await safeZoomCall('getSupportedJsApis', {});
    const supportedApis = Array.isArray(supportedApisResult.value && supportedApisResult.value.apis)
      ? supportedApisResult.value.apis
      : [];
    const rtmsApis = ['startRTMS', 'stopRTMS', 'getRTMSStatus', 'onRTMSStatusChange'].filter(function(name) {
      return typeof window.zoomSdk[name] === 'function' || supportedApis.includes(name);
    });
    if (!rtmsApis.length) {
      showStreamError(
        'Live stream controls are unavailable.',
        'The Zoom app loaded, but this meeting context does not expose live stream controls.',
        'Supported API count: ' + supportedApis.length
      );
    }
    if (typeof window.zoomSdk.onRTMSStatusChange === 'function') {
      try {
        await window.zoomSdk.onRTMSStatusChange(function(event) {
          const status = rtmsStatusText(event);
          setRtmsButton(status);
        });
      } catch (error) {
        showStreamError(
          'Unable to monitor live stream status.',
          'Room Clarity can continue trying to receive transcript updates, but stream status changes may not be visible.',
          zoomErrorMessage(error)
        );
      }
    }
    await refreshRtmsStatus();
    await maybeAutoStartRtms();
    const meeting = normalizeZoomMeetingContext(contextResult.value || {});
    const meetingUuid = uuidResult.value && (uuidResult.value.meetingUUID || uuidResult.value.uuid || '');
    if (meetingUuid) meeting.meetingUuid = meetingUuid;
    if (!meeting.meetingId && uuidResult.value) {
      meeting.meetingId = meetingUuid || uuidResult.value.meetingId || uuidResult.value.meetingID || '';
    }
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
    state.recordMode = normalizeRecordMode(session.recordMode);
    renderRecordMode();
    meeting.dashboardSlug = session.dashboardUrl || absoluteDashboardPath(session.dashboardPath);
    state.zoomSession = session;
    applyMeetingContext(meeting);
    loadRunwayFromAgenda(meeting);
    if (contextResult.ok) {
      els.meetingStatus.textContent = meeting.topic + ' · ready';
    } else {
      const runningContext = runningContextResult.value && (runningContextResult.value.runningContext || runningContextResult.value.context);
      const supportedCount = Array.isArray(supportedApisResult.value && supportedApisResult.value.apis)
        ? supportedApisResult.value.apis.length
        : 0;
      const userRole = userContextResult.value && (userContextResult.value.role || userContextResult.value.userRole);
      const note = runningContext ? ' · ' + runningContext : '';
      els.meetingStatus.textContent = meeting.topic + note + ' · ready';
      console.info('Meeting Decision Maker Zoom diagnostics', [
        'meeting context: ' + contextResult.error,
        uuidResult.ok && meeting.meetingId ? 'uuid: yes' : 'uuid: ' + (uuidResult.error || 'none'),
        userRole ? 'role: ' + userRole : '',
        supportedCount ? 'supported APIs: ' + supportedCount : ''
      ].filter(Boolean).join(' · '));
      console.info('Meeting Decision Maker Zoom diagnostics', {
        getMeetingContext: contextResult.error,
        getMeetingUUID: uuidResult.ok ? uuidResult.value : uuidResult.error,
        getUserContext: userContextResult.ok ? userContextResult.value : userContextResult.error,
        getRunningContext: runningContextResult.ok ? runningContextResult.value : runningContextResult.error,
        supportedApiCount: supportedCount,
        getSupportedJsApis: supportedApisResult.ok ? supportedApisResult.value : supportedApisResult.error
      });
    }
  } catch (error) {
    els.meetingStatus.textContent = fakeZoomMeeting.topic + ' · Zoom session unavailable';
    showStreamError(
      'Unable to prepare the meeting stream.',
      'Room Clarity could not create or connect to a live meeting session.',
      zoomErrorMessage(error)
    );
    console.info('Meeting Decision Maker Zoom session error', error);
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
  state.demoTranscript = sourceName === 'product-decision-demo.vtt';
  const isVtt = sourceName.toLowerCase().endsWith('.vtt') || raw.trimStart().startsWith('WEBVTT');
  state.cues = isVtt ? parseVtt(raw) : parseTxt(raw);
  state.duration = Math.max.apply(null, state.cues.map(function(cue) { return cue.end; }).concat([1]));
  if (!state.demoTranscript) {
    const meetingName = sourceName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    const speakerSet = {};
    state.cues.forEach(function(cue) { if (cue.speaker) speakerSet[cue.speaker] = true; });
    const speakers = Object.keys(speakerSet);
    const owner = speakers.length > 0 ? speakers[0] : '';
    state.runwayData = {
      title: meetingName,
      purpose: '',
      agendaTitle: 'Agenda',
      agendaItems: [],
      decisionFrame: { mode: 'Decide', owner: owner, successCondition: '' },
      participationNorm: '',
      openingPrompt: ''
    };
  }
  resetState(false);
  renderTranscript();
  renderAll();
}

function normalizeRecordMode(value) {
  return value === 'off' ? 'off' : 'on';
}

function applyRtmsSessionState(session) {
  if (!session || !Array.isArray(session.transcript)) return;
  state.recordMode = normalizeRecordMode(session.recordMode);
  renderRecordMode();
  const previousDuration = state.duration || 0;
  const previousCueCount = state.cues.length;
  const nextCues = [];
  session.transcript.forEach(function(cue, index) {
    const previousCue = nextCues[nextCues.length - 1];
    const fallbackStart = previousCue ? previousCue.end : index * 3;
    let start = normalizedCueSeconds(cue.start, fallbackStart);
    if (previousCue && start <= previousCue.start) {
      start = fallbackStart;
    }
    let end = normalizedCueSeconds(cue.end, start + 3);
    if (end <= start) end = start + 3;
    nextCues.push({
      id: cue.id || 'rtms-' + index,
      start,
      end,
      speaker: cue.speaker || 'Zoom participant',
      text: cue.text || ''
    });
  });
  state.cues = nextCues;
  state.duration = Math.max.apply(null, state.cues.map(function(cue) { return cue.end; }).concat([1]));
  state.decisions = (session.decisions || []).map(function(item) {
    return {
      id: item.id,
      key: 'decision:' + item.title,
      status: item.status || 'forming',
      suggestedStatus: item.status || 'forming',
      confirmedByHost: item.confirmedByHost === true,
      title: item.title,
      detail: item.summary,
      evidence: item.evidence,
      transcriptReference: buildTranscriptReference(item.evidence, item.summary),
      conversation: decisionConversation(item.status || 'forming'),
      steps: ['Confirm the commitment.', 'Ask for objections or missing evidence.', 'Accept or reject the decision.']
    };
  });
  state.risks = (session.risks || []).map(function(item) {
    return {
      id: item.id,
      title: item.title,
      detail: item.summary,
      evidence: item.evidence,
      transcriptReference: buildTranscriptReference(item.evidence, item.summary),
      conversation: 'Ask whether this risk needs mitigation, monitoring, or dismissal.',
      steps: ['Choose mitigate, monitor, or dismiss.', 'Assign an owner if needed.', 'Define a warning sign.']
    };
  });
  state.actions = (session.actions || []).map(function(item) {
    return {
      id: item.id,
      title: item.title,
      detail: item.summary,
      evidence: item.evidence,
      transcriptReference: buildTranscriptReference(item.evidence, item.summary),
      conversation: 'Confirm the owner, output, and review point for this action.',
      steps: ['Assign an owner.', 'Set a review checkpoint.', 'Connect the action to a decision or risk.']
    };
  });
  state.agents = (session.openAgentIssues || []).map(function(item) {
    return {
      id: item.id,
      key: item.agent + ':' + item.summary,
      status: item.status || 'open',
      agent: item.agent,
      priority: item.priority || 'medium',
      intervention: item.summary,
      evidence: item.evidence,
      discussionSuggested: false,
      discussedByTranscript: false,
      followUp: '',
      topics: agentTopics(item.agent),
      transcriptReference: buildTranscriptReference(item.evidence, item.summary),
      conversation: agentConversation(item.agent),
      steps: agentSteps(item.agent)
    };
  });
  state.currentTime = Math.max(state.currentTime || 0, state.duration);
  state.boardDirty = true;
  applySharedDashboardPhase(session);
  renderTranscript();
  renderAll();
  clearStreamError();
  if (!state.cues.length && /stopped|interrupted|start_failed|concurrency/i.test(String(session.status || ''))) {
    showStreamError(
      'Live transcript stream stopped.',
      'Zoom opened the stream, but no transcript text reached Room Clarity before it stopped.',
      [
        session.status ? 'Stream status: ' + session.status + '.' : '',
        session.statusReason ? 'Reason: ' + session.statusReason + '.' : '',
        'Try Retry stream after Zoom live captions/transcription are enabled and someone speaks in the meeting.'
      ].filter(Boolean).join(' ')
    );
  }
  els.meetingStatus.textContent = (state.meetingContext || fakeZoomMeeting).topic + (state.recordMode === 'off'
    ? ' · off the record'
    : ' · live transcript ' + state.cues.length + ' cues');

  // Start a wall-clock tick so the timer keeps running between polls
  const hasNewTranscript = state.cues.length > previousCueCount || state.duration > previousDuration;
  if (state.cues.length && !rtmsClockTimer) {
    rtmsClockBase = { wallMs: Date.now(), sessionSeconds: state.duration };
    rtmsClockTimer = setInterval(function() {
      const elapsed = (Date.now() - rtmsClockBase.wallMs) / 1000;
      state.currentTime = rtmsClockBase.sessionSeconds + elapsed;
      els.clock.textContent = formatTime(state.currentTime);
      els.progressBar.style.width = Math.min((state.currentTime / state.duration) * 100, 100) + '%';
    }, 1000);
  } else if (rtmsClockBase && hasNewTranscript) {
    rtmsClockBase = { wallMs: Date.now(), sessionSeconds: Math.max(state.currentTime, state.duration) };
  }
}

async function loadRtmsSessionState(id) {
  if (!id) return false;
  try {
    const token = currentDashboardToken() || (state.zoomSession && state.zoomSession.dashboardToken) || '';
    const tokenParam = token ? '?t=' + encodeURIComponent(token) : '';
    const response = await fetch('/api/rtms/sessions/' + encodeURIComponent(id) + tokenParam, { cache: 'no-store' });
    if (response.status === 403) {
      showStreamError(
        'Unable to open the live meeting stream.',
        'This dashboard link is missing valid access to the live transcript stream.',
        'The stream endpoint returned 403 for stream id ' + id + '.'
      );
      return false;
    }
    if (!response.ok) return false;
    applyRtmsSessionState(await response.json());
    return true;
  } catch (error) {
    showStreamError(
      'Unable to load the live meeting stream.',
      'Room Clarity could not reach the stream endpoint for this dashboard.',
      zoomErrorMessage(error)
    );
    return false;
  }
}

function startRtmsPolling() {
  const meeting = state.meetingContext || {};
  const candidates = Array.from(new Set([
    meeting.meetingUuid,
    meeting.meetingId,
    state.zoomSession && state.zoomSession.zoomMeetingUuid,
    state.zoomSession && state.zoomSession.zoomMeetingId,
    currentDashboardSessionId()
  ].filter(Boolean)));
  if (!candidates.length || rtmsPollTimer) return;

  async function poll() {
    for (const id of candidates) {
      if (await loadRtmsSessionState(id)) return;
    }
  }

  poll();
  rtmsPollTimer = setInterval(poll, 4000);
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
  state.reviewMode = false;
  state.githubRelatedIssues = {};
  state.githubItemLinks = {};
  state.githubProposals = [];
  state.jiraRelatedIssues = {};
  state.jiraItemLinks = {};
  state.githubTranscriptUpload = false;
  state.githubDiscussionPost = false;
  state.githubDiscussionCategories = null;
  state.githubPublishing = false;
  state.githubPublishResult = null;
  document.body.classList.remove('review-mode-active');
  els.briefPanel.hidden = true;
  resetRunway();
  els.playButton.textContent = 'Start';
  els.meetingStatus.textContent = keepTranscript === false
    ? meeting.topic + ' · transcript loaded'
    : meeting.topic + ' · reset';
}

function resetRunway() {
  cancelRunwayTimer();
  state.runwayVisible = true;
  state.runwayTimerActive = true;
  state.runwayDuration = configuredRunwayDuration();
  state.runwayRemaining = state.runwayDuration;
  state.runwayLastTick = 0;
  startRunwayTimer();
}

function showRunway() {
  cancelRunwayTimer();
  state.runwayVisible = true;
  state.runwayTimerActive = false;
  state.runwayRemaining = 0;
  renderRunway();
  renderStepper();
}

function hideRunway() {
  cancelRunwayTimer();
  state.runwayVisible = false;
  state.runwayTimerActive = false;
  state.runwayLastTick = 0;
  renderRunway();
  renderStepper();
}

function startRunwayTimer() {
  if (!state.runwayVisible || !state.runwayTimerActive) return;
  cancelRunwayTimer();
  state.runwayLastTick = 0;
  runwayTimerFrame = requestAnimationFrame(tickRunway);
}

function cancelRunwayTimer() {
  if (runwayTimerFrame) cancelAnimationFrame(runwayTimerFrame);
  runwayTimerFrame = null;
}

function tickRunway(now) {
  runwayTimerFrame = null;
  if (!state.runwayVisible || !state.runwayTimerActive) return;
  if (!state.runwayLastTick) state.runwayLastTick = now;
  const elapsed = (now - state.runwayLastTick) / 1000;
  state.runwayLastTick = now;
  state.runwayRemaining = Math.max(0, state.runwayRemaining - elapsed);
  renderRunwayTimer();
  if (state.runwayRemaining <= 0) {
    hideRunway();
    return;
  }
  runwayTimerFrame = requestAnimationFrame(tickRunway);
}

function renderRunway() {
  if (!els.runwayPanel) return;
  els.board.classList.toggle('runway-active', state.runwayVisible);
  els.runwayPanel.hidden = !state.runwayVisible;
  if (!state.runwayVisible) return;

  const data = state.runwayData;
  els.runwayTitle.textContent = data.title;
  els.runwayAgendaTitle.textContent = data.agendaTitle || 'Agenda';
  els.runwayPurpose.textContent = data.purpose;
  els.runwayAgendaList.innerHTML = data.agendaItems.map(function(item) {
    const source = item.url
      ? ' <a class="runway-doc-link" href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(item.docTitle || 'Source doc') + '</a>'
      : '';
    const time = item.timeBudget ? '<span class="agenda-time">' + item.timeBudget + ' min</span>' : '';
    const title = '<strong>' + escapeHtml(item.title) + '</strong>' + time;
    return '<li>' + title +
      '<span>' + escapeHtml(item.owner + ' · ' + item.desiredOutcome) + source + '</span></li>';
  }).join('');
  els.runwayDecisionFrame.innerHTML = [
    ['Mode', data.decisionFrame.mode],
    ['Owner', data.decisionFrame.owner],
    ['Success', data.decisionFrame.successCondition]
  ].map(runwayDefinitionRow).join('');
  els.runwayNorm.textContent = data.participationNorm;
  els.runwayOpeningPrompt.textContent = data.openingPrompt;
  renderRunwayTimer();
  renderRunwayTracker();
}

function runwayDefinitionRow(row) {
  return '<div><dt>' + escapeHtml(row[0]) + '</dt><dd>' + escapeHtml(row[1]) + '</dd></div>';
}

function renderRunwayTimer() {
  if (!els.runwayLiveButton) return;
  const active = state.runwayTimerActive && state.runwayRemaining > 0;
  const progress = active ? 1 - (state.runwayRemaining / state.runwayDuration) : 1;
  els.runwayTimer.textContent = active ? formatRunwayTime(state.runwayRemaining) : 'Close';
  els.runwayProgress.style.width = Math.min(Math.max(progress, 0), 1) * 100 + '%';
  els.runwayLiveButton.classList.toggle('counting', active);
}

function formatRunwayTime(seconds) {
  const total = Math.ceil(seconds);
  const min = String(Math.floor(total / 60)).padStart(2, '0');
  const sec = String(total % 60).padStart(2, '0');
  return min + ':' + sec;
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const min = String(Math.floor(total / 60)).padStart(2, '0');
  const sec = String(total % 60).padStart(2, '0');
  return min + ':' + sec;
}

function evidenceSpeaker(evidence) {
  if (!evidence) return '';
  const idx = evidence.indexOf(' · ');
  return idx >= 0 ? evidence.slice(idx + 3) : evidence;
}

function normalizedCueSeconds(value, fallback) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : fallback;
}

function renderTranscript() {
  if (!state.cues.length) {
    els.transcriptList.innerHTML = rtmsPollTimer
      ? '<p class="transcript-waiting">Waiting for live transcript…</p>'
      : '';
    return;
  }
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
  renderMeetingProgress();
  renderRunway();
  renderRunwayTracker();
  renderStepper();
  renderCueHighlight();
  if (state.boardDirty) {
    renderDecisions();
    renderStacks();
    renderAgents();
    renderAudit();
    if (state.reviewMode) renderBriefPanel();
    state.boardDirty = false;
  }
}

function renderMeetingProgress() {
  if (!els.stepper || !els.meetingProgressLabel) return;
  const meeting = state.meetingContext || fakeZoomMeeting;
  const durationMinutes = Number(meeting.durationMinutes) || agendaDurationMinutes(state.runwayData) || Math.ceil((state.duration || 0) / 60) || 30;
  const elapsedSeconds = Math.max(0, state.currentTime || 0);
  const elapsedMinutes = Math.min(durationMinutes, Math.floor(elapsedSeconds / 60));
  const remainingMinutes = Math.max(0, durationMinutes - elapsedMinutes);
  const agendaItem = currentAgendaItem();
  const progress = durationMinutes ? Math.min(Math.max(elapsedSeconds / (durationMinutes * 60), 0), 1) : 0;
  const agendaText = agendaItem ? agendaItem.title + agendaTimeRemainingLabel(agendaItem) : 'Agenda not timeboxed';
  els.stepper.style.setProperty('--meeting-progress', String(progress));
  els.meetingProgressLabel.textContent = elapsedMinutes + '/' + durationMinutes + ' min';
  els.stepMeeting.setAttribute('title', remainingMinutes + ' min left. ' + agendaText);
  els.stepMeeting.setAttribute('aria-label', 'Meeting phase, ' + elapsedMinutes + ' of ' + durationMinutes + ' minutes elapsed. ' + agendaText);
}

function agendaDurationMinutes(runwayData) {
  const items = runwayData && Array.isArray(runwayData.agendaItems) ? runwayData.agendaItems : [];
  const total = items.reduce(function(sum, item) {
    return sum + (Number(item.timeBudget) || 0);
  }, 0);
  return total || 0;
}

function currentAgendaItem() {
  const items = state.runwayData && Array.isArray(state.runwayData.agendaItems) ? state.runwayData.agendaItems : [];
  if (!items.length) return null;
  const elapsed = Math.floor((state.currentTime || 0) / 60);
  let cursor = 0;
  for (const item of items) {
    const budget = Number(item.timeBudget) || 0;
    if (!budget) continue;
    if (elapsed < cursor + budget) {
      return Object.assign({ elapsedInItem: Math.max(0, elapsed - cursor), timeBudget: budget }, item);
    }
    cursor += budget;
  }
  return items.find(function(item) { return Number(item.timeBudget) > 0; }) || items[0];
}

function agendaTimeRemainingLabel(item) {
  if (!item || !Number(item.timeBudget)) return '';
  const remaining = Math.max(0, Number(item.timeBudget) - Number(item.elapsedInItem || 0));
  return ' · ' + remaining + ' min left';
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
      '<h3>No decision captured yet</h3>' +
      '<p>The board will fill as the meeting transcript arrives.</p>' +
      '</article>';
    return;
  }
  els.decisionStrip.innerHTML = state.decisions.map(function(item) {
    const excluded = item.excludedFromBrief === true;
    const excludeBtn = state.reviewMode
      ? '<button class="exclude-item' + (excluded ? ' undo-exclude' : '') + '" type="button" aria-label="' + (excluded ? 'Re-include in brief' : 'Exclude from brief') + '" data-exclude-type="decision" data-exclude-id="' + item.id + '">' + (excluded ? '↩' : 'x') + '</button>'
      : '';
    return '<article class="decision-card interactive-card' + (excluded ? ' excluded-from-brief' : '') + '" data-open-type="decision" data-open-id="' + item.id + '">' +
      '<div class="decision-card-header">' +
      '<span class="status-pill ' + item.status + '">' + item.status + '</span>' +
      excludeBtn +
      '</div>' +
      '<h3>' + escapeHtml(item.title) + '</h3>' +
      '<p>' + escapeHtml(item.detail) + '</p>' +
      '<p class="agent-evidence">' + escapeHtml(evidenceSpeaker(item.evidence)) + '</p>' +
      '</article>';
  }).join('');
}

function seedAgendaDecisionCandidates(runwayData) {
  const candidates = agendaDecisionCandidates(runwayData);
  if (!candidates.length) return;
  let added = false;
  candidates.reverse().forEach(function(candidate) {
    const key = 'agenda-decision:' + candidate.title;
    if (state.decisions.some(function(item) { return item.key === key || item.title === candidate.title; })) return;
    state.decisions.unshift({
      id: makeId('decision'),
      key: key,
      status: 'potential',
      suggestedStatus: 'potential',
      confirmedByHost: false,
      source: 'agenda',
      agendaItemTitle: candidate.agendaItemTitle,
      title: candidate.title,
      detail: candidate.detail,
      evidence: 'Agenda seed',
      transcriptReference: 'Agenda item: ' + candidate.agendaItemTitle + '\nDesired outcome: ' + candidate.detail,
      conversation: 'This decision was inferred from the agenda. Ask whether this is actually something the room needs to decide today.',
      steps: ['Confirm whether this belongs on today\'s decision list.', 'Name the options or owner if it does.', 'Dismiss it if the agenda no longer needs this decision.']
    });
    added = true;
  });
  if (added) state.boardDirty = true;
}

function agendaDecisionCandidates(runwayData) {
  const items = runwayData && Array.isArray(runwayData.agendaItems) ? runwayData.agendaItems : [];
  return items.map(function(item) {
    const title = String(item.title || '').trim();
    const outcome = String(item.desiredOutcome || '').trim();
    const titleText = title.toLowerCase();
    const outcomeText = outcome.toLowerCase();
    const titleHasDecisionVerb = /\b(agree|assign|choose|commit|confirm|decide|decision|make the call|pick|resolve|select)\b/.test(titleText);
    const outcomeHasDecisionVerb = /\b(agree|assign|choose|commit|confirm|decide|decision|make the call|pick|resolve|select)\b/.test(outcomeText);
    if (!titleHasDecisionVerb && (!outcomeHasDecisionVerb || /\bbefore we choose\b/.test(outcomeText))) return null;
    return {
      title: agendaDecisionTitle(title, outcome),
      agendaItemTitle: title || 'Agenda item',
      detail: outcome || 'Agenda suggests this item may need a decision before the meeting ends.'
    };
  }).filter(Boolean).slice(0, 4);
}

function agendaDecisionTitle(title, outcome) {
  const text = (outcome || title || 'Potential decision').replace(/\.$/, '');
  if (/\b(agree|assign|choose|commit|confirm|decide|make the call|pick|resolve|select)\b/i.test(title)) return title;
  if (/\b(one direction chosen|choose a direction|chosen)\b/i.test(text)) return 'Choose first prototype direction';
  if (/\b(assign|owner|next step)\b/i.test(text)) return 'Confirm owner and next action';
  if (/\b(agree|confirm|clarify)\b/i.test(text)) return title || text;
  return text.length > 72 ? text.slice(0, 69).trim() + '...' : text;
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
    const excluded = agent.excludedFromBrief === true;
    const excludeBtn = state.reviewMode
      ? '<button class="exclude-item' + (excluded ? ' undo-exclude' : '') + '" type="button" aria-label="' + (excluded ? 'Re-include in brief' : 'Exclude from brief') + '" data-exclude-type="agent" data-exclude-id="' + agent.id + '">' + (excluded ? '↩' : 'x') + '</button>'
      : '';
    return '<article class="agent-card ' + agent.status + (excluded ? ' excluded-from-brief' : '') + '" data-open-type="agent" data-open-id="' + agent.id + '" data-agent-id="' + agent.id + '">' +
      '<div class="agent-card-header"><div class="agent-name">' + escapeHtml(agent.agent) + '</div>' +
      '<span class="priority-pill ' + agent.priority + '">' + agent.priority + '</span>' +
      excludeBtn +
      '</div>' +
      (agent.discussionSuggested ? '<div class="agent-auto-note">Possibly discussed</div>' : '') +
      '<p>' + escapeHtml(agent.intervention) + '</p>' +
      '<div class="agent-evidence">' + escapeHtml(evidenceSpeaker(agent.evidence)) + '</div>' +
      '<div class="agent-actions">' +
      '<button type="button" data-action="discussed" data-agent-id="' + agent.id + '">Discussed</button>' +
      '<button type="button" data-action="dismiss" data-agent-id="' + agent.id + '">Dismiss</button>' +
      '</div></article>';
  }).join('') || emptyStack('No agent suggestions');
}

function stackItem(item, type) {
  const excluded = item.excludedFromBrief === true;
  const actionBtn = state.reviewMode
    ? '<button class="exclude-item' + (excluded ? ' undo-exclude' : '') + '" type="button" aria-label="' + (excluded ? 'Re-include in brief' : 'Exclude from brief') + '" data-exclude-type="' + type + '" data-exclude-id="' + item.id + '">' + (excluded ? '↩' : 'x') + '</button>'
    : '<button class="remove-item" type="button" aria-label="Remove ' + type + '" data-remove-type="' + type + '" data-remove-id="' + item.id + '">x</button>';
  return '<article class="stack-item interactive' + (excluded ? ' excluded-from-brief' : '') + '" data-open-type="' + type + '" data-open-id="' + item.id + '">' +
    '<div class="stack-item-header">' +
    '<strong>' + escapeHtml(item.title) + '</strong>' +
    actionBtn +
    '</div>' +
    '<p>' + escapeHtml(item.detail) + '</p>' +
    '<p class="agent-evidence">' + escapeHtml(evidenceSpeaker(item.evidence)) + '</p>' +
    '</article>';
}

function emptyStack(text) {
  return '<div class="stack-item"><p>' + text + '</p></div>';
}

function currentStep() {
  if (state.reviewMode) return 'recap';
  return state.runwayVisible ? 'runway' : 'meeting';
}

function renderStepper() {
  if (!els.stepper) return;
  els.stepper.dataset.step = currentStep();
}

function goToStep(step) {
  if (step === 'runway') {
    if (state.reviewMode) setReviewMode(false);
    showRunway();
  } else if (step === 'meeting') {
    if (state.reviewMode) setReviewMode(false);
    hideRunway();
  } else if (step === 'recap') {
    if (state.runwayVisible) hideRunway();
    setReviewMode(true);
  }
}

function setReviewMode(active) {
  state.reviewMode = active;
  if (active && state.runwayVisible) {
    state.runwayVisible = false;
    cancelRunwayTimer();
  }
  document.body.classList.toggle('review-mode-active', active);
  els.briefPanel.hidden = !active;
  state.boardDirty = true;
  renderAll();
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
    if (!state.reviewMode) setReviewMode(true);
    return;
  }
  requestAnimationFrame(tick);
}

function processCues() {
  state.cues.forEach(function(cue) {
    if (state.currentTime >= cue.start && !state.playedCueIds.has(cue.id)) {
      state.playedCueIds.add(cue.id);
      if (state.recordMode === 'off') return;
      maybeAddFacilitator(cue, formatTime(cue.start) + ' · ' + cue.speaker);
      analyzeCue(cue);
    }
  });
}

function analyzeCue(cue) {
  const text = cue.text.toLowerCase();
  const evidence = formatTime(cue.start) + ' · ' + cue.speaker;

  if (state.analysisConfig.enabled) {
    requestCueAnalysis(cue, evidence);
    detectAgentDiscussion(cue, evidence);
    return;
  }

  if (applyLlmFixtureForCue(cue, evidence)) {
    detectAgentDiscussion(cue, evidence);
    return;
  }

  if (state.demoTranscript) {
    if (text.includes('product decision') || text.includes('decision is whether')) {
      addDecision('forming', 'MVP focus', 'Choose between implementation speed and testing the live facilitation experience.', evidence);
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
  }

  detectAgentDiscussion(cue, evidence);
  maybeAddAgent(cue, evidence);
}

function transcriptWindowForCue(cue) {
  const index = state.cues.findIndex(function(item) { return item.id === cue.id; });
  const end = index >= 0 ? index + 1 : state.cues.length;
  const windowStart = Math.max(0, cue.start - 90);
  return state.cues.slice(0, end).filter(function(item) {
    return item.start >= windowStart;
  }).slice(-12).map(function(item) {
    return {
      id: item.id,
      start: item.start,
      end: item.end,
      speaker: item.speaker,
      text: item.text
    };
  });
}

function meetingStateForAnalysis() {
  const meeting = state.meetingContext || fakeZoomMeeting;
  return {
    meeting: {
      topic: meeting.topic,
      durationMinutes: Number(meeting.durationMinutes) || agendaDurationMinutes(state.runwayData) || 30,
      elapsedMinutes: Math.floor((state.currentTime || 0) / 60),
      remainingMinutes: Math.max(0, (Number(meeting.durationMinutes) || agendaDurationMinutes(state.runwayData) || 30) - Math.floor((state.currentTime || 0) / 60))
    },
    currentAgendaItem: currentAgendaItem(),
    agendaItems: state.runwayData && Array.isArray(state.runwayData.agendaItems) ? state.runwayData.agendaItems : [],
    decisions: state.decisions.slice(0, 8).map(function(item) {
      return {
        id: item.id,
        title: item.title,
        status: item.status,
        suggestedStatus: item.suggestedStatus,
        summary: item.detail,
        evidence: item.evidence
      };
    }),
    risks: state.risks.slice(0, 8).map(function(item) {
      return {
        id: item.id,
        title: item.title,
        summary: item.detail,
        evidence: item.evidence
      };
    }),
    actions: state.actions.slice(0, 8).map(function(item) {
      return {
        id: item.id,
        title: item.title,
        summary: item.detail,
        evidence: item.evidence
      };
    }),
    openAgentIssues: state.agents.filter(function(item) { return item.status === 'open'; }).slice(0, 8).map(function(item) {
      return {
        id: item.id,
        agent: item.agent,
        priority: item.priority,
        summary: item.intervention,
        evidence: item.evidence,
        discussionSuggested: item.discussionSuggested
      };
    })
  };
}

async function requestCueAnalysis(cue, evidence) {
  if (state.pendingAnalysisCueIds.has(cue.id)) return;
  state.pendingAnalysisCueIds.add(cue.id);
  try {
    const response = await fetch('/api/analyze-cue', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        cue: {
          id: cue.id,
          start: cue.start,
          end: cue.end,
          speaker: cue.speaker,
          text: cue.text
        },
        transcriptWindow: transcriptWindowForCue(cue),
        meetingState: meetingStateForAnalysis()
      })
    });
    if (!response.ok) throw new Error('analysis unavailable');
    const result = await response.json();
    applyAnalysisItems(result.items || [], cue, evidence);
    renderAll();
  } catch (error) {
    if (!applyLlmFixtureForCue(cue, evidence)) {
      maybeAddAgent(cue, evidence);
    }
  } finally {
    state.pendingAnalysisCueIds.delete(cue.id);
  }
}

function applyAnalysisItems(items, cue, evidence) {
  items.forEach(function(item) {
    if (item.updateMode === 'update' && updateBoardItem(item, cue, evidence)) return;
    if (item.type === 'decision') addDecision(item.status || 'forming', item.title, item.summary, evidence, { transcriptText: cue.text });
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
}

function updateBoardItem(item, cue, evidence) {
  const existing = findAnalysisTarget(item);
  if (!existing) return false;
  state.boardDirty = true;

  if (item.title) existing.title = item.title;
  if (item.summary) {
    if (item.type === 'agent_issue') {
      existing.intervention = item.summary;
    } else {
      existing.detail = item.summary;
    }
  }
  if (item.status && item.type === 'decision') {
    const normalizedStatus = normalizeDecisionStatus(item.status);
    existing.status = normalizedStatus === 'rejected' ? existing.status : normalizedStatus;
    existing.suggestedStatus = normalizedStatus;
    existing.conversation = decisionConversation(normalizedStatus);
    existing.steps = decisionSteps(normalizedStatus);
  }
  if (item.priority && item.type === 'agent_issue') existing.priority = item.priority;

  existing.evidence = evidence;
  existing.transcriptReference = buildTranscriptReference(evidence, cue.text);
  return true;
}

function findAnalysisTarget(item) {
  if (item.targetId) {
    const direct = findBoardItem(item.type === 'agent_issue' ? 'agent' : item.type, item.targetId);
    if (direct) return direct;
  }

  const title = (item.title || '').toLowerCase();
  if (!title) return null;
  if (item.type === 'decision') return state.decisions.find(function(record) { return record.title.toLowerCase() === title; });
  if (item.type === 'risk') return state.risks.find(function(record) { return record.title.toLowerCase() === title; });
  if (item.type === 'action') return state.actions.find(function(record) { return record.title.toLowerCase() === title; });
  if (item.type === 'agent_issue') {
    return state.agents.find(function(record) {
      return record.agent === item.agent && record.intervention.toLowerCase() === (item.summary || '').toLowerCase();
    });
  }
  return null;
}

function applyLlmFixtureForCue(cue, evidence) {
  if (!state.llmOutput || !Array.isArray(state.llmOutput.events)) return false;
  const event = state.llmOutput.events.find(function(record) {
    return Math.abs(Number(record.at) - cue.start) < 0.01;
  });
  if (!event || !Array.isArray(event.items)) return false;
  event.items.forEach(function(item) {
    if (item.type === 'decision') addDecision(item.status || 'forming', item.title, item.summary, evidence, { transcriptText: cue.text });
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

async function loadAnalysisConfig() {
  try {
    const response = await fetch('/api/analysis/config', { cache: 'no-store' });
    if (!response.ok) throw new Error('analysis config unavailable');
    state.analysisConfig = await response.json();
    if (state.analysisConfig.enabled) {
      els.meetingStatus.textContent = (state.meetingContext || fakeZoomMeeting).topic + ' · ' + state.analysisConfig.model + ' analysis ready';
    }
  } catch (error) {
    state.analysisConfig = { enabled: false, provider: 'fixture', model: '' };
  }
}

async function loadLlmOutput() {
  if (state.analysisConfig.enabled) {
    state.llmOutput = null;
    return;
  }
  try {
    const response = await fetch('/fixtures/mock-llm-output.json', { cache: 'no-store' });
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

function maybeAddFacilitator(cue, evidence) {
  const text = cue.text.toLowerCase();
  const agendaItem = currentAgendaItem();
  const agendaLabel = agendaItem ? agendaItem.title : 'the agenda';
  const elapsedMinutes = Math.floor((state.currentTime || 0) / 60);
  const meeting = state.meetingContext || fakeZoomMeeting;
  const durationMinutes = Number(meeting.durationMinutes) || agendaDurationMinutes(state.runwayData) || 30;
  const remainingMinutes = Math.max(0, durationMinutes - elapsedMinutes);
  const unresolvedAgendaDecision = state.decisions.some(function(item) {
    return item.status === 'potential' || item.status === 'forming' || item.status === 'pending';
  });

  if (state.playedCueIds.size <= 1) {
    addFacilitatorAgent('start_activity', 'low', 'Start by naming what would make this meeting worth ending early, then use the agenda as the path to that outcome.', evidence, agendaLabel);
  }

  if (remainingMinutes <= Math.max(3, Math.ceil(durationMinutes * 0.2)) && unresolvedAgendaDecision) {
    addFacilitatorAgent('finish_activity', 'high', 'There is limited time left; confirm the decision wording, owner, and next action before opening a new thread.', evidence, agendaLabel);
  }

  if (agendaItem && Number(agendaItem.timeBudget) && Number(agendaItem.elapsedInItem) >= Number(agendaItem.timeBudget)) {
    addFacilitatorAgent('transition_warning', 'medium', 'This agenda item has used its timebox; choose whether to keep going, move on, or park the unresolved piece.', evidence, agendaLabel);
  }

  if (agendaItem && looksOffTopic(text, agendaItem)) {
    addFacilitatorAgent('off_topic_warning', 'medium', 'This thread looks outside the current agenda item; park it or connect it to the decision the room needs today.', evidence, agendaLabel);
  }
}

function addFacilitatorAgent(trigger, priority, intervention, evidence, agendaLabel) {
  const openDuplicate = state.agents.some(function(item) {
    return item.agent === 'Facilitator' && item.trigger === trigger && item.status === 'open';
  });
  if (openDuplicate) return;
  addAgent({
    agent: 'Facilitator',
    priority: priority,
    trigger: trigger,
    agendaItem: agendaLabel,
    intervention: intervention,
    evidence: evidence,
    createdCueId: trigger + ':' + evidence
  });
}

function looksOffTopic(text, agendaItem) {
  if (!text || !agendaItem) return false;
  if (/\b(next|issue|access control|retention|transcript rail|modal|dashboard link|audit trail)\b/.test(text)) {
    const agendaText = normalizeMatchText([agendaItem.title, agendaItem.desiredOutcome].join(' '));
    const cueText = normalizeMatchText(text);
    return textOverlapScore(cueText, agendaText) < 0.18;
  }
  return false;
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
  const suggestedStatus = normalizeDecisionStatus(status);
  const decisionStatus = suggestedStatus === 'accepted' ? 'accepted' : suggestedStatus;
  const key = 'decision:' + title;
  if (state.decisions.some(function(item) { return item.key === key; })) return;
  const agendaCandidate = findRelatedPotentialDecision(title, detail);
  if (agendaCandidate) {
    agendaCandidate.key = key;
    agendaCandidate.status = decisionStatus;
    agendaCandidate.suggestedStatus = suggestedStatus;
    agendaCandidate.source = 'transcript';
    agendaCandidate.title = title;
    agendaCandidate.detail = detail;
    agendaCandidate.evidence = evidence;
    agendaCandidate.transcriptReference = buildTranscriptReference(evidence, options && options.transcriptText ? options.transcriptText : detail);
    agendaCandidate.conversation = decisionConversation(suggestedStatus);
    agendaCandidate.steps = decisionSteps(suggestedStatus);
    state.boardDirty = true;
    return;
  }
  state.boardDirty = true;
  state.decisions.unshift({
    id: makeId('decision'),
    key: key,
    status: decisionStatus,
    suggestedStatus: suggestedStatus,
    confirmedByHost: false,
    title: title,
    detail: detail,
    evidence: evidence,
    transcriptReference: buildTranscriptReference(evidence, options && options.transcriptText ? options.transcriptText : detail),
    conversation: decisionConversation(suggestedStatus),
    steps: decisionSteps(suggestedStatus)
  });
}

function normalizeDecisionStatus(status) {
  if (['potential', 'forming', 'pending', 'accepted', 'rejected'].includes(status)) return status;
  return 'forming';
}

function decisionConversation(status) {
  if (status === 'potential') {
    return 'This decision was inferred from the agenda. Ask whether it is actually something the room needs to decide today.';
  }
  if (status === 'forming') {
    return 'Name the decision that appears to be forming and ask what options, tradeoffs, or missing evidence the group needs before it becomes a commitment.';
  }
  if (status === 'accepted') {
    return 'The transcript suggests this decision was accepted. Confirm the wording, owner, and any unresolved assumptions before relying on it later.';
  }
  return 'Name the pending decision out loud and ask whether the room accepts, rejects, or needs to revise it before it becomes part of the meeting record.';
}

function decisionSteps(status) {
  if (status === 'potential') {
    return ['Confirm whether this is a real decision for today.', 'Name the owner and options if it is.', 'Dismiss it if this is only background context.'];
  }
  if (status === 'forming') {
    return ['Clarify the decision question.', 'Name the options still in play.', 'Ask what evidence or objection would change the direction.'];
  }
  if (status === 'accepted') {
    return ['Confirm the exact commitment.', 'Capture owner or review point.', 'Log unresolved assumptions as risks if needed.'];
  }
  return ['Confirm the exact commitment.', 'Ask for blocking objections or missing evidence.', 'Accept or reject the decision from this modal.'];
}

function findRelatedPotentialDecision(title, detail) {
  const candidateText = normalizeMatchText(title + ' ' + detail);
  if (!candidateText) return null;
  return state.decisions.find(function(item) {
    if (item.status !== 'potential') return false;
    const itemText = normalizeMatchText(item.title + ' ' + item.detail + ' ' + (item.agendaItemTitle || ''));
    return potentialDecisionMatch(candidateText, itemText);
  });
}

function normalizeMatchText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function textOverlapScore(left, right) {
  const stop = new Set(['and', 'the', 'this', 'that', 'with', 'from', 'before', 'after', 'today', 'meeting']);
  const leftWords = new Set(left.split(' ').filter(function(word) { return word.length > 3 && !stop.has(word); }));
  const rightWords = new Set(right.split(' ').filter(function(word) { return word.length > 3 && !stop.has(word); }));
  if (!leftWords.size || !rightWords.size) return 0;
  let matches = 0;
  leftWords.forEach(function(word) { if (rightWords.has(word)) matches += 1; });
  return matches / Math.min(leftWords.size, rightWords.size);
}

function potentialDecisionMatch(candidateText, itemText) {
  if (textOverlapScore(candidateText, itemText) >= 0.34) return true;
  const prototypeChoice = /\bprototype\b/.test(candidateText) &&
    /\b(live|post|summary|recap|direction|focus|first)\b/.test(candidateText) &&
    /\bprototype\b/.test(itemText) &&
    /\b(choose|direction|first|focus)\b/.test(itemText);
  if (prototypeChoice) return true;
  const ownerActionChoice = /\b(owner|action|next step)\b/.test(candidateText) &&
    /\b(owner|action|next step)\b/.test(itemText);
  return ownerActionChoice;
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
  if (agentName === 'Facilitator') return ['agenda', 'time', 'park', 'owner', 'next action', 'decision', 'wrap', 'close'];
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
  if (agentName === 'Facilitator') return 'Use this as a host process prompt: protect the agenda, timebox, and closing output without shutting down useful discussion.';
  return 'Ask whether this point should be discussed now, captured for later, or dismissed.';
}

function agentSteps(agentName) {
  if (agentName === 'Assumptions Challenge') return ['Identify the assumption underneath the decision.', 'Ask what evidence supports it.', 'Decide whether to test, mitigate, or accept the uncertainty.'];
  if (agentName === 'Pre-Mortem') return ['Name the failure scenario.', 'Identify the cause that would make it happen.', 'Capture one mitigation and one warning sign.'];
  if (agentName === 'Argument Dissection') return ['Restate the argument in one sentence.', 'Ask what evidence is missing or ambiguous.', 'Consider one alternative explanation before deciding.'];
  if (agentName === 'Facilitator') return ['Choose whether to interrupt now or let the thread finish.', 'If useful, read the prompt in your own words.', 'Mark discussed once the room has decided to continue, transition, park, or close.'];
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
    els.modalAcceptDecision.disabled = item.confirmedByHost === true;
    els.modalRejectDecision.disabled = item.status === 'rejected';
  }
  renderModalGithubSection(type, id);
  renderModalJiraSection(type, id);
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
    decision.suggestedStatus = 'accepted';
    decision.confirmedByHost = true;
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

function toggleExcludeFromBrief(type, id) {
  const item = findBoardItem(type, id);
  if (!item) return;
  item.excludedFromBrief = !item.excludedFromBrief;
  state.briefRequestKey = '';
  state.boardDirty = true;
  renderAll();
}

// --- GITHUB DEMO FIXTURES ---

const demoGithubRepo = { owner: 'chrizbo', repo: 'agentics-beyond-code', folder: 'meetings', repoUrl: 'https://github.com/chrizbo/agentics-beyond-code' };

const demoGithubIssues = [
  { number: 1, title: 'Research live facilitation patterns for decision support', url: 'https://github.com/chrizbo/agentics-beyond-code/issues/1', state: 'open' },
  { number: 2, title: 'Prototype shared live board with transcript playback', url: 'https://github.com/chrizbo/agentics-beyond-code/issues/2', state: 'open' },
  { number: 3, title: 'Define transcript retention and access policy', url: 'https://github.com/chrizbo/agentics-beyond-code/issues/3', state: 'open' },
  { number: 4, title: 'Decision card modal and host guidance UX', url: 'https://github.com/chrizbo/agentics-beyond-code/issues/4', state: 'closed' },
  { number: 5, title: 'Dashboard access control and link sharing', url: 'https://github.com/chrizbo/agentics-beyond-code/issues/5', state: 'open' }
];

function demoGithubIssuesForItem(text) {
  const lower = String(text).toLowerCase();
  if (/live board|facilitation|playback/.test(lower)) return [demoGithubIssues[0], demoGithubIssues[1]];
  if (/transcript|retain|retention|storage/.test(lower)) return [demoGithubIssues[2]];
  if (/modal|guidance|click|open/.test(lower)) return [demoGithubIssues[3]];
  if (/dashboard|url|link|access|unguessable/.test(lower)) return [demoGithubIssues[4]];
  return demoGithubIssues.slice(0, 2);
}

// --- GITHUB ---

function parseGithubRepoUrl(url) {
  if (!url) return null;
  const match = String(url).match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

function detectRepoFromContext() {
  const meeting = state.meetingContext || fakeZoomMeeting;
  const text = [meeting.topic, meeting.agenda || ''].join(' ');
  const match = text.match(/https?:\/\/github\.com\/[^/\s]+\/[^/\s]+/);
  return match ? match[0] : null;
}

function saveGithubConfig(config) {
  state.githubConfig = config;
  if (config) {
    localStorage.setItem('githubConfig', JSON.stringify(config));
  } else {
    localStorage.removeItem('githubConfig');
  }
}

function githubRequest(method, path, body, params) {
  if (state.demoMode) return Promise.resolve({});
  return fetch('/api/github/proxy', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: state.githubToken, method, path, body, params })
  }).then(function(r) { return r.json(); });
}

function githubGraphql(query, variables) {
  if (state.demoMode) return Promise.resolve({});
  return fetch('/api/github/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: state.githubToken, query, variables })
  }).then(function(r) { return r.json(); });
}

function connectGitHub() {
  const popup = window.open('/api/github/oauth/start', 'github-oauth', 'width=620,height=700,scrollbars=yes,resizable=yes');
  if (!popup) {
    alert('Please allow popups for this site to connect GitHub.');
    return;
  }
  function handleMessage(event) {
    if (!event.data || typeof event.data !== 'object') return;
    if (event.data.type === 'github_token') {
      state.githubToken = event.data.token || '';
      localStorage.setItem('githubToken', state.githubToken);
      window.removeEventListener('message', handleMessage);
      renderAll();
    } else if (event.data.type === 'github_error') {
      window.removeEventListener('message', handleMessage);
    }
  }
  window.addEventListener('message', handleMessage);
}

function disconnectGitHub() {
  state.githubToken = '';
  state.githubRelatedIssues = {};
  state.githubItemLinks = {};
  state.githubDiscussionCategories = null;
  state.githubDiscussionCategoryId = '';
  localStorage.removeItem('githubToken');
  localStorage.removeItem('githubDiscussionCategoryId');
  renderAll();
}

function isGithubConnected() {
  return Boolean(state.githubToken);
}

function isGithubConfigured() {
  return isGithubConnected() && Boolean(state.githubConfig && state.githubConfig.owner && state.githubConfig.repo);
}

// ── Atlassian / Jira / Confluence ────────────────────────────────────────────

let _atlassianRefreshing = null; // single in-flight refresh promise

async function refreshAtlassianToken() {
  if (_atlassianRefreshing) return _atlassianRefreshing;
  if (!state.atlassianRefreshToken) throw new Error('No refresh token');
  _atlassianRefreshing = fetch('/api/atlassian/oauth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: state.atlassianRefreshToken })
  }).then(async function(r) {
    const data = await r.json().catch(function() { return {}; });
    if (!data.accessToken) throw new Error('Refresh failed');
    state.atlassianToken = data.accessToken;
    state.atlassianRefreshToken = data.refreshToken || state.atlassianRefreshToken;
    state.atlassianTokenExpired = false;
    localStorage.setItem('atlassianToken', state.atlassianToken);
    localStorage.setItem('atlassianRefreshToken', state.atlassianRefreshToken);
  }).finally(function() { _atlassianRefreshing = null; });
  return _atlassianRefreshing;
}

async function atlassianFetch(proxyPath, method, path, body, params) {
  const makeReq = function(token) {
    return fetch(proxyPath, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, cloudId: state.atlassianCloudId, method, path, body, params })
    });
  };
  let r = await makeReq(state.atlassianToken);
  if (r.status === 401) {
    if (state.atlassianRefreshToken) {
      // Try a silent token refresh. Only mark the session expired if the
      // refresh call itself fails. A 401 after a successful refresh is a
      // permissions issue (e.g. Confluence not on this site) — not expiry.
      try {
        await refreshAtlassianToken();
      } catch (e) {
        state.atlassianTokenExpired = true;
        renderAll();
        throw new Error('Atlassian session expired. Please reconnect.');
      }
      r = await makeReq(state.atlassianToken);
      if (r.status === 401) {
        throw new Error('Atlassian API permission denied (401 after token refresh).');
      }
    } else {
      // No refresh token — session is expired
      state.atlassianTokenExpired = true;
      renderAll();
      throw new Error('Atlassian session expired. Please reconnect.');
    }
  }
  return r.json().catch(function() { return {}; });
}

function jiraRequest(method, path, body, params) {
  return atlassianFetch('/api/atlassian/proxy', method, path, body, params);
}

function confluenceRequest(method, path, body, params) {
  return atlassianFetch('/api/confluence/proxy', method, path, body, params);
}

function connectAtlassian() {
  const popup = window.open('/api/atlassian/oauth/start', 'atlassian-oauth', 'width=620,height=700,scrollbars=yes,resizable=yes');
  if (!popup) {
    alert('Please allow popups for this site to connect Atlassian.');
    return;
  }

  function finish(token, cloudId, site, refreshToken) {
    state.atlassianToken = token || '';
    state.atlassianRefreshToken = refreshToken || localStorage.getItem('atlassianRefreshToken') || '';
    state.atlassianCloudId = cloudId || '';
    state.atlassianSite = site || '';
    state.atlassianTokenExpired = false;
    state.trackerProvider = 'atlassian';
    state.jiraProjects = null;     // force reload — clears any cached empty result
    state.confluenceSpaces = null; // force reload
    localStorage.setItem('atlassianToken', state.atlassianToken);
    localStorage.setItem('atlassianRefreshToken', state.atlassianRefreshToken);
    localStorage.setItem('atlassianCloudId', state.atlassianCloudId);
    localStorage.setItem('atlassianSite', state.atlassianSite);
    localStorage.setItem('trackerProvider', 'atlassian');
    window.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
    renderAll();
  }

  // Primary: postMessage from callback popup
  function handleMessage(event) {
    if (!event.data || typeof event.data !== 'object') return;
    if (event.data.type === 'atlassian_token') {
      finish(event.data.token, event.data.cloudId, event.data.site, event.data.refreshToken);
    } else if (event.data.type === 'atlassian_error') {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    }
  }

  // Fallback: storage event — fires when the callback page writes to localStorage
  // directly. Needed when window.opener is nulled after cross-origin navigation
  // through auth.atlassian.com.
  function handleStorage(event) {
    if (event.key === 'atlassianToken' && event.newValue) {
      finish(
        event.newValue,
        localStorage.getItem('atlassianCloudId') || '',
        localStorage.getItem('atlassianSite') || '',
        localStorage.getItem('atlassianRefreshToken') || ''
      );
    }
  }

  window.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);
}

function disconnectAtlassian() {
  state.atlassianToken = '';
  state.atlassianRefreshToken = '';
  state.atlassianCloudId = '';
  state.atlassianSite = '';
  state.atlassianTokenExpired = false;
  state.jiraConfig = null;
  state.jiraProjects = null;
  state.confluenceSpaces = null;
  state.jiraRelatedIssues = {};
  state.jiraItemLinks = {};
  localStorage.removeItem('atlassianToken');
  localStorage.removeItem('atlassianRefreshToken');
  localStorage.removeItem('atlassianCloudId');
  localStorage.removeItem('atlassianSite');
  localStorage.removeItem('jiraConfig');
  renderAll();
}

function isAtlassianConnected() {
  return Boolean(state.atlassianToken && state.atlassianCloudId);
}

function isJiraConfigured() {
  return isAtlassianConnected() && Boolean(
    state.jiraConfig &&
    Array.isArray(state.jiraConfig.projectKeys) &&
    state.jiraConfig.projectKeys.length > 0
  );
}

function saveJiraConfig(config) {
  state.jiraConfig = config;
  if (config) {
    localStorage.setItem('jiraConfig', JSON.stringify(config));
  } else {
    localStorage.removeItem('jiraConfig');
  }
}

async function loadJiraProjects() {
  if (!isAtlassianConnected()) return;
  if (state.jiraProjects !== null) return; // already loaded
  state.jiraProjects = [];  // mark as loading
  try {
    const result = await jiraRequest('GET', '/rest/api/3/project/search', null, { maxResults: '50', orderBy: 'name' });
    state.jiraProjects = Array.isArray(result.values)
      ? result.values.map(function(p) { return { key: p.key, name: p.name }; })
      : [];
  } catch (e) {
    state.jiraProjects = [];
  }
  renderAll();
}

async function loadConfluenceSpaces() {
  if (!isAtlassianConnected()) return;
  if (state.confluenceSpaces !== null) return; // already loaded
  state.confluenceSpaces = [];  // mark as loading
  try {
    const result = await confluenceRequest('GET', '/wiki/api/v2/spaces', null, { limit: '50' });
    state.confluenceSpaces = Array.isArray(result.results)
      ? result.results.map(function(s) { return { key: s.key, name: s.name }; })
      : [];
  } catch (e) {
    state.confluenceSpaces = [];
  }
  renderAll();
}

function selectTrackerProvider(provider) {
  // Switching to a different provider: disconnect the other one
  if (provider === 'github' && state.atlassianToken) disconnectAtlassian();
  if (provider === 'atlassian' && state.githubToken) disconnectGitHub();
  // Deselecting (null): keep credentials so re-selecting doesn't require re-auth
  state.trackerProvider = provider;
  if (provider) {
    localStorage.setItem('trackerProvider', provider);
  } else {
    localStorage.removeItem('trackerProvider');
  }
  renderAll();
}

function renderRunwayTracker() {
  if (!els.runwayTrackerContent) return;
  const provider = state.trackerProvider;

  let html = '';

  // Provider selector
  html += '<div class="tracker-provider-toggle">';
  html += '<button class="tracker-provider-btn' + (provider === 'github' ? ' active' : '') + '" type="button" id="trackerSelectGithub">GitHub</button>';
  html += '<button class="tracker-provider-btn' + (provider === 'atlassian' ? ' active' : '') + '" type="button" id="trackerSelectAtlassian">Jira &amp; Confluence</button>';
  html += '</div>';

  if (!provider) {
    html += '<p class="github-runway-hint">Connect a tracker to surface related issues during the meeting and push decisions after.</p>';
  } else if (provider === 'github') {
    const connected = isGithubConnected();
    const config = state.githubConfig;
    const detectedUrl = !config ? detectRepoFromContext() : null;
    if (!connected) {
      html += '<p class="github-runway-hint">Connect GitHub to surface related issues during the meeting and publish artifacts to a repo after.</p>';
      html += '<button class="github-connect-btn" type="button" id="githubConnectBtn">Connect GitHub</button>';
    } else {
      html += '<p class="github-connected-label">Connected</p>';
      html += '<div class="github-repo-form">';
      html += '<label for="githubRepoInput">Repository URL</label>';
      html += '<input id="githubRepoInput" type="url" placeholder="https://github.com/owner/repo" value="' + escapeHtml((config && config.repoUrl) || detectedUrl || '') + '" autocomplete="off">';
      html += '<label for="githubFolderInput">Transcript folder</label>';
      html += '<input id="githubFolderInput" type="text" placeholder="meetings/" value="' + escapeHtml((config && config.folder) || 'meetings') + '" autocomplete="off">';
      html += '<button class="github-save-btn" type="button" id="githubSaveConfigBtn">Save</button>';
      html += '</div>';
      if (config && config.owner) {
        html += '<p class="github-repo-bound">Bound to <strong>' + escapeHtml(config.owner + '/' + config.repo) + '</strong></p>';
      }
      html += '<button class="github-disconnect-btn" type="button" id="githubDisconnectBtn">Disconnect</button>';
    }
  } else if (provider === 'atlassian') {
    const connected = isAtlassianConnected();
    const config = state.jiraConfig;
    if (!connected) {
      html += '<p class="github-runway-hint">Connect Atlassian to surface related Jira issues during the meeting and publish decisions to Jira and Confluence after.</p>';
      html += '<button class="github-connect-btn" type="button" id="jiraConnectBtn">Connect Atlassian</button>';
    } else {
      const siteLabel = state.atlassianSite ? state.atlassianSite.replace(/^https?:\/\//, '') : 'Atlassian';

      if (state.atlassianTokenExpired) {
        html += '<p class="github-runway-hint github-runway-warning">Session expired — please reconnect to reload your projects.</p>';
        html += '<button class="github-connect-btn" type="button" id="jiraConnectBtn">Reconnect Atlassian</button>';
        html += '<button class="github-disconnect-btn" type="button" id="jiraDisconnectBtn">Disconnect</button>';
        els.runwayTrackerContent.innerHTML = html;
        const jiraConnectBtn2 = document.querySelector('#jiraConnectBtn');
        if (jiraConnectBtn2) jiraConnectBtn2.addEventListener('click', connectAtlassian);
        const jiraDisconnectBtn2 = document.querySelector('#jiraDisconnectBtn');
        if (jiraDisconnectBtn2) jiraDisconnectBtn2.addEventListener('click', disconnectAtlassian);
        return;
      }

      html += '<p class="github-connected-label">Connected to <strong>' + escapeHtml(siteLabel) + '</strong></p>';
      html += '<div class="github-repo-form">';

      // Jira project dropdown
      html += '<div class="tracker-label-row"><label for="jiraProjectSelect">Jira project</label><button class="tracker-refresh-btn" type="button" id="jiraRefreshProjects">↻ Refresh</button></div>';
      const projects = state.jiraProjects;
      if (projects === null) {
        html += '<p class="github-runway-hint">Loading projects…</p>';
        loadJiraProjects();
      } else if (projects.length === 0) {
        html += '<p class="github-runway-hint">No projects found. Try refreshing.</p>';
      } else {
        const savedKey = config && config.projectKeys && config.projectKeys[0] ? config.projectKeys[0] : '';
        html += '<select id="jiraProjectSelect" class="tracker-select">';
        html += '<option value="">Select a project</option>';
        projects.forEach(function(p) {
          html += '<option value="' + escapeHtml(p.key) + '"' + (p.key === savedKey ? ' selected' : '') + '>' + escapeHtml(p.key + ' — ' + p.name) + '</option>';
        });
        html += '</select>';
      }

      // Active sprint toggle
      html += '<label class="tracker-checkbox-label"><input type="checkbox" id="jiraActiveSprintOnly"' + (config && config.activeSprintOnly ? ' checked' : '') + '> Active sprint issues only</label>';

      // Confluence space dropdown
      html += '<div class="tracker-label-row"><label for="jiraConfluenceSpaceSelect">Confluence space <span class="tracker-optional">(optional)</span></label><button class="tracker-refresh-btn" type="button" id="jiraRefreshSpaces">↻ Refresh</button></div>';
      const spaces = state.confluenceSpaces;
      if (spaces === null) {
        html += '<p class="github-runway-hint">Loading spaces…</p>';
        loadConfluenceSpaces();
      } else if (spaces.length === 0) {
        html += '<p class="github-runway-hint">No Confluence spaces found. Try refreshing.</p>';
      } else {
        const savedSpace = (config && config.confluenceSpaceKey) || '';
        html += '<select id="jiraConfluenceSpaceSelect" class="tracker-select">';
        html += '<option value="">None</option>';
        spaces.forEach(function(s) {
          html += '<option value="' + escapeHtml(s.key) + '"' + (s.key === savedSpace ? ' selected' : '') + '>' + escapeHtml(s.key + ' — ' + s.name) + '</option>';
        });
        html += '</select>';
      }

      html += '</div>';
      html += '<button class="github-disconnect-btn" type="button" id="jiraDisconnectBtn">Disconnect</button>';
    }
  }

  els.runwayTrackerContent.innerHTML = html;

  // Provider toggle buttons
  const ghBtn = document.querySelector('#trackerSelectGithub');
  if (ghBtn) ghBtn.addEventListener('click', function() {
    if (provider === 'github') {
      // Tap active button → deselect (no tracker)
      selectTrackerProvider(null);
      return;
    }
    if (isAtlassianConnected()) {
      if (!confirm('Switch to GitHub? Your Atlassian connection will be disconnected.')) return;
    }
    selectTrackerProvider('github');
  });
  const atBtn = document.querySelector('#trackerSelectAtlassian');
  if (atBtn) atBtn.addEventListener('click', function() {
    if (provider === 'atlassian') {
      // Tap active button → deselect (no tracker)
      selectTrackerProvider(null);
      return;
    }
    if (isGithubConnected()) {
      if (!confirm('Switch to Jira & Confluence? Your GitHub connection will be disconnected.')) return;
    }
    selectTrackerProvider('atlassian');
  });

  // Atlassian refresh buttons
  const refreshProjectsBtn = document.querySelector('#jiraRefreshProjects');
  if (refreshProjectsBtn) refreshProjectsBtn.addEventListener('click', function() {
    state.jiraProjects = null;
    state.atlassianTokenExpired = false;
    renderAll();
  });
  const refreshSpacesBtn = document.querySelector('#jiraRefreshSpaces');
  if (refreshSpacesBtn) refreshSpacesBtn.addEventListener('click', function() {
    state.confluenceSpaces = null;
    renderAll();
  });

  // GitHub sub-handlers
  const githubConnectBtn = document.querySelector('#githubConnectBtn');
  if (githubConnectBtn) githubConnectBtn.addEventListener('click', connectGitHub);
  const githubDisconnectBtn = document.querySelector('#githubDisconnectBtn');
  if (githubDisconnectBtn) githubDisconnectBtn.addEventListener('click', disconnectGitHub);
  const githubSaveBtn = document.querySelector('#githubSaveConfigBtn');
  if (githubSaveBtn) {
    githubSaveBtn.addEventListener('click', function() {
      const repoInput = document.querySelector('#githubRepoInput');
      const folderInput = document.querySelector('#githubFolderInput');
      const parsed = parseGithubRepoUrl(repoInput ? repoInput.value : '');
      if (!parsed) {
        alert('Enter a valid GitHub repository URL like https://github.com/owner/repo');
        return;
      }
      saveGithubConfig({
        repoUrl: repoInput ? repoInput.value.trim() : '',
        owner: parsed.owner,
        repo: parsed.repo,
        folder: (folderInput ? folderInput.value.trim().replace(/\/$/, '') : '') || 'meetings'
      });
      renderAll();
    });
  }

  // Atlassian sub-handlers
  const jiraConnectBtn = document.querySelector('#jiraConnectBtn');
  if (jiraConnectBtn) jiraConnectBtn.addEventListener('click', connectAtlassian);
  const jiraDisconnectBtn = document.querySelector('#jiraDisconnectBtn');
  if (jiraDisconnectBtn) jiraDisconnectBtn.addEventListener('click', disconnectAtlassian);

  function saveJiraConfigFromForm() {
    const projectSelect = document.querySelector('#jiraProjectSelect');
    const sprintToggle = document.querySelector('#jiraActiveSprintOnly');
    const spaceSelect = document.querySelector('#jiraConfluenceSpaceSelect');
    const key = projectSelect ? projectSelect.value.trim() : '';
    if (!key) return; // no project selected yet — don't save
    // Find the project name from the loaded list
    const project = state.jiraProjects && state.jiraProjects.find(function(p) { return p.key === key; });
    saveJiraConfig({
      projectKeys: [key],
      projectName: project ? project.name : key,
      activeSprintOnly: sprintToggle ? sprintToggle.checked : false,
      confluenceSpaceKey: spaceSelect ? spaceSelect.value : ''
    });
    renderAll();
  }

  const projectSelect = document.querySelector('#jiraProjectSelect');
  if (projectSelect) projectSelect.addEventListener('change', saveJiraConfigFromForm);
  const sprintToggle = document.querySelector('#jiraActiveSprintOnly');
  if (sprintToggle) sprintToggle.addEventListener('change', saveJiraConfigFromForm);
  const spaceSelect = document.querySelector('#jiraConfluenceSpaceSelect');
  if (spaceSelect) spaceSelect.addEventListener('change', saveJiraConfigFromForm);
}

async function loadRelatedGithubIssues(itemId, text) {
  if (!isGithubConfigured()) return;
  if (state.githubRelatedIssues[itemId]) return;
  state.githubRelatedIssues[itemId] = { loading: true, issues: [] };
  if (state.demoMode) {
    await new Promise(function(r) { setTimeout(r, 700); });
    state.githubRelatedIssues[itemId] = { loading: false, issues: demoGithubIssuesForItem(text) };
    state.boardDirty = true;
    refreshOpenGithubModal(itemId);
    renderAll();
    return;
  }
  const { owner, repo } = state.githubConfig;
  const q = text.slice(0, 60) + ' repo:' + owner + '/' + repo;
  try {
    const result = await githubRequest('GET', '/search/issues', null, { q, per_page: '5' });
    state.githubRelatedIssues[itemId] = {
      loading: false,
      issues: (result.items || []).map(function(i) {
        return { number: i.number, title: i.title, url: i.html_url, state: i.state };
      })
    };
    state.boardDirty = true;
    refreshOpenGithubModal(itemId);
    renderAll();
  } catch (e) {
    state.githubRelatedIssues[itemId] = { loading: false, issues: [] };
    refreshOpenGithubModal(itemId);
  }
}

function refreshOpenGithubModal(itemId) {
  if (!state.openModalItem || state.openModalItem.id !== itemId) return;
  renderModalGithubSection(state.openModalItem.type, state.openModalItem.id);
}

function linkItemToGithubIssue(itemId, issueNumber) {
  state.githubItemLinks[itemId] = Number(issueNumber);
  state.boardDirty = true;
  renderAll();
}

function unlinkItemFromGithubIssue(itemId) {
  delete state.githubItemLinks[itemId];
  state.boardDirty = true;
  renderAll();
}

function renderModalGithubSection(type, id) {
  if (!els.modalGithubSection || !els.modalGithubIssues) return;
  const showGithub = state.trackerProvider === 'github' && isGithubConfigured() && (type === 'decision' || type === 'action' || type === 'risk');
  els.modalGithubSection.hidden = !showGithub;
  if (!showGithub) return;

  const related = state.githubRelatedIssues[id];
  const linkedNumber = state.githubItemLinks[id];

  if (!related) {
    const item = findBoardItem(type, id);
    if (item) loadRelatedGithubIssues(id, (item.title || '') + ' ' + (item.detail || item.summary || ''));
    els.modalGithubIssues.innerHTML = '<p class="github-issues-loading">Searching related issues…</p>';
    return;
  }

  if (related.loading) {
    els.modalGithubIssues.innerHTML = '<p class="github-issues-loading">Searching related issues…</p>';
    return;
  }

  let html = '';
  if (related.issues.length === 0) {
    html += '<p class="github-no-issues">No related issues found in ' + escapeHtml(state.githubConfig.owner + '/' + state.githubConfig.repo) + '.</p>';
  } else {
    html += '<ul class="github-issues-list">';
    related.issues.forEach(function(issue) {
      const isLinked = linkedNumber === issue.number;
      const checkId = 'gh-link-' + escapeHtml(id) + '-' + issue.number;
      html += '<li class="github-issue-item' + (isLinked ? ' linked' : '') + '">';
      html += '<label class="tracker-issue-label">';
      html += '<input type="checkbox" class="github-link-checkbox" data-item-id="' + escapeHtml(id) + '" data-issue-number="' + issue.number + '"' + (isLinked ? ' checked' : '') + ' id="' + checkId + '">';
      html += '<span class="github-issue-state ' + escapeHtml(issue.state) + '">' + escapeHtml(issue.state) + '</span>';
      html += '<a href="' + escapeHtml(issue.url) + '" target="_blank" rel="noopener noreferrer">#' + issue.number + ' ' + escapeHtml(issue.title) + '</a>';
      html += '</label>';
      html += '</li>';
    });
    html += '</ul>';
  }
  els.modalGithubIssues.innerHTML = html;
}

// ── Jira issue surfacing ─────────────────────────────────────────────────────

async function loadRelatedJiraIssues(itemId, text) {
  if (!isJiraConfigured()) return;
  if (state.jiraRelatedIssues[itemId]) return;
  state.jiraRelatedIssues[itemId] = { loading: true, issues: [] };
  const projectKey = state.jiraConfig.projectKeys[0];
  // Extract meaningful keywords from the item title (first 5 words, skip short words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'of', 'in', 'to', 'is', 'be', 'with']);
  const keywords = text.trim().split(/\s+/)
    .filter(function(w) { return w.length > 3 && !stopWords.has(w.toLowerCase()); })
    .slice(0, 4)
    .join(' ')
    .replace(/"/g, '');
  const jql = keywords
    ? 'project = ' + projectKey + ' AND text ~ "' + keywords + '" ORDER BY updated DESC'
    : 'project = ' + projectKey + ' ORDER BY updated DESC';
  try {
    const result = await jiraRequest('GET', '/rest/api/3/search/jql', null, {
      jql,
      maxResults: '5',
      fields: 'summary,status'
    });
    state.jiraRelatedIssues[itemId] = {
      loading: false,
      issues: (result.issues || []).map(function(i) {
        const statusName = i.fields && i.fields.status ? i.fields.status.name : '';
        const isDone = statusName.toLowerCase() === 'done';
        return {
          key: i.key,
          title: i.fields ? i.fields.summary : i.key,
          url: 'https://' + (state.atlassianSite || '').replace(/^https?:\/\//, '') + '/browse/' + i.key,
          state: isDone ? 'closed' : 'open',
          statusName
        };
      })
    };
  } catch (e) {
    state.jiraRelatedIssues[itemId] = { loading: false, issues: [] };
  }
  state.boardDirty = true;
  refreshOpenJiraModal(itemId);
  renderAll();
}

function refreshOpenJiraModal(itemId) {
  if (!state.openModalItem || state.openModalItem.id !== itemId) return;
  renderModalJiraSection(state.openModalItem.type, state.openModalItem.id);
}

function linkItemToJiraIssue(itemId, issueKey) {
  state.jiraItemLinks[itemId] = issueKey;
  state.boardDirty = true;
  renderAll();
}

function unlinkItemFromJiraIssue(itemId) {
  delete state.jiraItemLinks[itemId];
  state.boardDirty = true;
  renderAll();
}

function jiraLinkLabel(type) {
  if (type === 'decision') return 'Link to decision';
  if (type === 'action') return 'Link to action';
  if (type === 'risk') return 'Link to risk';
  return 'Link';
}

function renderModalJiraSection(type, id) {
  if (!els.modalJiraSection || !els.modalJiraIssues) return;
  const showJira = isJiraConfigured() && (type === 'decision' || type === 'action' || type === 'risk');
  els.modalJiraSection.hidden = !showJira;
  if (!showJira) return;

  const related = state.jiraRelatedIssues[id];
  const linkedKey = state.jiraItemLinks[id];

  if (!related) {
    const item = findBoardItem(type, id);
    if (item) loadRelatedJiraIssues(id, (item.title || '') + ' ' + (item.detail || item.summary || ''));
    els.modalJiraIssues.innerHTML = '<p class="github-issues-loading">Searching related Jira issues…</p>';
    return;
  }

  if (related.loading) {
    els.modalJiraIssues.innerHTML = '<p class="github-issues-loading">Searching related Jira issues…</p>';
    return;
  }

  const projectKey = state.jiraConfig.projectKeys[0];
  const loadedProject = state.jiraProjects && state.jiraProjects.find(function(p) { return p.key === projectKey; });
  const projectLabel = (state.jiraConfig.projectName || (loadedProject && loadedProject.name) || projectKey) + ' Jira';
  let html = '';
  if (related.issues.length === 0) {
    html += '<p class="github-no-issues">No related issues found in ' + escapeHtml(projectLabel) + '.</p>';
  } else {
    html += '<ul class="github-issues-list">';
    related.issues.forEach(function(issue) {
      const isLinked = linkedKey === issue.key;
      const checkId = 'jira-link-' + escapeHtml(id) + '-' + escapeHtml(issue.key);
      html += '<li class="github-issue-item' + (isLinked ? ' linked' : '') + '">';
      html += '<label class="tracker-issue-label">';
      html += '<input type="checkbox" class="jira-link-checkbox" data-item-id="' + escapeHtml(id) + '" data-issue-key="' + escapeHtml(issue.key) + '"' + (isLinked ? ' checked' : '') + ' id="' + checkId + '">';
      html += '<span class="github-issue-state ' + escapeHtml(issue.state) + '">' + escapeHtml(issue.statusName || issue.state) + '</span>';
      html += '<a href="' + escapeHtml(issue.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(issue.key) + ' ' + escapeHtml(issue.title) + '</a>';
      html += '</label>';
      html += '</li>';
    });
    html += '</ul>';
  }
  els.modalJiraIssues.innerHTML = html;
}

// --- BRIEF ---

function briefItems() {
  const meeting = state.meetingContext || fakeZoomMeeting;
  return {
    topic: meeting.topic || 'Meeting',
    date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
    attendees: meeting.attendees || [],
    decisions: state.decisions.filter(function(d) { return !d.excludedFromBrief; }),
    actions: state.actions.filter(function(a) { return !a.excludedFromBrief; }),
    risks: state.risks.filter(function(r) { return !r.excludedFromBrief && !r.isOpenQuestion; }),
    openQuestions: state.risks.filter(function(r) { return !r.excludedFromBrief && r.isOpenQuestion; }),
    agents: state.agents.filter(function(a) { return !a.excludedFromBrief && a.status === 'open'; })
  };
}

function evidenceSeconds(value) {
  if (!value) return null;
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function decisionWindow(decision, index, decisions) {
  const start = evidenceSeconds(decision.evidence);
  const next = decisions[index + 1] ? evidenceSeconds(decisions[index + 1].evidence) : null;
  return { start: start === null ? -Infinity : start, end: next === null ? Infinity : next };
}

function itemsInDecisionWindow(list, window) {
  return list.filter(function(item) {
    const seconds = evidenceSeconds(item.evidence);
    return seconds === null || (seconds >= window.start && seconds < window.end);
  });
}

function briefDetail(item, fallback) {
  return item.detail || item.summary || item.intervention || fallback || '';
}

function sortByEvidence(list) {
  return list.slice().sort(function(a, b) {
    const aSeconds = evidenceSeconds(a.evidence);
    const bSeconds = evidenceSeconds(b.evidence);
    if (aSeconds === null && bSeconds === null) return 0;
    if (aSeconds === null) return 1;
    if (bSeconds === null) return -1;
    return aSeconds - bSeconds;
  });
}

function relatedBriefGroups(decision, index, items) {
  const window = decisionWindow(decision, index, items.decisions);
  return [
    { label: 'Assumptions / open questions', items: itemsInDecisionWindow(items.openQuestions, window), type: 'open-question' },
    { label: 'Risks', items: itemsInDecisionWindow(items.risks, window), type: 'risk' },
    { label: 'Agent open issues', items: itemsInDecisionWindow(items.agents, window), type: 'agent' },
    { label: 'Actions', items: itemsInDecisionWindow(items.actions, window), type: 'action' }
  ].filter(function(group) { return group.items.length; });
}

function itemLine(item, type) {
  const title = type === 'agent' ? item.agent : item.title;
  const detail = briefDetail(item);
  return '**' + title + '**' + (detail ? ': ' + detail : '');
}

function includedBriefPayload(items) {
  return {
    decisions: sortByEvidence(items.decisions).map(function(item) {
      return { title: item.title, detail: item.detail, status: item.status, evidence: item.evidence };
    }),
    risks: sortByEvidence(items.risks).map(function(item) {
      return { title: item.title, detail: item.detail, evidence: item.evidence };
    }),
    assumptions: sortByEvidence(items.openQuestions).map(function(item) {
      return { title: item.title, detail: item.detail, evidence: item.evidence };
    }),
    actions: sortByEvidence(items.actions).map(function(item) {
      return { title: item.title, detail: item.detail, evidence: item.evidence };
    }),
    agentOpenIssues: sortByEvidence(items.agents).map(function(item) {
      return { agent: item.agent, statement: item.intervention, priority: item.priority, evidence: item.evidence };
    })
  };
}

function briefKey(items) {
  return JSON.stringify({
    meeting: { topic: items.topic, date: items.date, attendees: items.attendees },
    included: includedBriefPayload(items)
  });
}

function fallbackBriefMarkdown(items) {
  const lines = [
    '## ' + items.topic,
    items.date + ' · Attendees: ' + (items.attendees.length ? items.attendees.join(', ') : 'Not specified'),
    '',
    '### Decisions',
    ''
  ];
  const decisions = sortByEvidence(items.decisions);
  if (items.decisions.length) {
    decisions.forEach(function(decision, index) {
        const groups = relatedBriefGroups(decision, index, items);
      const related = groups
        .filter(function(group) { return group.type === 'risk' || group.type === 'open-question'; })
        .flatMap(function(group) { return group.items.map(function(item) { return itemLine(item, group.type); }); });
      lines.push('* ' + itemLine(decision, 'decision'));
      lines.push('  * General info: ' + (briefDetail(decision) || 'Decision captured from the meeting board.'));
      lines.push('  * Related risks and assumptions: ' + (related.length ? related.join('; ') : 'None captured.'));
    });
  } else {
    lines.push('* None captured.');
  }
  lines.push('', '### Open questions', '');
  const openQuestions = sortByEvidence(items.openQuestions).map(function(item) { return itemLine(item, 'open-question'); })
    .concat(sortByEvidence(items.agents).map(function(item) { return item.intervention || itemLine(item, 'agent'); }));
  if (openQuestions.length) {
    openQuestions.forEach(function(line) { lines.push('* ' + line); });
  } else {
    lines.push('* None captured.');
  }
  return lines.join('\n').trim();
}

function markdownToBriefHtml(markdown) {
  let listOpen = false;
  let nestedOpen = false;
  let currentItemOpen = false;
  const closeNested = function() {
    if (!nestedOpen) return '';
    nestedOpen = false;
    return '</ul>';
  };
  const closeCurrentItem = function() {
    let html = closeNested();
    if (currentItemOpen) {
      currentItemOpen = false;
      html += '</li>';
    }
    return html;
  };
  const closeList = function() {
    let html = closeCurrentItem();
    if (listOpen) {
      listOpen = false;
      html += '</ul>';
    }
    return html;
  };
  const html = String(markdown || '').split('\n').map(function(raw) {
    const line = raw.trimEnd();
    if (!line.trim()) return closeList();
    if (line.startsWith('### ')) return closeList() + '<h4>' + escapeHtml(line.slice(4)) + '</h4>';
    if (line.startsWith('## ')) return closeList() + '<h3>' + escapeHtml(line.slice(3)) + '</h3>';
    if (line.startsWith('  * ')) {
      let prefix = '';
      if (!listOpen) {
        listOpen = true;
        prefix += '<ul>';
      }
      if (!currentItemOpen) {
        currentItemOpen = true;
        prefix += '<li>';
      }
      if (!nestedOpen) {
        nestedOpen = true;
        prefix += '<ul>';
      }
      return prefix + '<li class="brief-nested-item">' + inlineMarkdown(line.slice(4)) + '</li>';
    }
    if (line.startsWith('* ')) {
      let prefix = closeCurrentItem();
      if (!listOpen) {
        listOpen = true;
        prefix += '<ul>';
      }
      currentItemOpen = true;
      return prefix + '<li>' + inlineMarkdown(line.slice(2));
    }
    return closeList() + '<p>' + inlineMarkdown(line) + '</p>';
  }).join('') + closeList();
  return '<div class="brief-markdown">' + html + '</div>';
}

function inlineMarkdown(value) {
  return escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

// ── ADF builder ──────────────────────────────────────────────────────────────
// Atlassian Document Format (ADF) — used for Jira comments and Confluence pages

function adfDoc(content) {
  return { version: 1, type: 'doc', content: content };
}

function adfHeading(text, level) {
  return { type: 'heading', attrs: { level: level || 2 }, content: [{ type: 'text', text: text }] };
}

function adfParagraph(nodes) {
  return { type: 'paragraph', content: Array.isArray(nodes) ? nodes : [{ type: 'text', text: String(nodes) }] };
}

function adfText(text, marks) {
  const node = { type: 'text', text: String(text) };
  if (marks && marks.length) node.marks = marks;
  return node;
}

function adfBulletList(items) {
  return {
    type: 'bulletList',
    content: items.map(function(item) {
      return { type: 'listItem', content: [adfParagraph(item)] };
    })
  };
}

function adfHr() {
  return { type: 'rule' };
}

function adfLink(text, url) {
  return adfText(text, [{ type: 'link', attrs: { href: url } }]);
}

function buildJiraCommentAdf(issueKey, linkedItems, dashboardUrl) {
  const meeting = state.meetingContext || fakeZoomMeeting;
  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const content = [];

  content.push(adfHeading('Meeting update — ' + escapeText(meeting.topic || 'Meeting'), 2));
  content.push(adfParagraph([adfText(date + ' · ')]));

  const decisions = linkedItems.filter(function(i) { return i.type === 'decision'; });
  const actions = linkedItems.filter(function(i) { return i.type === 'action'; });
  const risks = linkedItems.filter(function(i) { return i.type === 'risk'; });

  if (decisions.length) {
    content.push(adfHeading('Decisions', 3));
    content.push(adfBulletList(decisions.map(function(i) {
      return [adfText(i.item.title, [{ type: 'strong' }])].concat(
        i.item.detail ? [adfText(' — ' + i.item.detail)] : []
      ).concat(i.item.evidence ? [adfText(' (' + i.item.evidence + ')', [{ type: 'em' }])] : []);
    })));
  }

  if (actions.length) {
    content.push(adfHeading('Actions', 3));
    content.push(adfBulletList(actions.map(function(i) {
      return [adfText(i.item.title, [{ type: 'strong' }])].concat(
        i.item.detail ? [adfText(' — ' + i.item.detail)] : []
      );
    })));
  }

  if (risks.length) {
    content.push(adfHeading('Risks', 3));
    content.push(adfBulletList(risks.map(function(i) {
      return [adfText(i.item.title, [{ type: 'strong' }])].concat(
        i.item.detail ? [adfText(' — ' + i.item.detail)] : []
      );
    })));
  }

  content.push(adfHr());
  content.push(adfParagraph([
    adfText('Posted by '),
    dashboardUrl ? adfLink('Room Clarity', dashboardUrl) : adfText('Room Clarity'),
    adfText(' · room-clarity')
  ]));

  return adfDoc(content);
}

function escapeText(str) {
  return String(str || '').replace(/[<>&"]/g, function(c) {
    return c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : '&quot;';
  });
}

// ── Jira publish ─────────────────────────────────────────────────────────────

function buildJiraProposals() {
  if (!isJiraConfigured()) return [];
  const items = briefItems();
  const proposals = [];

  // Linked items → one consolidated comment proposal per Jira issue
  const byIssue = {};
  const allItems = [
    ...items.decisions.map(function(d) { return { type: 'decision', item: d }; }),
    ...items.actions.map(function(a) { return { type: 'action', item: a }; }),
    ...items.risks.map(function(r) { return { type: 'risk', item: r }; })
  ];
  allItems.forEach(function(entry) {
    const key = state.jiraItemLinks[entry.item.id];
    if (!key) return;
    if (!byIssue[key]) byIssue[key] = [];
    byIssue[key].push(entry);
  });
  Object.keys(byIssue).forEach(function(issueKey) {
    const linkedItems = byIssue[issueKey];
    proposals.push({
      type: 'comment',
      issueKey,
      linkedItems,
      include: true,
      label: issueKey + ' — ' + linkedItems.length + ' item' + (linkedItems.length === 1 ? '' : 's')
    });
  });

  // Unlinked accepted decisions and actions → new Jira issue proposals
  items.decisions.forEach(function(d) {
    if (state.jiraItemLinks[d.id]) return;
    proposals.push({ type: 'issue', itemType: 'decision', item: d, include: true, label: 'New issue: ' + d.title });
  });
  items.actions.forEach(function(a) {
    if (state.jiraItemLinks[a.id]) return;
    proposals.push({ type: 'issue', itemType: 'action', item: a, include: true, label: 'New issue: ' + a.title });
  });

  return proposals;
}

function buildJiraProposalPreview(proposal) {
  const meeting = state.meetingContext || fakeZoomMeeting;
  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  if (proposal.type === 'comment') {
    const lines = ['Meeting update — ' + (meeting.topic || 'Meeting'), date, ''];
    const decisions = proposal.linkedItems.filter(function(i) { return i.type === 'decision'; });
    const actions = proposal.linkedItems.filter(function(i) { return i.type === 'action'; });
    const risks = proposal.linkedItems.filter(function(i) { return i.type === 'risk'; });
    if (decisions.length) { lines.push('Decisions'); decisions.forEach(function(i) { lines.push('• ' + i.item.title + (i.item.detail ? ' — ' + i.item.detail : '')); }); lines.push(''); }
    if (actions.length) { lines.push('Actions'); actions.forEach(function(i) { lines.push('• ' + i.item.title + (i.item.detail ? ' — ' + i.item.detail : '')); }); lines.push(''); }
    if (risks.length) { lines.push('Risks'); risks.forEach(function(i) { lines.push('• ' + i.item.title + (i.item.detail ? ' — ' + i.item.detail : '')); }); lines.push(''); }
    lines.push('Posted by Room Clarity · room-clarity');
    return lines.join('\n').trim();
  }
  if (proposal.type === 'issue') {
    const tag = proposal.itemType === 'decision' ? '[Decision]' : '[Action]';
    const lines = [
      tag + ' ' + proposal.item.title,
      '',
      proposal.item.detail || proposal.item.summary || '',
      '',
      'Meeting: ' + (meeting.topic || 'Meeting'),
      'Evidence: ' + (proposal.item.evidence || 'No timestamp'),
      '',
      'Created by Room Clarity · room-clarity'
    ];
    return lines.join('\n').trim();
  }
  return '';
}

function buildJiraNewIssueAdf(itemType, item, dashboardUrl) {
  const meeting = state.meetingContext || fakeZoomMeeting;
  const content = [];
  if (item.detail || item.summary) content.push(adfParagraph([adfText(item.detail || item.summary)]));
  content.push(adfHr());
  content.push(adfParagraph([
    adfText('Meeting: ' + (meeting.topic || 'Meeting') + (item.evidence ? ' · ' + item.evidence : '') + ' · Posted by '),
    dashboardUrl ? adfLink('Room Clarity', dashboardUrl) : adfText('Room Clarity'),
    adfText(' · room-clarity')
  ]));
  return adfDoc(content);
}

function renderBriefJira() {
  if (!els.jiraBriefSection || !els.jiraBriefContent) return;
  const configured = state.trackerProvider === 'atlassian' && isJiraConfigured();
  els.jiraBriefSection.hidden = !configured;
  if (!configured) return;

  const projectKey = state.jiraConfig.projectKeys[0];
  const loadedProject = state.jiraProjects && state.jiraProjects.find(function(p) { return p.key === projectKey; });
  const projectLabel = (state.jiraConfig.projectName || (loadedProject && loadedProject.name) || projectKey) + ' Jira';

  if (state.jiraPublishing) {
    els.jiraBriefStatus.textContent = 'Publishing…';
    els.jiraBriefContent.innerHTML = '<p class="github-brief-publishing">Publishing to Jira…</p>';
    return;
  }

  if (state.jiraPublishResult) {
    const result = state.jiraPublishResult;
    els.jiraBriefStatus.textContent = result.error ? 'Error' : 'Published';
    if (result.error) {
      els.jiraBriefContent.innerHTML =
        '<p class="github-brief-error">' + escapeHtml(result.error) + '</p>' +
        '<button class="github-publish-btn" type="button" id="jiraRetryBtn">Retry</button>';
    } else {
      let html = '<ul class="github-publish-results">';
      (result.comments || []).forEach(function(c) {
        html += '<li><a href="' + escapeHtml(c.url) + '" target="_blank" rel="noopener noreferrer">Comment on ' + escapeHtml(c.issueKey) + '</a></li>';
      });
      (result.issues || []).forEach(function(i) {
        html += '<li><a href="' + escapeHtml(i.url) + '" target="_blank" rel="noopener noreferrer">Created ' + escapeHtml(i.key) + '</a></li>';
      });
      if (result.confluencePage) {
        html += '<li><a href="' + escapeHtml(result.confluencePage.url) + '" target="_blank" rel="noopener noreferrer">Decision Log updated in Confluence</a></li>';
      }
      html += '</ul>';
      html += '<button class="github-publish-btn secondary" type="button" id="jiraResetBtn">Publish again</button>';
      els.jiraBriefContent.innerHTML = html;
    }
    wireJiraBriefButtons();
    return;
  }

  const proposals = buildJiraProposals();
  state.jiraProposals = proposals;
  const confluenceSpaceKey = state.jiraConfig.confluenceSpaceKey;

  els.jiraBriefStatus.textContent = projectLabel;

  if (proposals.length === 0 && !confluenceSpaceKey) {
    els.jiraBriefContent.innerHTML = '<p class="github-brief-empty">Accept decisions or actions on the board to create Jira proposals.</p>';
    return;
  }

  let html = '';

  if (proposals.length > 0) {
    html += '<ul class="github-proposal-list">';
    proposals.forEach(function(proposal, index) {
      html += '<li class="github-proposal-item">';
      html += '<label><input type="checkbox" class="jira-proposal-check" data-index="' + index + '"' + (proposal.include ? ' checked' : '') + '>';
      html += '<span class="github-proposal-type ' + proposal.type + '">' + (proposal.type === 'issue' ? 'Issue' : 'Comment') + '</span>';
      html += escapeHtml(proposal.label) + '</label>';
      const previewLabel = proposal.type === 'comment' ? 'Preview comment' : 'Preview issue body';
      html += '<details class="proposal-preview"><summary>' + previewLabel + '</summary>';
      html += '<pre class="proposal-body-text">' + escapeHtml(buildJiraProposalPreview(proposal)) + '</pre></details>';
      html += '</li>';
    });
    html += '</ul>';
  }

  if (confluenceSpaceKey) {
    const items = briefItems();
    const decisionCount = items.decisions.length;
    html += '<label class="github-transcript-toggle">';
    html += '<input type="checkbox" id="jiraConfluenceToggle"' + (state.jiraConfig.confluenceDecisionLog !== false ? ' checked' : '') + (decisionCount === 0 ? ' disabled' : '') + '>';
    html += 'Append ' + decisionCount + ' decision' + (decisionCount === 1 ? '' : 's') + ' to Confluence Decision Log (' + escapeHtml(confluenceSpaceKey) + ')';
    html += '</label>';
  }

  const hasAnything = proposals.some(function(p) { return p.include; }) || (confluenceSpaceKey && state.jiraConfig.confluenceDecisionLog !== false && briefItems().decisions.length > 0);
  html += '<button class="github-publish-btn" type="button" id="jiraPublishBtn"' + (hasAnything ? '' : ' disabled') + '>Publish to Jira</button>';

  els.jiraBriefContent.innerHTML = html;
  wireJiraBriefButtons();
}

function wireJiraBriefButtons() {
  function updatePublishBtn() {
    const btn = document.querySelector('#jiraPublishBtn');
    if (!btn) return;
    const hasProposals = state.jiraProposals.some(function(p) { return p.include; });
    const confluenceToggle = document.querySelector('#jiraConfluenceToggle');
    const hasConfluence = confluenceToggle && confluenceToggle.checked;
    btn.disabled = !hasProposals && !hasConfluence;
  }

  const proposalChecks = document.querySelectorAll('.jira-proposal-check');
  proposalChecks.forEach(function(cb) {
    cb.addEventListener('change', function() {
      const index = Number(cb.dataset.index);
      if (state.jiraProposals[index]) state.jiraProposals[index].include = cb.checked;
      updatePublishBtn();
    });
  });

  const confluenceToggle = document.querySelector('#jiraConfluenceToggle');
  if (confluenceToggle) {
    confluenceToggle.addEventListener('change', function() {
      state.jiraConfig.confluenceDecisionLog = confluenceToggle.checked;
      updatePublishBtn();
    });
  }

  const publishBtn = document.querySelector('#jiraPublishBtn');
  if (publishBtn) publishBtn.addEventListener('click', publishToJira);

  const retryBtn = document.querySelector('#jiraRetryBtn');
  if (retryBtn) retryBtn.addEventListener('click', function() {
    state.jiraPublishResult = null;
    renderAll();
  });

  const resetBtn = document.querySelector('#jiraResetBtn');
  if (resetBtn) resetBtn.addEventListener('click', function() {
    state.jiraPublishResult = null;
    renderAll();
  });
}

async function publishToJira() {
  if (state.jiraPublishing) return;
  state.jiraPublishing = true;
  renderBriefJira();

  const dashboardUrl = window.location.href;
  const result = { comments: [], issues: [], confluencePage: null, error: null };
  const siteBase = 'https://' + (state.atlassianSite || '').replace(/^https?:\/\//, '');

  try {
    const includedProposals = state.jiraProposals.filter(function(p) { return p.include; });
    for (const proposal of includedProposals) {
      if (proposal.type === 'comment') {
        // Post consolidated comment on a linked Jira issue
        const adf = buildJiraCommentAdf(proposal.issueKey, proposal.linkedItems, dashboardUrl);
        const commentResult = await jiraRequest('POST', '/rest/api/3/issue/' + proposal.issueKey + '/comment', { body: adf });
        if (commentResult && commentResult.id) {
          const issueUrl = siteBase + '/browse/' + proposal.issueKey;
          result.comments.push({ issueKey: proposal.issueKey, url: issueUrl });
          await jiraRequest('POST', '/rest/api/3/issue/' + proposal.issueKey + '/remotelink', {
            globalId: 'room-clarity-' + dashboardUrl,
            object: { url: dashboardUrl, title: 'Room Clarity session', icon: { url16x16: 'https://roomclarity.com/meeting-decision-maker-icon.png', title: 'Room Clarity' } }
          });
        }
      } else if (proposal.type === 'issue') {
        // Create a new Jira issue for an unlinked decision or action
        const projectKey = state.jiraConfig.projectKeys[0];
        const tag = proposal.itemType === 'decision' ? '[Decision]' : '[Action]';
        const adf = buildJiraNewIssueAdf(proposal.itemType, proposal.item, dashboardUrl);
        const createResult = await jiraRequest('POST', '/rest/api/3/issue', {
          fields: {
            project: { key: projectKey },
            summary: tag + ' ' + proposal.item.title,
            description: adf,
            issuetype: { name: 'Task' }
          }
        });
        if (createResult && createResult.key) {
          const issueUrl = siteBase + '/browse/' + createResult.key;
          result.issues.push({ key: createResult.key, url: issueUrl });
          await jiraRequest('POST', '/rest/api/3/issue/' + createResult.key + '/remotelink', {
            globalId: 'room-clarity-' + dashboardUrl,
            object: { url: dashboardUrl, title: 'Room Clarity session', icon: { url16x16: 'https://roomclarity.com/meeting-decision-maker-icon.png', title: 'Room Clarity' } }
          });
        }
      }
    }

    // 2. Append to Confluence Decision Log
    const confluenceToggle = document.querySelector('#jiraConfluenceToggle');
    if (confluenceToggle && confluenceToggle.checked && state.jiraConfig.confluenceSpaceKey) {
      const confluencePage = await appendToConfluenceDecisionLog();
      if (confluencePage) result.confluencePage = confluencePage;
    }
  } catch (e) {
    result.error = 'Jira publish failed: ' + (e.message || 'Unknown error');
  }

  state.jiraPublishing = false;
  state.jiraPublishResult = result;
  renderAll();
}

async function appendToConfluenceDecisionLog() {
  const spaceKey = state.jiraConfig.confluenceSpaceKey;
  const items = briefItems();
  const decisions = items.decisions;
  if (!decisions.length) return null;

  const meeting = state.meetingContext || fakeZoomMeeting;
  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const dashboardUrl = window.location.href;

  // Find or create the Decision Log page
  const searchResult = await confluenceRequest('GET', '/wiki/api/v2/pages', null, {
    spaceKey,
    title: 'Decision Log',
    limit: '1'
  });

  let pageId = null;
  let currentVersion = 0;
  let currentBody = '';

  if (searchResult && searchResult.results && searchResult.results.length > 0) {
    pageId = searchResult.results[0].id;
    // Fetch current page content
    const pageDetail = await confluenceRequest('GET', '/wiki/api/v2/pages/' + pageId, null, { 'body-format': 'storage' });
    currentVersion = pageDetail && pageDetail.version ? pageDetail.version.number : 1;
    currentBody = pageDetail && pageDetail.body && pageDetail.body.storage ? pageDetail.body.storage.value : '';
  }

  // Build new rows for the decision table
  const newRows = decisions.map(function(d) {
    return '<tr>' +
      '<td>' + escapeText(d.title) + '</td>' +
      '<td>' + escapeText(d.detail || '') + '</td>' +
      '<td>' + escapeText(date) + '</td>' +
      '<td>' + escapeText(meeting.topic || 'Meeting') + '</td>' +
      '<td><a href="' + escapeText(dashboardUrl) + '">Room Clarity</a></td>' +
      '</tr>';
  }).join('');

  if (!pageId) {
    // Create the Decision Log page from scratch
    const tableHeader = '<table><tbody><tr><th>Decision</th><th>Detail</th><th>Date</th><th>Meeting</th><th>Source</th></tr>' + newRows + '</tbody></table>';
    const createResult = await confluenceRequest('POST', '/wiki/api/v2/pages', {
      spaceId: await resolveConfluenceSpaceId(spaceKey),
      title: 'Decision Log',
      status: 'current',
      body: { representation: 'storage', value: tableHeader }
    });
    if (!createResult || !createResult.id) return null;
    const pageUrl = 'https://' + (state.atlassianSite || '').replace(/^https?:\/\//, '') + '/wiki' + (createResult._links && createResult._links.webui ? createResult._links.webui : '');
    return { url: pageUrl };
  } else {
    // Append new rows to existing table, or append a new table if none exists
    let updatedBody;
    if (currentBody.includes('</tbody></table>')) {
      updatedBody = currentBody.replace('</tbody></table>', newRows + '</tbody></table>');
    } else {
      const tableHeader = '<table><tbody><tr><th>Decision</th><th>Detail</th><th>Date</th><th>Meeting</th><th>Source</th></tr>' + newRows + '</tbody></table>';
      updatedBody = currentBody + tableHeader;
    }
    await confluenceRequest('PUT', '/wiki/api/v2/pages/' + pageId, {
      id: pageId,
      version: { number: currentVersion + 1 },
      title: 'Decision Log',
      status: 'current',
      body: { representation: 'storage', value: updatedBody }
    });
    const pageUrl = 'https://' + (state.atlassianSite || '').replace(/^https?:\/\//, '') + '/wiki/spaces/' + spaceKey + '/pages/' + pageId;
    return { url: pageUrl };
  }
}

async function resolveConfluenceSpaceId(spaceKey) {
  // Check loaded spaces first
  if (state.confluenceSpaces) {
    const space = state.confluenceSpaces.find(function(s) { return s.key === spaceKey; });
    if (space && space.id) return space.id;
  }
  // Fetch from API
  const result = await confluenceRequest('GET', '/wiki/api/v2/spaces', null, { keys: spaceKey, limit: '1' });
  return result && result.results && result.results[0] ? result.results[0].id : null;
}

function renderBriefPanel() {
  const items = briefItems();
  const key = briefKey(items);
  if (state.analysisConfig.enabled && state.reviewMode && state.briefRequestKey !== key && !state.briefLoading) {
    requestBriefAnalysis(items, key);
  } else if (!state.analysisConfig.enabled && state.briefRequestKey !== key) {
    state.briefMarkdown = fallbackBriefMarkdown(items);
    state.briefRequestKey = key;
    state.briefError = '';
  }

  if (state.briefLoading) {
    els.copyBriefButton.disabled = true;
    els.briefContent.innerHTML = '<div class="brief-loading"><span></span><p>Generating meeting brief from included items...</p></div>';
    renderBriefGithub();
    renderBriefJira();
    return;
  }
  els.copyBriefButton.disabled = false;
  const fallback = fallbackBriefMarkdown(items);
  const markdown = state.briefMarkdown || fallback;
  els.briefContent.innerHTML = (state.briefError ? '<p class="brief-error">' + escapeHtml(state.briefError) + '</p>' : '') +
    (markdown ? markdownToBriefHtml(markdown) : '<p class="brief-empty">No items included. Use the board below to accept decisions, promote agent issues, or re-include anything that should appear here.</p>');
  renderBriefGithub();
  renderBriefJira();
}

async function requestBriefAnalysis(items, key) {
  state.briefLoading = true;
  state.briefError = '';
  state.briefRequestKey = key;
  els.briefContent.innerHTML = '<div class="brief-loading"><span></span><p>Generating meeting brief from included items...</p></div>';
  try {
    const response = await fetch('/api/analyze-brief', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        meeting: { name: items.topic, date: items.date, attendees: items.attendees },
        includedItems: includedBriefPayload(items)
      })
    });
    if (!response.ok) throw new Error('Brief generation unavailable');
    const result = await response.json();
    if (state.briefRequestKey !== key) return;
    state.briefMarkdown = result.markdown || fallbackBriefMarkdown(items);
  } catch (error) {
    if (state.briefRequestKey !== key) return;
    state.briefMarkdown = fallbackBriefMarkdown(items);
    state.briefError = 'Using local brief because LLM generation was unavailable.';
  } finally {
    if (state.briefRequestKey === key) {
      state.briefLoading = false;
      state.boardDirty = true;
      renderAll();
    }
  }
}

function exportBriefAsMarkdown() {
  return state.briefMarkdown || fallbackBriefMarkdown(briefItems());
}

// --- GITHUB BRIEF ---

function linkedIssueTitle(itemId, issueNumber) {
  const related = state.githubRelatedIssues[itemId];
  if (!related || !related.issues) return null;
  const found = related.issues.find(function(i) { return i.number === issueNumber; });
  return found ? found.title : null;
}

function buildGithubProposals() {
  if (!isGithubConfigured()) return [];
  const proposals = [];
  const items = briefItems();

  sortByEvidence(items.decisions).forEach(function(decision) {
    if (decision.status !== 'accepted') return;
    const linkedIssue = state.githubItemLinks[decision.id];
    if (linkedIssue) {
      const issueTitle = linkedIssueTitle(decision.id, linkedIssue);
      proposals.push({
        id: decision.id,
        include: true,
        type: 'comment',
        label: 'Comment on #' + linkedIssue + (issueTitle ? ': ' + issueTitle : ''),
        issueNumber: linkedIssue,
        title: decision.title,
        body: buildIssueCommentBody('decision', decision)
      });
    } else {
      proposals.push({
        id: decision.id,
        include: true,
        type: 'issue',
        label: 'New issue: ' + decision.title,
        title: '[Decision] ' + decision.title,
        body: buildIssueBody('decision', decision)
      });
    }
  });

  sortByEvidence(items.actions).forEach(function(action) {
    const linkedIssue = state.githubItemLinks[action.id];
    if (linkedIssue) {
      const issueTitle = linkedIssueTitle(action.id, linkedIssue);
      proposals.push({
        id: action.id,
        include: true,
        type: 'comment',
        label: 'Comment on #' + linkedIssue + (issueTitle ? ': ' + issueTitle : ''),
        issueNumber: linkedIssue,
        title: action.title,
        body: buildIssueCommentBody('action', action)
      });
    } else {
      proposals.push({
        id: action.id,
        include: true,
        type: 'issue',
        label: 'New issue: ' + action.title,
        title: '[Action] ' + action.title,
        body: buildIssueBody('action', action)
      });
    }
  });

  return proposals;
}

function buildIssueBody(type, item) {
  const meeting = state.meetingContext || fakeZoomMeeting;
  const lines = [
    '## ' + (type === 'decision' ? 'Decision' : 'Action') + ': ' + item.title,
    '',
    item.detail || item.summary || '',
    '',
    '---',
    '**Meeting:** ' + meeting.topic,
    '**Evidence:** ' + (item.evidence || 'No timestamp'),
    '',
    '*Captured by Room Clarity*'
  ];
  return lines.join('\n').trim();
}

function buildIssueCommentBody(type, item) {
  const meeting = state.meetingContext || fakeZoomMeeting;
  const lines = [
    '### Meeting update — ' + (type === 'decision' ? 'Decision' : 'Action'),
    '',
    '**' + item.title + '**',
    '',
    item.detail || item.summary || '',
    '',
    '**Meeting:** ' + meeting.topic,
    '**Evidence:** ' + (item.evidence || 'No timestamp'),
    '',
    '*Posted by Room Clarity*'
  ];
  return lines.join('\n').trim();
}

function buildTranscriptFileContent() {
  const meeting = state.meetingContext || fakeZoomMeeting;
  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    '# ' + meeting.topic,
    '',
    'Date: ' + date,
    'Attendees: ' + ((meeting.attendees || []).join(', ') || 'Not specified'),
    '',
    '## Transcript',
    ''
  ];
  state.cues.forEach(function(cue) {
    lines.push('**' + formatTime(cue.start) + ' · ' + cue.speaker + '**');
    lines.push(cue.text);
    lines.push('');
  });
  return lines.join('\n').trim();
}

function transcriptFilePath() {
  const config = state.githubConfig;
  const folder = (config && config.folder) || 'meetings';
  const meeting = state.meetingContext || fakeZoomMeeting;
  const date = new Date().toISOString().slice(0, 10);
  const slug = (meeting.topic || 'meeting')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return folder + '/' + date + '-' + slug + '.md';
}

function discussionTitle() {
  const meeting = state.meetingContext || fakeZoomMeeting;
  const date = new Date().toISOString().slice(0, 10);
  return 'Meeting brief: ' + meeting.topic + ' (' + date + ')';
}

function discussionBody() {
  const meeting = state.meetingContext || fakeZoomMeeting;
  const lines = [
    exportBriefAsMarkdown(),
    '',
    '---',
    '*Posted by Room Clarity from the reviewed meeting brief for ' + meeting.topic + '.*'
  ];
  return lines.join('\n').trim();
}

function loadGithubDiscussionCategories() {
  if (!isGithubConfigured() || state.githubDiscussionCategories) return;
  if (state.demoMode) {
    state.githubDiscussionCategories = {
      loading: false,
      repositoryId: 'demo-repository',
      categories: [
        { id: 'demo-announcements', name: 'Announcements' },
        { id: 'demo-general', name: 'General' }
      ],
      error: ''
    };
    if (!state.githubDiscussionCategoryId) state.githubDiscussionCategoryId = 'demo-general';
    return;
  }

  const { owner, repo } = state.githubConfig;
  state.githubDiscussionCategories = { loading: true, repositoryId: '', categories: [], error: '' };
  const query = [
    'query RoomClarityDiscussionCategories($owner: String!, $repo: String!) {',
    '  repository(owner: $owner, name: $repo) {',
    '    id',
    '    discussionCategories(first: 20) {',
    '      nodes { id name }',
    '    }',
    '  }',
    '}'
  ].join('\n');
  githubGraphql(query, { owner, repo }).then(function(result) {
    const repository = result.data && result.data.repository;
    const categories = repository && repository.discussionCategories && repository.discussionCategories.nodes;
    state.githubDiscussionCategories = {
      loading: false,
      repositoryId: repository ? repository.id : '',
      categories: Array.isArray(categories) ? categories.filter(Boolean) : [],
      error: result.errors ? 'GitHub Discussions are unavailable for this repo or token.' : ''
    };
    if (!state.githubDiscussionCategoryId && state.githubDiscussionCategories.categories.length) {
      state.githubDiscussionCategoryId = state.githubDiscussionCategories.categories[0].id;
    }
    state.boardDirty = true;
    renderAll();
  }).catch(function() {
    state.githubDiscussionCategories = {
      loading: false,
      repositoryId: '',
      categories: [],
      error: 'Could not load discussion categories.'
    };
    state.boardDirty = true;
    renderAll();
  });
}

function selectedDiscussionCategory() {
  const info = state.githubDiscussionCategories;
  if (!info || !info.categories) return null;
  return info.categories.find(function(category) {
    return category.id === state.githubDiscussionCategoryId;
  }) || info.categories[0] || null;
}

function renderBriefGithub() {
  if (!els.githubBriefSection || !els.githubBriefContent) return;
  const configured = state.trackerProvider === 'github' && isGithubConfigured();
  els.githubBriefSection.hidden = !configured;
  if (!configured) return;

  const { owner, repo } = state.githubConfig;
  loadGithubDiscussionCategories();

  if (state.githubPublishing) {
    els.githubBriefStatus.textContent = 'Publishing…';
    els.githubBriefContent.innerHTML = '<p class="github-brief-publishing">Publishing to GitHub…</p>';
    return;
  }

  if (state.githubPublishResult) {
    const result = state.githubPublishResult;
    if (result.error) {
      els.githubBriefStatus.textContent = 'Failed';
      els.githubBriefContent.innerHTML = '<p class="github-brief-error">' + escapeHtml(result.error) + '</p>' +
        '<button class="github-publish-btn" type="button" id="githubRetryBtn">Retry</button>';
    } else {
      els.githubBriefStatus.textContent = 'Published';
      let html = '<ul class="github-publish-results">';
      (result.issues || []).forEach(function(item) {
        html += '<li><a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(item.label) + '</a></li>';
      });
      if (result.pr) {
        html += '<li><a href="' + escapeHtml(result.pr.url) + '" target="_blank" rel="noopener noreferrer">Transcript PR: ' + escapeHtml(result.pr.title) + '</a></li>';
      }
      if (result.discussion) {
        html += '<li><a href="' + escapeHtml(result.discussion.url) + '" target="_blank" rel="noopener noreferrer">Discussion: ' + escapeHtml(result.discussion.title) + '</a></li>';
      }
      html += '</ul>';
      html += '<button class="github-publish-btn secondary" type="button" id="githubResetBtn">Publish again</button>';
      els.githubBriefContent.innerHTML = html;
    }
    wireGithubBriefButtons();
    return;
  }

  if (state.demoMode && Object.keys(state.githubItemLinks).length === 0) {
    const retentionDecision = state.decisions.find(function(d) {
      return d.status === 'accepted' && /transcript|retain/i.test(d.title);
    });
    if (retentionDecision) {
      state.githubItemLinks[retentionDecision.id] = 3;
      if (!state.githubRelatedIssues[retentionDecision.id]) {
        state.githubRelatedIssues[retentionDecision.id] = { loading: false, issues: [demoGithubIssues[2]] };
      }
    }
  }

  const proposals = buildGithubProposals();
  state.githubProposals = proposals;

  els.githubBriefStatus.textContent = owner + '/' + repo;
  const hasCues = state.cues.length > 0;
  const discussionInfo = state.githubDiscussionCategories;
  const discussionReady = discussionInfo && !discussionInfo.loading && discussionInfo.repositoryId && discussionInfo.categories.length > 0;
  const discussionBlocked = discussionInfo && !discussionInfo.loading && (!discussionInfo.repositoryId || discussionInfo.error || discussionInfo.categories.length === 0);

  let html = '';
  if (proposals.length === 0 && !hasCues && !exportBriefAsMarkdown()) {
    html = '<p class="github-brief-empty">Accept decisions or actions on the board to create GitHub proposals.</p>';
  } else {
    if (proposals.length > 0) {
      html += '<ul class="github-proposal-list">';
      proposals.forEach(function(proposal, index) {
        html += '<li class="github-proposal-item">';
        html += '<label><input type="checkbox" class="github-proposal-check" data-index="' + index + '"' + (proposal.include ? ' checked' : '') + '>';
        html += '<span class="github-proposal-type ' + proposal.type + '">' + (proposal.type === 'issue' ? 'Issue' : 'Comment') + '</span>';
        html += escapeHtml(proposal.label) + '</label>';
        const previewLabel = proposal.type === 'comment' ? 'Preview comment' : 'Preview issue body';
        html += '<details class="proposal-preview"><summary>' + previewLabel + '</summary>';
        html += '<pre class="proposal-body-text">' + escapeHtml(proposal.body) + '</pre></details>';
        html += '</li>';
      });
      html += '</ul>';
    }
    if (hasCues) {
      html += '<label class="github-transcript-toggle">';
      html += '<input type="checkbox" id="githubTranscriptToggle"' + (state.githubTranscriptUpload ? ' checked' : '') + '>';
      html += 'Upload transcript as PR to <code>' + escapeHtml(transcriptFilePath()) + '</code>';
      html += '</label>';
    }
    html += '<div class="github-discussion-post">';
    html += '<label class="github-discussion-toggle">';
    html += '<input type="checkbox" id="githubDiscussionToggle"' + (state.githubDiscussionPost ? ' checked' : '') + (discussionReady ? '' : ' disabled') + '>';
    html += 'Post reviewed brief as a GitHub Discussion';
    html += '</label>';
    if (discussionInfo && discussionInfo.loading) {
      html += '<p class="github-discussion-note">Loading discussion categories...</p>';
    } else if (discussionBlocked) {
      html += '<p class="github-discussion-note">Discussions are not available for this repo, or this token cannot read discussion categories.</p>';
    }
    html += '</div>';
    const anySelected = proposals.some(function(p) { return p.include; }) || state.githubTranscriptUpload || (state.githubDiscussionPost && discussionReady);
    html += '<button class="github-publish-btn" type="button" id="githubPublishBtn"' + (anySelected ? '' : ' disabled') + '>Publish to GitHub</button>';
  }

  els.githubBriefContent.innerHTML = html;
  wireGithubBriefButtons();
}

function wireGithubBriefButtons() {
  function updatePublishButton() {
    const publishBtn = document.querySelector('#githubPublishBtn');
    if (!publishBtn) return;
    const discussionReady = state.githubDiscussionCategories &&
      !state.githubDiscussionCategories.loading &&
      state.githubDiscussionCategories.repositoryId &&
      state.githubDiscussionCategories.categories.length > 0;
    const anySelected = state.githubProposals.some(function(p) { return p.include; }) ||
      state.githubTranscriptUpload ||
      (state.githubDiscussionPost && discussionReady);
    publishBtn.disabled = !anySelected;
  }

  const publishBtn = document.querySelector('#githubPublishBtn');
  if (publishBtn) publishBtn.addEventListener('click', publishToGithub);

  const retryBtn = document.querySelector('#githubRetryBtn');
  if (retryBtn) retryBtn.addEventListener('click', function() {
    state.githubPublishResult = null;
    renderAll();
  });

  const resetBtn = document.querySelector('#githubResetBtn');
  if (resetBtn) resetBtn.addEventListener('click', function() {
    state.githubPublishResult = null;
    renderAll();
  });

  const transcriptToggle = document.querySelector('#githubTranscriptToggle');
  if (transcriptToggle) {
    transcriptToggle.addEventListener('change', function() {
      state.githubTranscriptUpload = transcriptToggle.checked;
      updatePublishButton();
    });
  }

  const discussionToggle = document.querySelector('#githubDiscussionToggle');
  if (discussionToggle) {
    discussionToggle.addEventListener('change', function() {
      state.githubDiscussionPost = discussionToggle.checked;
      updatePublishButton();
    });
  }

  document.querySelectorAll('.github-proposal-check').forEach(function(checkbox) {
    checkbox.addEventListener('change', function() {
      const index = Number(checkbox.dataset.index);
      if (state.githubProposals[index]) {
        state.githubProposals[index].include = checkbox.checked;
      }
      updatePublishButton();
    });
  });
}

async function publishToGithub() {
  if (!isGithubConfigured() || state.githubPublishing) return;
  if (state.demoMode) return;
  state.githubPublishing = true;
  state.boardDirty = true;
  renderAll();

  const { owner, repo } = state.githubConfig;
  const results = { issues: [], pr: null, discussion: null, error: null };

  try {
    const included = state.githubProposals.filter(function(p) { return p.include; });
    for (const proposal of included) {
      if (proposal.type === 'issue') {
        const created = await githubRequest('POST', '/repos/' + owner + '/' + repo + '/issues', {
          title: proposal.title,
          body: proposal.body
        });
        results.issues.push({ label: '#' + created.number + ' ' + proposal.title, url: created.html_url });
      } else if (proposal.type === 'comment' && proposal.issueNumber) {
        const comment = await githubRequest('POST', '/repos/' + owner + '/' + repo + '/issues/' + proposal.issueNumber + '/comments', {
          body: proposal.body
        });
        results.issues.push({ label: 'Comment on #' + proposal.issueNumber, url: comment.html_url });
      }
    }

    if (state.githubTranscriptUpload) {
      const filePath = transcriptFilePath();
      const content = btoa(unescape(encodeURIComponent(buildTranscriptFileContent())));
      const meeting = state.meetingContext || fakeZoomMeeting;

      let baseSha = null;
      try {
        const refsResult = await githubRequest('GET', '/repos/' + owner + '/' + repo + '/git/refs/heads/main');
        baseSha = refsResult.object && refsResult.object.sha;
      } catch (e) { /* branch may not exist */ }

      const branchName = 'room-clarity/' + new Date().toISOString().slice(0, 10) + '-transcript';
      if (baseSha) {
        await githubRequest('POST', '/repos/' + owner + '/' + repo + '/git/refs', {
          ref: 'refs/heads/' + branchName,
          sha: baseSha
        });
      }

      await githubRequest('PUT', '/repos/' + owner + '/' + repo + '/contents/' + filePath, {
        message: 'Add meeting transcript: ' + meeting.topic,
        content,
        branch: branchName
      });

      const pr = await githubRequest('POST', '/repos/' + owner + '/' + repo + '/pulls', {
        title: 'Meeting transcript: ' + meeting.topic,
        body: 'Transcript from ' + meeting.topic + ' uploaded by Room Clarity.',
        head: branchName,
        base: 'main'
      });
      results.pr = { title: pr.title, url: pr.html_url };
    }

    if (state.githubDiscussionPost) {
      const discussionInfo = state.githubDiscussionCategories;
      const category = selectedDiscussionCategory();
      if (!discussionInfo || !discussionInfo.repositoryId || !category) {
        throw new Error('No GitHub Discussion category selected');
      }
      const mutation = [
        'mutation RoomClarityCreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {',
        '  createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {',
        '    discussion { title url }',
        '  }',
        '}'
      ].join('\n');
      const result = await githubGraphql(mutation, {
        repositoryId: discussionInfo.repositoryId,
        categoryId: category.id,
        title: discussionTitle(),
        body: discussionBody()
      });
      if (result.errors || !result.data || !result.data.createDiscussion) {
        throw new Error('GitHub discussion creation failed');
      }
      const discussion = result.data.createDiscussion.discussion;
      results.discussion = { title: discussion.title, url: discussion.url };
    }
  } catch (error) {
    results.error = 'GitHub publish failed. Check your token and repo permissions.';
  }

  state.githubPublishing = false;
  state.githubPublishResult = results;
  state.boardDirty = true;
  renderAll();
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

function setControlsMenu(open) {
  els.controlsMenu.hidden = !open;
  els.menuButton.setAttribute('aria-expanded', String(open));
}

function renderRecordMode() {
  if (!els.recordModeButton) return;
  const offRecord = state.recordMode === 'off';
  const label = els.recordModeButton.querySelector('.record-mode-label');
  const status = els.recordModeButton.querySelector('.record-mode-status');
  if (label) label.textContent = offRecord ? 'Off the record' : 'On the record';
  if (status) status.textContent = offRecord ? 'Transcript paused' : 'Transcript active';
  els.recordModeButton.setAttribute('aria-pressed', String(offRecord));
  els.recordModeButton.disabled = state.recordModeUpdating;
}

function recordModeSessionId() {
  return currentDashboardSessionId() || (state.zoomSession && state.zoomSession.publicSessionId) || (state.zoomSession && state.zoomSession.id) || '';
}

async function setRecordMode(nextMode) {
  const previousMode = state.recordMode;
  state.recordMode = normalizeRecordMode(nextMode);
  state.recordModeUpdating = true;
  renderRecordMode();

  const sessionId = recordModeSessionId();
  const token = currentDashboardToken() || (state.zoomSession && state.zoomSession.dashboardToken) || '';
  if (!sessionId) {
    state.recordModeUpdating = false;
    renderRecordMode();
    els.meetingStatus.textContent = (state.meetingContext || fakeZoomMeeting).topic + (state.recordMode === 'off'
      ? ' · off the record'
      : ' · on the record');
    return;
  }

  try {
    const response = await fetch('/api/sessions/' + encodeURIComponent(sessionId) + '/record-mode', {
      method: 'POST',
      headers: Object.assign(
        { 'content-type': 'application/json' },
        token ? { 'x-dashboard-token': token } : {}
      ),
      body: JSON.stringify({ recordMode: state.recordMode })
    });
    if (!response.ok) throw new Error('record mode update failed');
    const result = await response.json();
    state.recordMode = normalizeRecordMode(result.recordMode);
    if (state.zoomSession) state.zoomSession.recordMode = state.recordMode;
    els.meetingStatus.textContent = (state.meetingContext || fakeZoomMeeting).topic + (state.recordMode === 'off'
      ? ' · off the record'
      : ' · on the record');
  } catch (error) {
    state.recordMode = previousMode;
    els.meetingStatus.textContent = (state.meetingContext || fakeZoomMeeting).topic + ' · record toggle unavailable';
  } finally {
    state.recordModeUpdating = false;
    renderRecordMode();
  }
}

els.menuButton.addEventListener('click', function(event) {
  event.stopPropagation();
  setControlsMenu(els.controlsMenu.hidden);
});

els.recordModeButton.addEventListener('click', function(event) {
  event.stopPropagation();
  setRecordMode(state.recordMode === 'off' ? 'on' : 'off');
});

els.playButton.addEventListener('click', function() {
  const meeting = state.meetingContext || fakeZoomMeeting;
  state.playing = !state.playing;
  state.lastTick = 0;
  els.playButton.textContent = state.playing ? 'Pause' : 'Start';
  els.meetingStatus.textContent = state.playing ? meeting.topic + ' · live playback' : meeting.topic + ' · paused';
  setControlsMenu(false);
  if (state.playing) requestAnimationFrame(tick);
});

function setTranscriptVisible(visible) {
  state.transcriptVisible = visible;
  els.workspace.classList.toggle('transcript-hidden', !visible);
  els.transcriptHeaderToggle.setAttribute('aria-label', visible ? 'Hide live feed' : 'Show live feed');
  els.transcriptHeaderToggle.setAttribute('title', visible ? 'Hide feed' : 'Show feed');
  els.transcriptHeaderToggle.textContent = visible ? '‹' : '›';
}

els.transcriptHeaderToggle.addEventListener('click', function() {
  setTranscriptVisible(!state.transcriptVisible);
});

els.showFeedButton.addEventListener('click', function() {
  setTranscriptVisible(true);
});

els.resetButton.addEventListener('click', function() {
  resetState();
  renderAll();
  setControlsMenu(false);
});

els.speedSelect.addEventListener('change', function(event) {
  state.speed = Number(event.target.value);
});

els.openDashboardButton.addEventListener('click', openDashboard);
els.copyDashboardButton.addEventListener('click', copyDashboardUrl);
els.shareDashboardButton.addEventListener('click', shareDashboard);
els.retryStreamButton.addEventListener('click', retryLiveMeetingStream);
els.runwayLiveButton.addEventListener('click', function() { goToStep('meeting'); });
els.stepRunway.addEventListener('click', function() { goToStep('runway'); });
els.stepMeeting.addEventListener('click', function() { goToStep('meeting'); });
els.stepRecap.addEventListener('click', function() { goToStep('recap'); });

els.transcriptFile.addEventListener('change', async function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  loadTranscript(text, file.name);
  setControlsMenu(false);
});

document.addEventListener('click', function(event) {
  if (!event.target.closest('.topbar-menu')) {
    setControlsMenu(false);
  }

  const excludeButton = event.target.closest('[data-exclude-type]');
  if (excludeButton) {
    event.preventDefault();
    event.stopPropagation();
    toggleExcludeFromBrief(excludeButton.dataset.excludeType, excludeButton.dataset.excludeId);
    return;
  }

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

els.modalPromoteRisk.addEventListener('click', function() {
  if (!state.openModalItem || state.openModalItem.type !== 'agent') return;
  const agent = state.agents.find(function(a) { return a.id === state.openModalItem.id; });
  if (!agent) return;
  state.risks.unshift({
    id: makeId('risk'),
    title: agent.intervention,
    detail: agent.intervention,
    evidence: agent.evidence,
    transcriptReference: agent.transcriptReference || buildTranscriptReference(agent.evidence, agent.intervention),
    conversation: 'Promoted from agent issue. Ask whether this risk is acceptable, preventable, or something the team should monitor.',
    steps: ['Confirm the risk is accurately described.', 'Assign an owner or mitigation path.', 'Decide whether to log, monitor, or accept the risk.'],
    promotedFromAgentId: agent.id
  });
  state.boardDirty = true;
  markAgent(agent.id, 'dismiss');
});

els.modalPromoteOpenQuestion.addEventListener('click', function() {
  if (!state.openModalItem || state.openModalItem.type !== 'agent') return;
  const agent = state.agents.find(function(a) { return a.id === state.openModalItem.id; });
  if (!agent) return;
  state.risks.unshift({
    id: makeId('risk'),
    title: agent.intervention,
    detail: agent.intervention,
    evidence: agent.evidence,
    transcriptReference: agent.transcriptReference || buildTranscriptReference(agent.evidence, agent.intervention),
    conversation: 'Promoted as an open question. Discuss whether this needs resolution before the group can proceed.',
    steps: ['Confirm the question is accurately stated.', 'Identify who needs to answer it.', 'Decide whether to table, assign, or resolve it now.'],
    promotedFromAgentId: agent.id,
    isOpenQuestion: true
  });
  state.boardDirty = true;
  markAgent(agent.id, 'dismiss');
});

els.copyBriefButton.addEventListener('click', function() {
  const markdown = exportBriefAsMarkdown();
  navigator.clipboard.writeText(markdown).then(function() {
    const original = els.copyBriefButton.textContent;
    els.copyBriefButton.textContent = 'Copied!';
    setTimeout(function() { els.copyBriefButton.textContent = original; }, 1500);
  });
});

els.modalGithubIssues.addEventListener('change', function(event) {
  const cb = event.target.closest('.github-link-checkbox');
  if (!cb) return;
  if (cb.checked) {
    linkItemToGithubIssue(cb.dataset.itemId, cb.dataset.issueNumber);
  } else {
    unlinkItemFromGithubIssue(cb.dataset.itemId);
  }
  if (state.openModalItem) renderModalGithubSection(state.openModalItem.type, state.openModalItem.id);
});

els.modalJiraIssues.addEventListener('change', function(event) {
  const cb = event.target.closest('.jira-link-checkbox');
  if (!cb) return;
  if (cb.checked) {
    linkItemToJiraIssue(cb.dataset.itemId, cb.dataset.issueKey);
  } else {
    unlinkItemFromJiraIssue(cb.dataset.itemId);
  }
  if (state.openModalItem) renderModalJiraSection(state.openModalItem.type, state.openModalItem.id);
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

async function initializeApp() {
  applyMeetingContext(fakeZoomMeeting);
  seedAgendaDecisionCandidates(state.runwayData);
  await loadDashboardSession();
  await maybeInitializeZoomApp();
  await loadAnalysisConfig();
  await loadLlmOutput();
  const sessionId = currentDashboardSessionId();
  if (!document.body.classList.contains('zoom-app-surface') && (!sessionId || sessionId === 'demo-session')) {
    state.demoMode = true;
    document.body.classList.add('demo-mode');
    state.githubToken = 'demo-github-token';
    state.githubConfig = Object.assign({}, demoGithubRepo);
    loadTranscript(demoVtt, 'product-decision-demo.vtt');
    loadRunwayFromAgenda(fakeZoomMeeting);
  } else {
    state.demoMode = false;
    document.body.classList.remove('demo-mode');
  }
  applyMeetingContext(state.meetingContext || fakeZoomMeeting);
  // Ensure runway content and board are rendered even when loadTranscript is skipped (Zoom App mode)
  applySharedDashboardPhase();
  renderAll();
  // Start the runway countdown regardless of whether a transcript was loaded
  startRunwayTimer();
  if (!state.demoMode) startRtmsPolling();
}

initializeApp();
