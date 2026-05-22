const fakeZoomMeeting = {
  topic: 'Product Decision Review',
  meetingId: '843 2219 0042',
  host: 'Maya Patel',
  attendees: ['Maya Patel', 'Jordan Lee'],
  dashboardSlug: '/m/7QK4-MVP',
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

const demoVtt = "WEBVTT\n\nNOTE\nSynthetic transcript fixture for Meeting Decision Maker prototype. No real meeting content.\n\n00:00:02.000 --> 00:00:08.000\nMaya Patel: Let's use this session to decide whether the first prototype should focus on a live meeting board or a post-meeting summary.\n\n00:00:08.500 --> 00:00:15.000\nJordan Lee: I think the live board is the better first bet because it lets us see decisions forming while the conversation is still happening.\n\n00:00:15.500 --> 00:00:22.000\nMaya Patel: The summary is easier to build, though. We could upload a transcript, extract decisions, and avoid the timing problem for now.\n\n00:00:22.500 --> 00:00:31.000\nJordan Lee: True, but if we do that first, we may learn a lot about summarization and not much about whether the shared page changes the meeting behavior.\n\n00:00:31.500 --> 00:00:39.000\nMaya Patel: So the product decision is whether the MVP optimizes for implementation speed or for testing the live facilitation experience.\n\n00:00:39.500 --> 00:00:47.000\nJordan Lee: Exactly. My assumption is that the live facilitation experience is the differentiated part. The decision log is useful, but less novel.\n\n00:00:47.500 --> 00:00:56.000\nMaya Patel: What has to be true for that to work is that a host can actually pay attention to the page while also running the meeting.\n\n00:00:56.500 --> 00:01:04.000\nJordan Lee: That is the biggest risk. Maybe the host needs a very low-friction queue: decisions, risks, and agent hands, nothing else.\n\n00:01:04.500 --> 00:01:13.000\nMaya Patel: Another assumption is that people will tolerate the page being screen-shared. It could feel useful, or it could feel like visual noise.\n\n00:01:13.500 --> 00:01:21.000\nJordan Lee: We can test that with mock transcript playback. If the page gets distracting, we simplify before we touch Zoom RTMS.\n\n00:01:21.500 --> 00:01:31.000\nMaya Patel: If we imagine the live board failing, I think it fails because the agent suggestions arrive too late or are too generic to influence the discussion.\n\n00:01:31.500 --> 00:01:39.000\nJordan Lee: Good point. The warning sign would be the host repeatedly ignoring suggestions or saying the team already covered them.\n\n00:01:39.500 --> 00:01:48.000\nMaya Patel: Then the mitigation is to tune the agents around fewer, higher-quality interventions. We should start with three agents, not a whole library.\n\n00:01:48.500 --> 00:01:57.000\nJordan Lee: Assumptions Challenge, Pre-Mortem, and Argument Dissection feel like the right first three because they map to decisions, plans, and claims.\n\n00:01:57.500 --> 00:02:07.000\nMaya Patel: The argument for the live board is that it creates an observable meeting artifact. What evidence do we have that people want that during the meeting, not after?\n\n00:02:07.500 --> 00:02:15.000\nJordan Lee: Mostly intuition and prior feedback. We should not pretend we know yet. The prototype should test whether it helps the host intervene.\n\n00:02:15.500 --> 00:02:24.000\nMaya Patel: Then let's make the decision lightweight: build the human-shared live board first, support VTT and TXT fixtures, and replay transcripts on a timer.\n\n00:02:24.500 --> 00:02:33.000\nJordan Lee: Agreed. We will keep the post-meeting dashboard, but the first product question is whether live decision support changes the conversation.\n\n00:02:33.500 --> 00:02:42.000\nMaya Patel: Let's capture that as the decision. MVP is a timed mock-transcript live board, shared by the host, with three queued red-team agents.\n\n00:02:42.500 --> 00:02:48.000\nJordan Lee: And the next action is to build the playback loop and agent queue before we worry about Zoom-native integration.\n\n00:02:49.000 --> 00:02:58.000\nMaya Patel: Decision: the transcript rail should be hideable during screen share, because sometimes the board needs to be the main artifact.\n\n00:02:58.500 --> 00:03:07.000\nJordan Lee: Agreed. The assumption is that hosts will want both modes: transcript visible while reviewing evidence, hidden when facilitating the group.\n\n00:03:07.500 --> 00:03:16.000\nMaya Patel: The risk is that hiding the transcript could make the board feel less grounded if people cannot see why a decision appeared.\n\n00:03:16.500 --> 00:03:25.000\nJordan Lee: Then the mitigation is to keep evidence timestamps on each card, even when the transcript panel is hidden.\n\n00:03:25.500 --> 00:03:35.000\nMaya Patel: Decision: clicking any decision, risk, action, or agent issue should open a facilitation modal with suggested next steps.\n\n00:03:35.500 --> 00:03:45.000\nJordan Lee: The argument for that is that the host should not just see an alert; they need help knowing what to say next.\n\n00:03:45.500 --> 00:03:54.000\nMaya Patel: What evidence do we have that hosts will use a modal live rather than just ignore it?\n\n00:03:54.500 --> 00:04:04.000\nJordan Lee: We do not know yet. The prototype should tell us whether the modal is helpful or too much interaction during a meeting.\n\n00:04:04.500 --> 00:04:14.000\nMaya Patel: Decision: risks and actions should be removable with a small x when the host thinks the capture is wrong or not useful.\n\n00:04:14.500 --> 00:04:23.000\nJordan Lee: That creates a failure mode too. If it is too easy to remove things, a host might erase useful dissent too quickly.\n\n00:04:23.500 --> 00:04:32.000\nMaya Patel: The warning sign is if the host removes agent issues before the team has a chance to consider them.\n\n00:04:32.500 --> 00:04:42.000\nJordan Lee: Action: we should eventually track dismissed items so the meeting record can show what was removed and by whom.\n\n00:04:42.500 --> 00:04:52.000\nMaya Patel: Decision: the shared dashboard URL can be open-by-link for the prototype, but it must be hard to guess.\n\n00:04:52.500 --> 00:05:02.000\nJordan Lee: Longer term, the dashboard should support account access through Google or Zoom login before we use this with sensitive meetings.\n\n00:05:02.500 --> 00:05:12.000\nMaya Patel: Decision: keep the full transcript with the meeting record for now, because the evidence matters while we are learning the product shape.\n\n00:05:12.500 --> 00:05:23.000\nJordan Lee: The assumption is that prototype users are comfortable with that retention because they control the uploaded transcript fixtures.\n\n00:05:23.500 --> 00:05:34.000\nMaya Patel: If that assumption is wrong, the product needs retention controls earlier than we planned.\n\n00:05:34.500 --> 00:05:44.000\nJordan Lee: Action: add retention settings to the production-readiness list, but do not block the static prototype on that.\n";

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
  reviewMode: false
};

const els = {
  menuButton: document.querySelector('#menuButton'),
  controlsMenu: document.querySelector('#controlsMenu'),
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
  copyBriefButton: document.querySelector('#copyBriefButton')
};

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
  return {
    topic: topic,
    meetingId: String(meetingId || '').trim(),
    host: context.hostName || context.userName || 'Zoom host',
    attendees: context.userName ? [context.userName] : [],
    dashboardSlug: fakeZoomMeeting.dashboardSlug,
    agenda: agenda
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
      renderRunway();
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
  const isVtt = sourceName.toLowerCase().endsWith('.vtt') || raw.trimStart().startsWith('WEBVTT');
  state.cues = isVtt ? parseVtt(raw) : parseTxt(raw);
  state.duration = Math.max.apply(null, state.cues.map(function(cue) { return cue.end; }).concat([1]));
  resetState(false);
  renderTranscript();
  renderAll();
}

function applyRtmsSessionState(session) {
  if (!session || !Array.isArray(session.transcript)) return;
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
  renderTranscript();
  renderAll();
  clearStreamError();
  els.meetingStatus.textContent = (state.meetingContext || fakeZoomMeeting).topic + ' · live transcript ' + state.cues.length + ' cues';

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
  const candidates = [
    meeting.meetingUuid,
    meeting.meetingId,
    state.zoomSession && state.zoomSession.zoomMeetingUuid,
    state.zoomSession && state.zoomSession.zoomMeetingId,
    currentDashboardSessionId()
  ].filter(Boolean);
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
  renderRunway();
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
  return {
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
  state.boardDirty = true;
  state.decisions.unshift({
    id: makeId('decision'),
    key: key,
    status: decisionStatus,
    suggestedStatus: suggestedStatus,
    title: title,
    detail: detail,
    evidence: evidence,
    transcriptReference: buildTranscriptReference(evidence, options && options.transcriptText ? options.transcriptText : detail),
    conversation: decisionConversation(suggestedStatus),
    steps: decisionSteps(suggestedStatus)
  });
}

function normalizeDecisionStatus(status) {
  if (['forming', 'pending', 'accepted', 'rejected'].includes(status)) return status;
  return 'forming';
}

function decisionConversation(status) {
  if (status === 'forming') {
    return 'Name the decision that appears to be forming and ask what options, tradeoffs, or missing evidence the group needs before it becomes a commitment.';
  }
  if (status === 'accepted') {
    return 'The transcript suggests this decision was accepted. Confirm the wording, owner, and any unresolved assumptions before relying on it later.';
  }
  return 'Name the pending decision out loud and ask whether the room accepts, rejects, or needs to revise it before it becomes part of the meeting record.';
}

function decisionSteps(status) {
  if (status === 'forming') {
    return ['Clarify the decision question.', 'Name the options still in play.', 'Ask what evidence or objection would change the direction.'];
  }
  if (status === 'accepted') {
    return ['Confirm the exact commitment.', 'Capture owner or review point.', 'Log unresolved assumptions as risks if needed.'];
  }
  return ['Confirm the exact commitment.', 'Ask for blocking objections or missing evidence.', 'Accept or reject the decision from this modal.'];
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

function toggleExcludeFromBrief(type, id) {
  const item = findBoardItem(type, id);
  if (!item) return;
  item.excludedFromBrief = !item.excludedFromBrief;
  state.boardDirty = true;
  renderAll();
}

// --- BRIEF ---

function briefItems() {
  const meeting = state.meetingContext || fakeZoomMeeting;
  return {
    topic: meeting.topic || 'Meeting',
    decisions: state.decisions.filter(function(d) { return !d.excludedFromBrief; }),
    actions: state.actions.filter(function(a) { return !a.excludedFromBrief; }),
    risks: state.risks.filter(function(r) { return !r.excludedFromBrief && !r.isOpenQuestion; }),
    openQuestions: state.risks.filter(function(r) { return !r.excludedFromBrief && r.isOpenQuestion; })
  };
}

function renderBriefPanel() {
  const items = briefItems();
  const sections = [];

  if (items.decisions.length) {
    sections.push('<div class="brief-section">' +
      '<h4>Decisions</h4><ul>' +
      items.decisions.map(function(d) {
        return '<li><strong>' + escapeHtml(d.title) + '</strong>' +
          (d.detail ? ' — ' + escapeHtml(d.detail) : '') + '</li>';
      }).join('') +
      '</ul></div>');
  }
  if (items.actions.length) {
    sections.push('<div class="brief-section">' +
      '<h4>Actions</h4><ul>' +
      items.actions.map(function(a) {
        return '<li><strong>' + escapeHtml(a.title) + '</strong>' +
          (a.detail ? ' — ' + escapeHtml(a.detail) : '') + '</li>';
      }).join('') +
      '</ul></div>');
  }
  if (items.risks.length) {
    sections.push('<div class="brief-section">' +
      '<h4>Risks &amp; Watchpoints</h4><ul>' +
      items.risks.map(function(r) {
        return '<li><strong>' + escapeHtml(r.title) + '</strong>' +
          (r.detail ? ' — ' + escapeHtml(r.detail) : '') + '</li>';
      }).join('') +
      '</ul></div>');
  }
  if (items.openQuestions.length) {
    sections.push('<div class="brief-section">' +
      '<h4>Open Questions</h4><ul>' +
      items.openQuestions.map(function(q) {
        return '<li><strong>' + escapeHtml(q.title) + '</strong>' +
          (q.detail ? ' — ' + escapeHtml(q.detail) : '') + '</li>';
      }).join('') +
      '</ul></div>');
  }

  els.briefContent.innerHTML = sections.length
    ? sections.join('')
    : '<p class="brief-empty">No items included. Use the board above to accept decisions or promote agent issues, then exclude anything that should not appear here.</p>';
}

function exportBriefAsMarkdown() {
  const items = briefItems();
  const lines = ['# Meeting Brief — ' + items.topic, ''];

  function appendSection(heading, list) {
    if (!list.length) return;
    lines.push('## ' + heading, '');
    list.forEach(function(item) {
      lines.push('- **' + item.title + '**' + (item.detail ? ': ' + item.detail : ''));
    });
    lines.push('');
  }

  appendSection('Decisions', items.decisions);
  appendSection('Actions', items.actions);
  appendSection('Risks & Watchpoints', items.risks);
  appendSection('Open Questions', items.openQuestions);

  return lines.join('\n').trim();
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

els.menuButton.addEventListener('click', function(event) {
  event.stopPropagation();
  setControlsMenu(els.controlsMenu.hidden);
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
  await loadDashboardSession();
  await maybeInitializeZoomApp();
  await loadAnalysisConfig();
  await loadLlmOutput();
  const sessionId = currentDashboardSessionId();
  if (!document.body.classList.contains('zoom-app-surface') && (!sessionId || sessionId === 'demo-session')) {
    state.demoMode = true;
    document.body.classList.add('demo-mode');
    loadTranscript(demoVtt, 'product-decision-demo.vtt');
    loadRunwayFromAgenda(fakeZoomMeeting);
  } else {
    state.demoMode = false;
    document.body.classList.remove('demo-mode');
  }
  applyMeetingContext(state.meetingContext || fakeZoomMeeting);
  // Ensure runway content and board are rendered even when loadTranscript is skipped (Zoom App mode)
  renderAll();
  // Start the runway countdown regardless of whether a transcript was loaded
  startRunwayTimer();
  startRtmsPolling();
}

initializeApp();
