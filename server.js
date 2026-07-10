import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';
import { Firestore } from '@google-cloud/firestore';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 8787);
const sessions = new Map();
const meetingOutputs = new Map();
const oauthInstallations = new Map();
const zoomLoginStates = new Map();
const useFirestore = process.env.SESSION_STORE === 'firestore';
const firestore = useFirestore ? new Firestore() : null;
const sessionsCollection = process.env.FIRESTORE_SESSIONS_COLLECTION || 'meetingSessions';
const meetingOutputsCollection = process.env.FIRESTORE_MEETING_OUTPUTS_COLLECTION || 'meetingOutputs';
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const openaiApiKey = process.env.OPENAI_API_KEY || '';
const openaiModel = process.env.OPENAI_MODEL || 'gpt-5.4';
const githubClientId = process.env.GITHUB_CLIENT_ID || '';
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET || '';
const atlassianClientId = process.env.ATLASSIAN_CLIENT_ID || '';
const atlassianClientSecret = process.env.ATLASSIAN_CLIENT_SECRET || '';
const openaiReasoningEffort = process.env.OPENAI_REASONING_EFFORT || 'low';
const llmProvider = normalizeProvider(process.env.LLM_PROVIDER || 'gemini');
const publicBaseUrl = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
const zoomWebhookMaxAgeMs = Number(process.env.ZOOM_WEBHOOK_MAX_AGE_MS || 5 * 60 * 1000);
let skillPromptCache = null;
const rtmsClients = new Map();
const rtmsSessionStates = new Map();
const rateLimitBuckets = new Map();
let rtmsModulePromise = null;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.vtt': 'text/vtt; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

const securityHeaders = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'content-security-policy': [
    "default-src 'self'",
    "script-src 'self' https://appssdk.zoom.us",
    "style-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'self' https://*.zoom.us https://*.zoom.com"
  ].join('; '),
  'referrer-policy': 'strict-origin-when-cross-origin'
};

function requestHost(req) {
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  return forwardedHost || req.headers.host || 'localhost';
}

function requestProto(req) {
  return String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
}

function withSecurityHeaders(headers = {}) {
  return { ...securityHeaders, ...headers };
}

// OAuth callback pages need 'unsafe-inline' for the postMessage + window.close()
// script. Scope the relaxed CSP to only these pages rather than the global policy.
const oauthCallbackSecurityHeaders = {
  ...securityHeaders,
  'content-security-policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join('; ')
};

function sendOAuthHtml(res, status, body) {
  res.writeHead(status, { ...oauthCallbackSecurityHeaders, 'content-type': 'text/html; charset=utf-8' });
  res.end(body);
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, withSecurityHeaders({
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload)
  }));
  res.end(payload);
}

function sendText(res, status, body) {
  res.writeHead(status, withSecurityHeaders({ 'content-type': 'text/plain; charset=utf-8' }));
  res.end(body);
}

function sendHtml(res, status, body) {
  res.writeHead(status, withSecurityHeaders({ 'content-type': 'text/html; charset=utf-8' }));
  res.end(body);
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

function publicErrorMessage(_error, fallback) {
  return fallback;
}

function appUrl(req, path) {
  if (publicBaseUrl) return `${publicBaseUrl}${path}`;
  const proto = requestProto(req);
  const host = requestHost(req);
  return `${proto}://${host}${path}`;
}

function canonicalRedirectUrl(req) {
  if (!publicBaseUrl) return null;
  const canonical = new URL(publicBaseUrl);
  const host = requestHost(req).toLowerCase();
  const hostname = host.split(':')[0];
  const proto = requestProto(req);
  const shouldRedirect = hostname === `www.${canonical.hostname}` || proto === 'http';
  if (!shouldRedirect) return null;

  const target = new URL(req.url || '/', publicBaseUrl);
  target.protocol = canonical.protocol;
  target.host = canonical.host;
  return target.toString();
}

function sendRedirect(res, location, status = 301) {
  res.writeHead(status, withSecurityHeaders({ location }));
  res.end();
}

function parseCookies(req) {
  const header = String(req.headers.cookie || '');
  return header.split(';').reduce(function(cookies, part) {
    const index = part.indexOf('=');
    if (index < 0) return cookies;
    const key = part.slice(0, index).trim();
    if (!key) return cookies;
    cookies[key] = decodeURIComponent(part.slice(index + 1).trim());
    return cookies;
  }, {});
}

function signCookiePayload(payload) {
  const secret = process.env.COOKIE_SIGNING_SECRET || process.env.ROOM_CLARITY_ADMIN_TOKEN || process.env.ZOOM_WEBHOOK_SECRET_TOKEN || '';
  if (!secret) return '';
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function encodeSignedCookie(value) {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  const signature = signCookiePayload(payload);
  return signature ? `${payload}.${signature}` : '';
}

function decodeSignedCookie(rawValue) {
  const [payload, signature] = String(rawValue || '').split('.');
  if (!payload || !signature) return null;
  const expected = signCookiePayload(payload);
  if (!expected) return null;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (value.expiresAt && Number(value.expiresAt) < Date.now()) return null;
    return value;
  } catch (_error) {
    return null;
  }
}

function cookieSecurityAttributes(req) {
  return requestProto(req) === 'https' || publicBaseUrl.startsWith('https://') ? '; Secure' : '';
}

function setZoomUserCookie(req, res, user) {
  const cookie = encodeSignedCookie(Object.assign({}, user, {
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  }));
  if (!cookie) return;
  res.setHeader('set-cookie', `rc_zoom_user=${encodeURIComponent(cookie)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${cookieSecurityAttributes(req)}`);
}

function clearZoomUserCookie(req, res) {
  res.setHeader('set-cookie', `rc_zoom_user=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${cookieSecurityAttributes(req)}`);
}

function zoomUserFromRequest(req) {
  return decodeSignedCookie(parseCookies(req).rc_zoom_user);
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(req, key, options = {}) {
  const limit = Number(options.limit || 60);
  const windowMs = Number(options.windowMs || 60_000);
  const now = Date.now();
  const bucketKey = [key, clientIp(req)].join(':');
  const bucket = rateLimitBuckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  bucket.count += 1;
  if (bucket.count <= limit) return { allowed: true };
  return {
    allowed: false,
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
  };
}

function sendRateLimited(res, check) {
  sendJson(res, 429, {
    error: 'Too many requests',
    retryAfter: check.retryAfter
  });
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) {
      throw new Error('Request body too large');
    }
  }
  return body ? JSON.parse(body) : {};
}

async function readRawBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) {
      throw new Error('Request body too large');
    }
  }
  return body;
}

async function loadSkillPrompts() {
  if (skillPromptCache) return skillPromptCache;

  const manifestPath = join(rootDir, 'skills', 'manifest.yaml');
  const manifest = await readFile(manifestPath, 'utf8');
  const skillFiles = manifest
    .split('\n')
    .map(function(line) {
      const match = line.match(/skill_file:\s*(.+)$/);
      return match ? match[1].trim() : '';
    })
    .filter(Boolean);

  const prompts = await Promise.all(skillFiles.map(async function(relativePath) {
    const skillPath = join(dirname(manifestPath), normalize(relativePath));
    const skillText = await readFile(skillPath, 'utf8');
    return {
      id: dirname(relativePath).replace(/^\.\//, ''),
      path: relativePath,
      instructions: skillText
    };
  }));

  const referenceFiles = [
    'references/chris-butler-decision-principles.md',
    'references/decision-bias-checks.md'
  ];
  const references = await Promise.all(referenceFiles.map(async function(relativePath) {
    const referencePath = join(dirname(manifestPath), relativePath);
    const referenceText = await readFile(referencePath, 'utf8');
    return {
      id: relativePath.replace(/\.md$/, ''),
      path: relativePath,
      instructions: referenceText
    };
  }));

  skillPromptCache = {
    source: 'skills/manifest.yaml',
    prompts,
    references
  };
  return skillPromptCache;
}

function normalizeProvider(provider) {
  return provider === 'openai' ? 'openai' : 'gemini';
}

function defaultModelForProvider(provider) {
  return provider === 'openai' ? openaiModel : geminiModel;
}

function parseAnalysisModelSpec(modelSpec) {
  const raw = String(modelSpec || '').trim();
  if (raw.includes(':')) {
    const separator = raw.indexOf(':');
    const provider = normalizeProvider(raw.slice(0, separator));
    const model = raw.slice(separator + 1).trim() || defaultModelForProvider(provider);
    return { provider, model };
  }
  if (raw && /^gpt-|^o[0-9]/i.test(raw)) {
    return { provider: 'openai', model: raw };
  }
  const provider = llmProvider;
  return {
    provider,
    model: raw || defaultModelForProvider(provider)
  };
}

function analysisEnabled(provider = llmProvider) {
  return normalizeProvider(provider) === 'openai' ? Boolean(openaiApiKey) : Boolean(geminiApiKey);
}

function cleanAnalysisItem(item) {
  const allowedTypes = new Set(['decision', 'risk', 'action', 'agent_issue']);
  const allowedAgents = new Set(['Assumptions Challenge', 'Pre-Mortem', 'Argument Dissection', 'Facilitator']);
  const allowedPriorities = new Set(['low', 'medium', 'high']);
  const allowedStatuses = new Set(['forming', 'pending', 'accepted', 'rejected']);
  const type = allowedTypes.has(item.type) ? item.type : '';
  if (!type || !item.title || !item.summary) return null;

  const clean = {
    type,
    title: String(item.title).slice(0, 90),
    summary: String(item.summary).slice(0, 320)
  };

  if (allowedStatuses.has(item.status)) clean.status = item.status;
  if (['create', 'update'].includes(item.updateMode)) clean.updateMode = item.updateMode;
  if (item.targetId) clean.targetId = String(item.targetId).slice(0, 120);
  if (type === 'agent_issue') {
    clean.agent = allowedAgents.has(item.agent) ? item.agent : 'Assumptions Challenge';
    clean.priority = allowedPriorities.has(item.priority) ? item.priority : 'medium';
  }
  return clean;
}

function emptyMeetingState() {
  return {
    decisions: [],
    risks: [],
    actions: [],
    openAgentIssues: [],
    dismissedItems: []
  };
}

function serverMeetingStateForAnalysis(state) {
  return {
    decisions: state.decisions.slice(0, 8).map(function(item) {
      return {
        id: item.id,
        title: item.title,
        status: item.status,
        summary: item.summary,
        evidence: item.evidence
      };
    }),
    risks: state.risks.slice(0, 8).map(function(item) {
      return {
        id: item.id,
        title: item.title,
        summary: item.summary,
        evidence: item.evidence
      };
    }),
    actions: state.actions.slice(0, 8).map(function(item) {
      return {
        id: item.id,
        title: item.title,
        summary: item.summary,
        evidence: item.evidence
      };
    }),
    openAgentIssues: state.openAgentIssues.slice(0, 8).map(function(item) {
      return {
        id: item.id,
        agent: item.agent,
        priority: item.priority,
        summary: item.summary,
        evidence: item.evidence
      };
    })
  };
}

function applyServerAnalysisItems(state, items, cue) {
  items.forEach(function(item) {
    if (item.type === 'decision' && isWeakPreferenceDecision(item, cue, state)) return;
    if (findRelatedDismissedItem(state.dismissedItems, item)) return;
    if (item.updateMode === 'update' && updateServerBoardItem(state, item, cue)) return;
    if (item.type === 'decision') {
      const relatedDecision = findRelatedDecision(state.decisions, item);
      if (relatedDecision && mergeServerDecision(relatedDecision, item, cue)) return;
    }
    if (item.type === 'agent_issue') {
      const relatedAgentIssue = findRelatedAgentIssue(state.openAgentIssues, item);
      if (relatedAgentIssue && mergeServerAgentIssue(relatedAgentIssue, item, cue)) return;
    }
    const record = {
      id: randomUUID(),
      title: item.title,
      summary: item.summary,
      evidence: cue.evidence,
      cueId: cue.id,
      updatedAt: new Date().toISOString()
    };

    if (item.type === 'decision') {
      state.decisions.unshift(Object.assign(record, { status: item.status || 'forming' }));
    }
    if (item.type === 'risk') state.risks.unshift(record);
    if (item.type === 'action') state.actions.unshift(record);
    if (item.type === 'agent_issue') {
      state.openAgentIssues.unshift(Object.assign(record, {
        agent: item.agent,
        priority: item.priority || 'medium',
        status: 'open'
      }));
    }
  });
}

function mergeServerDecision(existing, item, cue) {
  existing.title = item.title || existing.title;
  existing.summary = conciseBoardSummary(item.summary || existing.summary);
  existing.evidence = cue.evidence;
  existing.cueId = cue.id;
  existing.updatedAt = new Date().toISOString();
  applyDecisionStatus(existing, item.status);
  return true;
}

function updateServerBoardItem(state, item, cue) {
  const existing = findServerBoardItem(state, item);
  if (!existing) return false;
  existing.title = item.title || existing.title;
  existing.summary = conciseBoardSummary(item.summary || existing.summary);
  existing.evidence = cue.evidence;
  existing.cueId = cue.id;
  existing.updatedAt = new Date().toISOString();
  if (item.status && item.type === 'decision') applyDecisionStatus(existing, item.status);
  if (item.priority && item.type === 'agent_issue') existing.priority = item.priority;
  return true;
}

function mergeServerAgentIssue(existing, item, cue) {
  existing.title = item.title || existing.title;
  existing.summary = conciseBoardSummary(item.summary || existing.summary);
  existing.evidence = cue.evidence;
  existing.cueId = cue.id;
  existing.updatedAt = new Date().toISOString();
  if (item.agent) existing.agent = item.agent;
  if (item.priority) existing.priority = item.priority;
  return true;
}

function applyDecisionStatus(existing, nextStatus) {
  if (!nextStatus) return;
  const rank = { forming: 0, pending: 1, accepted: 2, rejected: 2 };
  const current = existing.status || 'forming';
  if (!(nextStatus in rank)) return;
  if (nextStatus === 'rejected') {
    existing.status = 'rejected';
    return;
  }
  if (current === 'rejected') return;
  if (rank[nextStatus] >= rank[current]) existing.status = nextStatus;
}

function conciseBoardSummary(summary) {
  const text = String(summary || '').replace(/\s+/g, ' ').trim();
  const words = text.split(/\s+/);
  if (words.length <= 42) return text;
  return words.slice(0, 42).join(' ').replace(/[,:;]$/, '') + '...';
}

function findServerBoardItem(state, item) {
  const lists = {
    decision: state.decisions,
    risk: state.risks,
    action: state.actions,
    agent_issue: state.openAgentIssues
  };
  const list = lists[item.type] || [];
  if (item.targetId) {
    const direct = list.find(function(record) { return record.id === item.targetId; });
    if (direct) return direct;
  }
  const title = String(item.title || '').toLowerCase();
  if (!title) return null;
  const exact = list.find(function(record) { return record.title.toLowerCase() === title; });
  if (exact) return exact;
  if (item.type === 'decision') return findRelatedDecision(list, item);
  if (item.type === 'agent_issue') return findRelatedAgentIssue(list, item);
  return null;
}

function findRelatedDecision(decisions, item) {
  const candidate = [item.title, item.summary].filter(Boolean).join(' ');
  if (!candidate) return null;
  return decisions.find(function(decision) {
    const existing = [decision.title, decision.summary].filter(Boolean).join(' ');
    if (hasDistinctDecisionObject(candidate, existing)) return false;
    return sameDecisionObject(candidate, existing) || topicSimilarity(candidate, existing) >= 0.74;
  }) || null;
}

function findRelatedAgentIssue(agentIssues, item) {
  const candidate = [item.agent, item.title, item.summary].filter(Boolean).join(' ');
  if (!candidate) return null;
  return agentIssues.find(function(issue) {
    const existing = [issue.agent, issue.title, issue.summary].filter(Boolean).join(' ');
    return topicSimilarity(candidate, existing) >= 0.58;
  }) || null;
}

function findRelatedDismissedItem(dismissedItems, item) {
  const items = Array.isArray(dismissedItems) ? dismissedItems : [];
  const type = item.type === 'agent_issue' ? 'agent' : item.type;
  const candidate = [item.title, item.summary].filter(Boolean).join(' ');
  if (!type || !candidate) return null;
  return items.find(function(dismissed) {
    if (dismissed.type !== type) return false;
    const existing = [dismissed.title, dismissed.summary].filter(Boolean).join(' ');
    return topicSimilarity(candidate, existing) >= 0.7;
  }) || null;
}

function applyDismissedItemsToRtmsState(state, dismissedItems) {
  const dismissed = Array.isArray(dismissedItems) ? dismissedItems : [];
  if (!dismissed.length) return;
  state.dismissedItems = dismissed.slice(0, 100);
  const lists = [
    ['decision', 'decisions'],
    ['risk', 'risks'],
    ['action', 'actions'],
    ['agent', 'openAgentIssues']
  ];
  lists.forEach(function(entry) {
    const [type, key] = entry;
    state[key] = state[key].filter(function(item) {
      return !dismissed.some(function(record) {
        if (record.type !== type) return false;
        if (record.originalId && record.originalId === item.id) return true;
        return Boolean(findRelatedDismissedItem([record], {
          type: type === 'agent' ? 'agent_issue' : type,
          title: item.title,
          summary: item.summary
        }));
      });
    });
  });
}

function hasDistinctDecisionObject(candidate, existing) {
  const candidateNouns = decisionObjectWords(candidate);
  const existingNouns = decisionObjectWords(existing);
  if (!candidateNouns.size || !existingNouns.size) return false;
  const overlapCount = [...candidateNouns].filter(function(word) { return existingNouns.has(word); }).length;
  if (overlapCount >= 2 || (overlapCount === 1 && Math.min(candidateNouns.size, existingNouns.size) <= 2)) return false;
  const candidateText = String(candidate || '').toLowerCase();
  const existingText = String(existing || '').toLowerCase();
  return /\b(decision|decide|choose|choosing|accepted|forming|pending)\b/.test(candidateText + ' ' + existingText);
}

function decisionObjectWords(text) {
  const generic = new Set([
    'accepted', 'agreement', 'candidate', 'choose', 'choosing', 'commitment', 'decide',
    'decision', 'direction', 'discourse', 'forming', 'group', 'meeting', 'option',
    'pending', 'people', 'proposal', 'question', 'scope', 'team', 'tradeoff', 'user',
    'users'
  ]);
  return new Set(topicWords(text).filter(function(word) { return !generic.has(word); }));
}

function sameDecisionObject(candidate, existing) {
  const candidateNouns = decisionObjectWords(candidate);
  const existingNouns = decisionObjectWords(existing);
  if (!candidateNouns.size || !existingNouns.size) return false;
  const overlapCount = [...candidateNouns].filter(function(word) { return existingNouns.has(word); }).length;
  const smallerSize = Math.min(candidateNouns.size, existingNouns.size);
  return overlapCount >= 2 && overlapCount / smallerSize >= 0.5;
}

function isWeakPreferenceDecision(item, cue, state) {
  const decisions = Array.isArray(state.decisions) ? state.decisions : [];
  if (item.updateMode === 'update') {
    const hasTarget = item.targetId && decisions.some(function(decision) { return decision.id === item.targetId; });
    if (hasTarget) return false;
  }
  const text = String(cue && cue.text || '').toLowerCase();
  const candidate = [item.title, item.summary].filter(Boolean).join(' ').toLowerCase();
  const hasExistingDecision = decisions.some(function(decision) {
    return topicSimilarity(candidate, [decision.title, decision.summary].filter(Boolean).join(' ').toLowerCase()) >= 0.62;
  });
  if (hasExistingDecision) return false;
  const preferenceSignal = /\b(i think|i want|i would|my preference|i prefer|i just|i really|feels cleaner|feel cleaner)\b/.test(text);
  const evidenceChallenge = /\b(preference right now|not compared|what evidence|collect measurements|before deciding|not asking for approval|park|pending evidence)\b/.test(text);
  const decisionFrame = /\b(decision is|decision might be|need to decide|decide whether|whether we|whether the|tradeoff|options?|agreed|decision:|we decided|let's decide|not ready to choose)\b/.test(text);
  const groupCommitment = /\b(agreed|we decided|decision:|let's do|we will|we won't|approved|committed)\b/.test(text);
  const preferenceCandidate = /\b(preference|dislike|rewrite|new framework|cleaner|component patterns)\b/.test(candidate);
  return ((preferenceSignal && !decisionFrame) || (evidenceChallenge && preferenceCandidate)) && !groupCommitment && item.status !== 'accepted';
}

function topicSimilarity(left, right) {
  const leftWords = new Set(topicWords(left));
  const rightWords = new Set(topicWords(right));
  if (!leftWords.size || !rightWords.size) return 0;
  const intersection = [...leftWords].filter(function(word) { return rightWords.has(word); }).length;
  return intersection / Math.min(leftWords.size, rightWords.size);
}

function topicWords(text) {
  const stopWords = new Set([
    'about', 'after', 'against', 'also', 'and', 'are', 'because', 'between', 'can',
    'could', 'decision', 'decide', 'for', 'first', 'focus', 'from', 'has', 'have',
    'into', 'meeting', 'need', 'not', 'our', 'should', 'that', 'the', 'their',
    'there', 'they', 'this', 'trace', 'whether', 'while', 'who', 'with', 'would'
  ]);
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(function(word) { return word.length > 2 && !stopWords.has(word); });
}

function parseModelJson(text) {
  const trimmed = String(text || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(trimmed || '{}');
}

function buildAnalysisPrompt(input, skillSet) {
  const cue = input.cue || {};
  const transcriptWindow = Array.isArray(input.transcriptWindow) ? input.transcriptWindow.slice(-12) : [];
  const meetingState = input.meetingState || {};
  const skillInstructions = skillSet.prompts.map(function(skill) {
    return '## ' + skill.id + '\n' + skill.instructions.slice(0, 5000);
  }).join('\n\n');
  const sharedReferences = (skillSet.references || []).map(function(reference) {
    return '## ' + reference.id + '\n' + reference.instructions.slice(0, 3500);
  }).join('\n\n');

  return [
    'You are the analysis worker for Meeting Decision Maker.',
    'Use the loaded meeting skills to analyze one live meeting feed cue. The cue may come from spoken transcript or Zoom meeting chat.',
    'Return only JSON with this shape: {"items":[{"type":"decision|risk|action|agent_issue","updateMode":"create|update","targetId":"existing item id when updating","title":"short title","summary":"short board-ready summary","status":"forming|pending|accepted|rejected","agent":"Assumptions Challenge|Pre-Mortem|Argument Dissection|Facilitator","priority":"low|medium|high"}]}.',
    'Rules: emit no more than 2 non-action items (decisions, risks, agent_issues); actions are not capped — emit as many actions as the cue warrants; prefer no item over weak speculation for decisions and risks; actions do not require the same confidence bar — if it sounds like future work, emit it; preserve uncertainty; do not invent owners or agreement; for agent_issue items include agent and priority.',
    'Operational priority: extract durable meeting artifacts first. Do not let agent_issue selectivity suppress real decisions, risks, or actions.',
    'Decision status rules: use "forming" when a real decision topic, tradeoff, option set, or decision question is being discussed but the group has not committed. A forming decision with disagreement or missing evidence must say there is no consensus yet in the summary. Use "pending" when there is a concrete proposed decision ready for host confirmation. Use "accepted" only when the transcript contains explicit agreement or decision language. Never move an accepted decision back to forming or pending unless the transcript explicitly corrects the record.',
    'Preference-as-decision guardrail: one person saying "I think", "I want", "my preference", or naming a disliked implementation is not enough to create a decision. If others challenge the evidence, ask for measurements, or say they are not asking for approval, treat it as discourse, risk, or an agent_issue until the transcript frames a decision question or option tradeoff.',
    'Use Current meeting state before creating new items. If the latest cue continues the same decision question, return updateMode "update" with that item targetId. Update summaries should be the current best concise state, not a running log of the conversation. Create a new decision when the cue introduces a distinct decision object, surface, feature, policy, access choice, retention choice, or interaction pattern, even if it belongs under the same product area.',
    'Do not create separate decision items for each side of the same tradeoff. Keep one forming decision topic and update it as the conversation evolves. Do not let a broad parent decision absorb later distinct implementation decisions. Do not emit a risk just because the cue names uncertainty; emit a risk only when there is a plausible negative outcome, dependency, blocker, mitigation, warning sign, cognitive/social bias, or option-value loss. Do not emit an item on every cue.',
    'Risk rules: if a cue names a concrete downside, failure path, blocker, stakeholder concern, mitigation, warning sign, or option-value loss, emit or update a risk even if an agent_issue would also be useful. Risk cards are durable artifacts; agent_issue cards are live facilitation nudges.',
    'Agent issue rules: throttle only agent_issue items. Do not emit an agent_issue simply because a skill could comment. Emit one only when the host could use it immediately to improve the decision discourse, expose a central assumption, name a major failure path, or challenge weak evidence. If the same concern repeats, update the existing open agent_issue instead of creating another.',
    'Agent trigger rules: when the cue says "what has to be true", "my assumption is", or names an important untested assumption, consider an Assumptions Challenge issue. When the cue says "if we imagine this failing", "fails because", "warning sign", or names a serious failure path, consider a Pre-Mortem issue. When the cue asks "what evidence do we have", distinguishes intuition from evidence, or challenges rationale quality, consider an Argument Dissection issue. When the cue suggests agenda drift, a timebox is expiring, or the room needs opening/closing process help, consider a Facilitator issue. Emit at most one agent_issue for a cue.',
    'Action rules: err on the side of emitting actions. Emit an action whenever a cue points toward future work — this includes explicit commits ("I will", "I\'ll", "we\'ll", "let me", "I\'ll send"), accepted proposals ("yeah let\'s do that", "sounds good", "absolutely"), requests or offers ("can you", "would you be able to", "I\'d be happy to"), and any statement that implies someone might follow up after the meeting (checking something, scheduling a call, sharing materials, looping someone in, looking something up). You do not need a named owner or due date — if it sounds like future work that a participant might do, capture it. Prefer a slightly too-broad action over a missed one. Only skip if the cue is pure reflection, storytelling about the past, or purely hypothetical with no real intent.',
    '',
    '# Skill instructions',
    skillInstructions,
    '',
    '# Shared decision references',
    sharedReferences,
    '',
    '# Current cue',
    JSON.stringify(cue, null, 2),
    '',
    '# Recent meeting feed window',
    JSON.stringify(transcriptWindow, null, 2),
    '',
    '# Current meeting state',
    JSON.stringify(meetingState, null, 2)
  ].join('\n');
}

function buildGeminiRequest(input, skillSet) {
  return {
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: buildAnalysisPrompt(input, skillSet)
          }
        ]
      }
    ]
  };
}

function buildOpenAIRequest(input, skillSet, model) {
  return {
    model,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: buildAnalysisPrompt(input, skillSet)
          }
        ]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'meeting_analysis',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            items: {
              type: 'array',
              maxItems: 2,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  type: { type: 'string', enum: ['decision', 'risk', 'action', 'agent_issue'] },
                  updateMode: { type: 'string', enum: ['create', 'update'] },
                  targetId: { type: 'string' },
                  title: { type: 'string' },
                  summary: { type: 'string' },
                  status: { type: 'string', enum: ['forming', 'pending', 'accepted', 'rejected'] },
                  agent: { type: 'string', enum: ['', 'Assumptions Challenge', 'Pre-Mortem', 'Argument Dissection', 'Facilitator'] },
                  priority: { type: 'string', enum: ['', 'low', 'medium', 'high'] }
                },
                required: ['type', 'updateMode', 'targetId', 'title', 'summary', 'status', 'agent', 'priority']
              }
            }
          },
          required: ['items']
        }
      }
    },
    reasoning: {
      effort: openaiReasoningEffort
    },
    store: false
  };
}

async function analyzeCueWithProvider(input) {
  input = input || {};
  const modelSpec = parseAnalysisModelSpec(input.model);
  if (!analysisEnabled(modelSpec.provider)) {
    const providerLabel = modelSpec.provider === 'openai' ? 'OpenAI' : 'Gemini';
    const envName = modelSpec.provider === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY';
    const error = new Error(`${providerLabel} analysis is not configured. Set ${envName}.`);
    error.status = 503;
    error.provider = modelSpec.provider;
    error.model = modelSpec.model;
    throw error;
  }

  const skillSet = await loadSkillPrompts();
  const provider = modelSpec.provider;
  const model = modelSpec.model;
  const response = provider === 'openai'
    ? await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'authorization': 'Bearer ' + openaiApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(buildOpenAIRequest(input, skillSet, model))
    })
    : await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(geminiApiKey), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(buildGeminiRequest(input, skillSet))
  });
  const body = await response.json().catch(function() { return {}; });
  if (!response.ok) {
    const message = body.error && body.error.message ? body.error.message : `${provider} analysis request failed`;
    const error = new Error(message);
    error.status = 502;
    error.details = body;
    error.provider = provider;
    error.model = model;
    throw error;
  }

  const text = provider === 'openai' ? openaiResponseText(body) : geminiResponseText(body);
  const parsed = parseModelJson(text);
  const items = Array.isArray(parsed.items) ? parsed.items.map(cleanAnalysisItem).filter(Boolean) : [];
  const reconciledItems = reconcileAnalysisItems(items, input.meetingState || {})
    .filter(Boolean)
    .filter(function(item) { return !isWeakPreferenceDecision(item, input.cue || {}, input.meetingState || emptyMeetingState()); });
  return {
    source: provider,
    model,
    skillSource: skillSet.source,
    at: Number(input.cue && input.cue.start) || 0,
    items: addExplicitCueItems(input, reconciledItems)
  };
}

async function analyzeCueWithGemini(input) {
  return analyzeCueWithProvider(Object.assign({}, input, {
    model: input && input.model ? input.model : `gemini:${geminiModel}`
  }));
}

function buildRunwayPrompt(input) {
  const topic = String(input.topic || 'Meeting').slice(0, 300);
  const agenda = String(input.agenda || '').slice(0, 2000);
  const participants = Array.isArray(input.participants) ? input.participants.slice(0, 20).join(', ') : '';
  const host = String(input.host || '').slice(0, 100);

  return [
    'You are a meeting facilitator. Parse the meeting information below into structured start-board content for a live meeting board.',
    'Return only valid JSON with this exact shape:',
    '{"title":"concise 8-12 word provocation title","purpose":"one sentence: why this meeting exists and what it must produce","agendaTitle":"Agenda","agendaItems":[{"title":"item title","owner":"name or null","timeBudget":minutes_integer_or_null,"desiredOutcome":"concrete result the group should have after this item"}],"decisionFrame":{"mode":"Decide|Align|Explore|Update|Review","owner":"name or null","successCondition":"one sentence: what must be true at end of meeting"},"participationNorm":"one short sentence to prevent false consensus","openingPrompt":"one host-sayable opening question"}',
    'Rules: 3-5 agenda items; do not invent owners or timings not supported by the text; desired outcomes must be concrete; opening prompt must be a single sentence the host could say aloud; return only JSON.',
    '',
    'Meeting topic: ' + topic,
    'Host: ' + (host || 'not specified'),
    'Participants: ' + (participants || 'not specified'),
    'Agenda / description:',
    agenda || '(none provided)'
  ].join('\n');
}

function buildGeminiRunwayRequest(input) {
  return {
    generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
    contents: [{ role: 'user', parts: [{ text: buildRunwayPrompt(input) }] }]
  };
}

function buildOpenAIRunwayRequest(input, model) {
  return {
    model,
    input: [{ role: 'user', content: [{ type: 'input_text', text: buildRunwayPrompt(input) }] }],
    text: { format: { type: 'json_object' } },
    reasoning: { effort: openaiReasoningEffort },
    store: false
  };
}

function cleanRunwayResponse(parsed) {
  const allowedModes = new Set(['Decide', 'Align', 'Explore', 'Update', 'Review']);
  const agendaItems = Array.isArray(parsed.agendaItems)
    ? parsed.agendaItems.slice(0, 5).map(function(item) {
        if (!item || !item.title) return null;
        const budget = Number.isInteger(item.timeBudget) && item.timeBudget > 0 ? item.timeBudget : undefined;
        return Object.assign(
          { title: String(item.title).slice(0, 120), desiredOutcome: String(item.desiredOutcome || '').slice(0, 200) },
          item.owner ? { owner: String(item.owner).slice(0, 80) } : {},
          budget ? { timeBudget: budget } : {}
        );
      }).filter(Boolean)
    : [];
  const frame = parsed.decisionFrame || {};
  return {
    title: String(parsed.title || '').slice(0, 120) || 'Meeting Runway',
    purpose: String(parsed.purpose || '').slice(0, 300),
    agendaTitle: 'Agenda',
    agendaItems,
    decisionFrame: {
      mode: allowedModes.has(frame.mode) ? frame.mode : 'Decide',
      owner: String(frame.owner || '').slice(0, 80),
      successCondition: String(frame.successCondition || '').slice(0, 300)
    },
    participationNorm: String(parsed.participationNorm || '').slice(0, 200),
    openingPrompt: String(parsed.openingPrompt || '').slice(0, 200)
  };
}

async function analyzeRunwayWithProvider(input) {
  const modelSpec = parseAnalysisModelSpec(input.model);
  const provider = modelSpec.provider;
  const model = modelSpec.model;
  if (!analysisEnabled(provider)) {
    const error = new Error(`${provider === 'openai' ? 'OpenAI' : 'Gemini'} analysis is not configured.`);
    error.status = 503;
    throw error;
  }
  const response = provider === 'openai'
    ? await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'authorization': 'Bearer ' + openaiApiKey, 'content-type': 'application/json' },
        body: JSON.stringify(buildOpenAIRunwayRequest(input, model))
      })
    : await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(geminiApiKey), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(buildGeminiRunwayRequest(input))
      });
  const body = await response.json().catch(function() { return {}; });
  if (!response.ok) {
    const msg = body.error && body.error.message ? body.error.message : `${provider} runway analysis failed`;
    const error = new Error(msg);
    error.status = 502;
    throw error;
  }
  const text = provider === 'openai' ? openaiResponseText(body) : geminiResponseText(body);
  return { source: provider, model, runway: cleanRunwayResponse(parseModelJson(text)) };
}

function buildBriefPrompt(input) {
  const meeting = input.meeting || {};
  const included = input.includedItems || {};
  return [
    'You are drafting a concise meeting brief from reviewed meeting-board items.',
    'Use only the included items provided below. Do not invent decisions, attendees, dates, risks, assumptions, or open questions.',
    'Return Markdown only. Do not wrap it in code fences.',
    '',
    'Required format:',
    '## Meeting name',
    'Date and attendees',
    '',
    '### Decisions',
    '',
    '* Decision 1',
    '  * General info',
    '  * Related risks and assumptions',
    '* Decision 2',
    '',
    '### Open questions',
    '',
    '* Agent statement',
    '* Agent statement',
    '',
    'Rules:',
    '- Use the actual meeting name as the H2.',
    '- Put the provided date and attendees on the line immediately after the H2.',
    '- Under each decision, include a brief general-info bullet and, when available, one related risks-and-assumptions bullet.',
    '- Put unresolved agent open issues and unresolved assumptions/open questions under Open questions.',
    '- Keep bullets short and human-readable.',
    '- If a section has no items, include the heading and a single bullet saying "None captured."',
    '',
    '# Meeting',
    JSON.stringify({
      name: meeting.name || 'Meeting',
      date: meeting.date || '',
      attendees: Array.isArray(meeting.attendees) ? meeting.attendees.slice(0, 30) : []
    }, null, 2),
    '',
    '# Included reviewed items',
    JSON.stringify(included, null, 2)
  ].join('\n');
}

function buildGeminiBriefRequest(input) {
  return {
    generationConfig: { temperature: 0.25 },
    contents: [{ role: 'user', parts: [{ text: buildBriefPrompt(input) }] }]
  };
}

function buildOpenAIBriefRequest(input, model) {
  return {
    model,
    input: [{ role: 'user', content: [{ type: 'input_text', text: buildBriefPrompt(input) }] }],
    reasoning: { effort: openaiReasoningEffort },
    store: false
  };
}

function cleanBriefMarkdown(markdown) {
  return String(markdown || '')
    .replace(/^```(?:markdown)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
    .slice(0, 12000);
}

async function analyzeBriefWithProvider(input) {
  const modelSpec = parseAnalysisModelSpec(input && input.model);
  const provider = modelSpec.provider;
  const model = modelSpec.model;
  if (!analysisEnabled(provider)) {
    const error = new Error(`${provider === 'openai' ? 'OpenAI' : 'Gemini'} analysis is not configured.`);
    error.status = 503;
    throw error;
  }
  const response = provider === 'openai'
    ? await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'authorization': 'Bearer ' + openaiApiKey, 'content-type': 'application/json' },
        body: JSON.stringify(buildOpenAIBriefRequest(input || {}, model))
      })
    : await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(geminiApiKey), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(buildGeminiBriefRequest(input || {}))
      });
  const body = await response.json().catch(function() { return {}; });
  if (!response.ok) {
    const msg = body.error && body.error.message ? body.error.message : `${provider} brief analysis failed`;
    const error = new Error(msg);
    error.status = 502;
    throw error;
  }
  const text = provider === 'openai' ? openaiResponseText(body) : geminiResponseText(body);
  return { source: provider, model, markdown: cleanBriefMarkdown(text) };
}

function geminiResponseText(body) {
  return body.candidates &&
    body.candidates[0] &&
    body.candidates[0].content &&
    body.candidates[0].content.parts &&
    body.candidates[0].content.parts.map(function(part) { return part.text || ''; }).join('');
}

function openaiResponseText(body) {
  if (typeof body.output_text === 'string') return body.output_text;
  const output = Array.isArray(body.output) ? body.output : [];
  return output.map(function(item) {
    return (Array.isArray(item.content) ? item.content : []).map(function(content) {
      return content.text || content.output_text || '';
    }).join('');
  }).join('');
}

function reconcileAnalysisItems(items, meetingState) {
  const decisions = Array.isArray(meetingState.decisions) ? meetingState.decisions : [];
  const agentIssues = Array.isArray(meetingState.openAgentIssues) ? meetingState.openAgentIssues : [];
  return items.map(function(item) {
    const normalized = Object.assign({}, item, {
      summary: conciseBoardSummary(item.summary)
    });

    if (normalized.type === 'decision' && normalized.updateMode === 'update') {
      const existing = findReturnedTarget(decisions, normalized.targetId);
      if (existing) {
        normalized.status = reconciledDecisionStatus(existing.status, normalized.status);
      }
      return normalized;
    }

    if (normalized.type === 'agent_issue' && normalized.updateMode === 'update') {
      return normalized;
    }

    if (normalized.type === 'agent_issue' && normalized.updateMode !== 'update') {
      const relatedAgentIssue = findRelatedAgentIssue(agentIssues, normalized);
      if (relatedAgentIssue) {
        return Object.assign({}, normalized, {
          updateMode: 'update',
          targetId: relatedAgentIssue.id
        });
      }
      return normalized;
    }

    if (normalized.type !== 'decision') return normalized;
    const relatedDecision = findRelatedDecision(decisions, item);
    if (!relatedDecision) return normalized;
    return Object.assign({}, normalized, {
      updateMode: 'update',
      targetId: relatedDecision.id,
      status: reconciledDecisionStatus(relatedDecision.status, normalized.status)
    });
  }).filter(Boolean);
}

function findReturnedTarget(items, targetId) {
  if (!targetId) return null;
  return items.find(function(item) { return item.id === targetId; }) || null;
}

function reconciledDecisionStatus(currentStatus, nextStatus) {
  const current = currentStatus || 'forming';
  const next = nextStatus || current;
  const rank = { forming: 0, pending: 1, accepted: 2, rejected: 2 };
  if (!(next in rank)) return current;
  if (next === 'rejected') return 'rejected';
  if (current === 'rejected') return 'rejected';
  return rank[next] >= rank[current] ? next : current;
}

function addExplicitCueItems(input, items) {
  const cue = input.cue || {};
  const text = String(cue.text || '');
  const additions = [];

  if (!items.some(function(item) { return item.type === 'risk'; })) {
    const risk = explicitRiskFromText(text);
    if (risk) additions.push(risk);
  }

  if (!items.some(function(item) { return item.type === 'action'; })) {
    const actionText = explicitActionText(text);
    if (actionText) {
      additions.push({
        type: 'action',
        updateMode: 'create',
        title: actionTitle(actionText),
        summary: actionSummary(actionText)
      });
    }
  }

  return items.concat(additions).slice(0, 3);
}

function explicitRiskFromText(text) {
  const lower = String(text || '').toLowerCase();
  if (/\b(anchor|anchored|anchoring)\b/.test(lower) && /\b(too low|too high|early|hard to move|lock|later)\b/.test(lower)) {
    return {
      type: 'risk',
      updateMode: 'create',
      title: 'Pricing anchor risk',
      summary: 'Deciding too early could anchor pricing before the team has enough evidence, making later changes harder.'
    };
  }
  if (/\b(lock[- ]?in|switching cost|hard to reverse|hard to change|future flexibility)\b/.test(lower)) {
    return {
      type: 'risk',
      updateMode: 'create',
      title: 'Option-value risk',
      summary: 'The current path may close off future flexibility or make later changes harder to reverse.'
    };
  }
  return null;
}

function explicitActionText(text) {
  const match = text.match(/\b(?:Action:|next action is to|next action)\s*(.+)$/i);
  return match ? match[1].trim() : '';
}

function actionTitle(text) {
  const cleaned = text
    .replace(/^(is to|to|we should|we will|let's)\s+/i, '')
    .replace(/[.?!]\s*.*$/, '')
    .trim();
  const words = cleaned.split(/\s+/).slice(0, 7).join(' ');
  const trimmed = words.replace(/\s+(and|or|to|with|for)$/i, '');
  return titleCase(trimmed || 'Capture follow-up action');
}

function actionSummary(text) {
  const cleaned = text.trim();
  return cleaned.length > 220 ? cleaned.slice(0, 217).trim() + '...' : cleaned;
}

function titleCase(text) {
  return String(text || '').replace(/\w\S*/g, function(word) {
    const lower = word.toLowerCase();
    if (['and', 'or', 'the', 'to', 'with', 'by', 'for'].includes(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
}

function sessionForResponse(input, dashboardToken = '') {
  const dashboardPath = input.dashboardPath || `/m/${input.publicSessionId || input.id}`;
  const tokenParam = dashboardToken ? '?t=' + encodeURIComponent(dashboardToken) : '';
  return {
    id: input.id,
    publicSessionId: input.publicSessionId || input.id,
    dashboardPath: `${dashboardPath}${tokenParam}`,
    dashboardUrl: publicBaseUrl ? `${publicBaseUrl}${dashboardPath}${tokenParam}` : (input.dashboardUrl || null),
    accessMode: input.accessMode || 'linkViewable',
    topic: input.topic,
    host: input.host,
    attendees: Array.isArray(input.attendees) ? input.attendees : [],
    zoomMeetingId: input.zoomMeetingId || null,
    zoomMeetingUuid: input.zoomMeetingUuid || null,
    platform: input.platform || 'web',
    recordMode: normalizeRecordMode(input.recordMode),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt
  };
}

function normalizeRecordMode(value) {
  return value === 'off' ? 'off' : 'on';
}

function createPublicSessionId() {
  return randomBytes(9).toString('base64url');
}

function createDashboardToken() {
  return randomBytes(32).toString('base64url');
}

function hashDashboardToken(token) {
  return createHash('sha256').update(String(token || '')).digest('base64url');
}

function dashboardUrlForPath(path, token) {
  const tokenParam = token ? '?t=' + encodeURIComponent(token) : '';
  return publicBaseUrl ? `${publicBaseUrl}${path}${tokenParam}` : null;
}

function getDashboardTokenFromRequest(req) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const queryToken = url.searchParams.get('t');
  const headerToken = req.headers['x-dashboard-token'];
  return queryToken || (Array.isArray(headerToken) ? headerToken[0] : headerToken) || '';
}

function hasValidDashboardToken(req, session) {
  if (!session.dashboardTokenHash) return true;
  const token = getDashboardTokenFromRequest(req);
  if (!token) return false;
  const expected = Buffer.from(String(session.dashboardTokenHash));
  const actual = Buffer.from(hashDashboardToken(token));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function saveSession(session) {
  if (!firestore) {
    sessions.set(session.id, session);
    return session;
  }
  await firestore.collection(sessionsCollection).doc(session.id).set(session);
  return session;
}

async function updateSession(session) {
  session.updatedAt = new Date().toISOString();
  return saveSession(session);
}

async function getSession(id) {
  const normalizedId = id === null || id === undefined ? '' : String(id);
  if (!normalizedId) return null;
  if (!firestore) return sessions.get(normalizedId) || null;
  // Zoom occurrence UUIDs can contain "/", which Firestore interprets as a
  // document path separator. Those IDs must be resolved through field queries.
  if (normalizedId.includes('/')) return null;
  const snapshot = await firestore.collection(sessionsCollection).doc(normalizedId).get();
  if (!snapshot.exists) return null;
  return snapshot.data();
}

async function getSessionByAccessId(id) {
  const normalizedId = id === null || id === undefined ? '' : String(id);
  if (!normalizedId) return null;
  const direct = await getSession(normalizedId);
  if (direct) return direct;

  if (!firestore) {
    return Array.from(sessions.values()).find(function(session) {
      return String(session.publicSessionId || '') === normalizedId ||
        String(session.zoomMeetingId || '') === normalizedId ||
        String(session.zoomMeetingUuid || '') === normalizedId;
    }) || null;
  }

  const snapshot = await firestore.collection(sessionsCollection)
    .where('zoomMeetingId', '==', normalizedId)
    .limit(1)
    .get();
  if (!snapshot.empty) return snapshot.docs[0].data();

  const uuidSnapshot = await firestore.collection(sessionsCollection)
    .where('zoomMeetingUuid', '==', normalizedId)
    .limit(1)
    .get();
  return uuidSnapshot.empty ? null : uuidSnapshot.docs[0].data();
}

async function getSessionsByAccessId(id) {
  const normalizedId = id === null || id === undefined ? '' : String(id);
  if (!normalizedId) return [];
  const direct = await getSession(normalizedId);
  if (direct) return [direct];

  if (!firestore) {
    return Array.from(sessions.values()).filter(function(session) {
      return String(session.publicSessionId || '') === normalizedId ||
        String(session.zoomMeetingId || '') === normalizedId ||
        String(session.zoomMeetingUuid || '') === normalizedId;
    });
  }

  const [meetingIdSnapshot, uuidSnapshot] = await Promise.all([
    firestore.collection(sessionsCollection)
      .where('zoomMeetingId', '==', normalizedId)
      .get(),
    firestore.collection(sessionsCollection)
      .where('zoomMeetingUuid', '==', normalizedId)
      .get()
  ]);
  const results = [];
  const seen = new Set();
  function addSnapshot(snapshot) {
    snapshot.docs.forEach(function(doc) {
      if (seen.has(doc.id)) return;
      seen.add(doc.id);
      results.push(doc.data());
    });
  }
  addSnapshot(meetingIdSnapshot);
  addSnapshot(uuidSnapshot);
  return results;
}

function normalizeAccessMode(value) {
  return value === 'zoomRestricted' ? 'zoomRestricted' : 'linkViewable';
}

function normalizeStringList(values) {
  return Array.isArray(values) ? values.map(function(value) {
    return String(value || '').trim();
  }).filter(Boolean).slice(0, 100) : [];
}

function normalizeEmailList(values) {
  return normalizeStringList(values).map(function(value) {
    return value.toLowerCase();
  });
}

function zoomUserMatchesSession(user, session) {
  if (!user || !session) return false;
  const userIds = normalizeStringList([
    session.hostZoomUserId,
    ...(session.alternativeHostZoomUserIds || []),
    ...(session.attendeeZoomUserIds || [])
  ]);
  if (user.id && userIds.includes(String(user.id))) return true;

  const email = String(user.email || '').trim().toLowerCase();
  const allowedEmails = normalizeEmailList([
    session.hostEmail,
    ...(session.alternativeHostEmails || []),
    ...(session.attendeeEmails || [])
  ]);
  return Boolean(email && allowedEmails.includes(email));
}

function hasSessionAccess(req, session) {
  const accessMode = normalizeAccessMode(session && session.accessMode);
  if (accessMode === 'zoomRestricted') {
    return zoomUserMatchesSession(zoomUserFromRequest(req), session);
  }
  return hasValidDashboardToken(req, session);
}

function sendSessionAccessDenied(req, res, session) {
  if (normalizeAccessMode(session && session.accessMode) === 'zoomRestricted' && !zoomUserFromRequest(req)) {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    sendJson(res, 401, {
      error: 'Zoom sign-in required',
      loginUrl: '/api/zoom/login/start?next=' + encodeURIComponent(url.pathname + url.search)
    });
    return;
  }
  sendJson(res, 403, { error: 'Invalid or missing dashboard access' });
}

function meetingOutputFromRtmsState(session, state) {
  const now = new Date().toISOString();
  return {
    sessionId: session.id,
    publicSessionId: session.publicSessionId || session.id,
    topic: session.topic || 'Untitled meeting',
    host: session.host || 'Meeting host',
    zoomMeetingId: session.zoomMeetingId || null,
    zoomMeetingUuid: session.zoomMeetingUuid || null,
    accessMode: normalizeAccessMode(session.accessMode),
    recordMode: normalizeRecordMode(session.recordMode),
    status: state.status || 'live',
    statusReason: state.statusReason || null,
    transcript: Array.isArray(state.transcript) ? state.transcript.slice(-500) : [],
    decisions: Array.isArray(state.decisions) ? state.decisions.slice(0, 100) : [],
    risks: Array.isArray(state.risks) ? state.risks.slice(0, 100) : [],
    actions: Array.isArray(state.actions) ? state.actions.slice(0, 150) : [],
    openAgentIssues: Array.isArray(state.openAgentIssues) ? state.openAgentIssues.slice(0, 100) : [],
    dismissedItems: Array.isArray(state.dismissedItems) ? state.dismissedItems.slice(0, 100) : [],
    analyses: Array.isArray(state.analyses) ? state.analyses.slice(0, 50) : [],
    startedAt: state.startedAt || session.createdAt || now,
    endedAt: /ended|stopped|interrupted/i.test(String(state.status || '')) ? now : null,
    updatedAt: now
  };
}

function initialMeetingOutput(session) {
  const now = new Date().toISOString();
  return {
    sessionId: session.id,
    publicSessionId: session.publicSessionId || session.id,
    topic: session.topic || 'Untitled meeting',
    host: session.host || 'Meeting host',
    zoomMeetingId: session.zoomMeetingId || null,
    zoomMeetingUuid: session.zoomMeetingUuid || null,
    accessMode: normalizeAccessMode(session.accessMode),
    recordMode: normalizeRecordMode(session.recordMode),
    status: 'created',
    statusReason: null,
    transcript: [],
    decisions: [],
    risks: [],
    actions: [],
    openAgentIssues: [],
    dismissedItems: [],
    analyses: [],
    briefMarkdown: '',
    startedAt: session.createdAt || now,
    endedAt: null,
    createdAt: session.createdAt || now,
    updatedAt: now
  };
}

async function saveMeetingOutput(output) {
  if (!output || !output.sessionId) return null;
  if (!firestore) {
    meetingOutputs.set(output.sessionId, output);
    return output;
  }
  await firestore.collection(meetingOutputsCollection).doc(output.sessionId).set(output, { merge: true });
  return output;
}

async function getMeetingOutput(id) {
  if (!firestore) return meetingOutputs.get(id) || null;
  const snapshot = await firestore.collection(meetingOutputsCollection).doc(id).get();
  return snapshot.exists ? snapshot.data() : null;
}

async function getMeetingOutputsForSession(session) {
  if (!session) return [];
  const direct = await getMeetingOutput(session.id);
  const meetingUuid = String(session.zoomMeetingUuid || '');
  if (!meetingUuid) return direct ? [direct] : [];
  if (!firestore) {
    return Array.from(meetingOutputs.values()).filter(function(output) {
      return output.sessionId === session.id || String(output.zoomMeetingUuid || '') === meetingUuid;
    });
  }
  const snapshot = await firestore.collection(meetingOutputsCollection)
    .where('zoomMeetingUuid', '==', meetingUuid)
    .get();
  const outputs = snapshot.docs.map(function(doc) { return doc.data(); });
  if (direct && !outputs.some(function(output) { return output.sessionId === direct.sessionId; })) outputs.push(direct);
  return outputs;
}

async function persistMeetingOutputForRtmsState(state) {
  const session = await findSessionForRtmsState(state);
  if (!session) return null;
  const existingOutput = await getMeetingOutput(session.id);
  applyDismissedItemsToRtmsState(state, existingOutput && existingOutput.dismissedItems);
  const output = meetingOutputFromRtmsState(session, state);
  await saveMeetingOutput(output);
  return output;
}

function persistMeetingOutputForRtmsStateSafely(state, context) {
  return persistMeetingOutputForRtmsState(state).catch(function(error) {
    console.error(`RTMS output persistence failed (${context}):`, error.message);
    return null;
  });
}

async function findSessionForRtmsState(state) {
  const candidates = [
    state && state.id,
    state && state.meetingUuid,
    state && state.sessionId,
    state && state.streamId,
    state && !state.meetingUuid && state.meetingId
  ].filter(Boolean);
  for (const id of candidates) {
    const session = await getSessionByAccessId(id);
    if (session) return session;
  }
  return null;
}

function syncRtmsStatesForSession(session) {
  if (!session) return;
  for (const state of rtmsSessionStates.values()) {
    const stateUuid = String(state.meetingUuid || '');
    const sessionUuid = String(session.zoomMeetingUuid || '');
    const matches = stateUuid || sessionUuid
      ? Boolean(stateUuid && sessionUuid && stateUuid === sessionUuid)
      : [state.id, state.meetingId, state.sessionId, state.streamId].filter(Boolean).some(function(id) {
        const normalizedId = String(id);
        return normalizedId === String(session.id || '') ||
          normalizedId === String(session.publicSessionId || '') ||
          normalizedId === String(session.zoomMeetingId || '');
      });
    if (matches) {
      state.recordMode = normalizeRecordMode(session.recordMode);
      state.updatedAt = new Date().toISOString();
    }
  }
}

function findRtmsStateForSession(session) {
  if (!session) return null;
  return Array.from(rtmsSessionStates.values()).find(function(state) {
    const stateUuid = String(state.meetingUuid || '');
    const sessionUuid = String(session.zoomMeetingUuid || '');
    if (stateUuid && sessionUuid && stateUuid === sessionUuid) return true;
    return [state.id, state.meetingId, state.sessionId, state.streamId].filter(Boolean).some(function(id) {
      const normalizedId = String(id);
      return normalizedId === String(session.id || '') ||
        normalizedId === String(session.publicSessionId || '') ||
        normalizedId === String(session.zoomMeetingId || '');
    });
  }) || null;
}

function dismissRtmsBoardItem(state, itemId, disposition) {
  const lists = [
    ['decision', state.decisions],
    ['risk', state.risks],
    ['action', state.actions],
    ['agent', state.openAgentIssues]
  ];
  for (const [type, list] of lists) {
    const index = list.findIndex(function(item) { return item.id === itemId; });
    if (index < 0) continue;
    const [item] = list.splice(index, 1);
    const dismissed = {
      id: randomUUID(),
      originalId: item.id,
      type,
      disposition: disposition === 'rejected' ? 'rejected' : 'dismissed',
      title: item.title || item.agent || type,
      summary: item.summary || '',
      evidence: item.evidence || '',
      dismissedAt: new Date().toISOString()
    };
    state.dismissedItems = [dismissed].concat(Array.isArray(state.dismissedItems) ? state.dismissedItems : []).slice(0, 100);
    state.updatedAt = dismissed.dismissedAt;
    return dismissed;
  }
  return null;
}

function dismissMeetingOutputItem(output, itemId, disposition) {
  const lists = [
    ['decision', 'decisions'],
    ['risk', 'risks'],
    ['action', 'actions'],
    ['agent', 'openAgentIssues']
  ];
  for (const [type, key] of lists) {
    const list = Array.isArray(output[key]) ? output[key] : [];
    const index = list.findIndex(function(item) { return item.id === itemId; });
    if (index < 0) continue;
    const [item] = list.splice(index, 1);
    const dismissed = {
      id: randomUUID(),
      originalId: item.id,
      type,
      disposition: disposition === 'rejected' ? 'rejected' : 'dismissed',
      title: item.title || item.agent || type,
      summary: item.summary || '',
      evidence: item.evidence || '',
      dismissedAt: new Date().toISOString()
    };
    output[key] = list;
    output.dismissedItems = [dismissed].concat(Array.isArray(output.dismissedItems) ? output.dismissedItems : []).slice(0, 100);
    output.updatedAt = dismissed.dismissedAt;
    return dismissed;
  }
  return null;
}

async function hasRtmsDashboardAccess(req, state, requestedId) {
  const candidates = [
    state && state.meetingUuid && String(requestedId) === String(state.meetingId) ? null : requestedId,
    state && state.id,
    state && state.meetingUuid,
    state && state.sessionId,
    state && state.streamId,
    state && !state.meetingUuid && state.meetingId
  ].filter(Boolean);

  for (const id of candidates) {
    const matchingSessions = await getSessionsByAccessId(id);
    if (matchingSessions.some(function(session) {
      return hasSessionAccess(req, session);
    })) return true;
  }
  return false;
}

function hasServiceAdminAccess(req) {
  const token = process.env.ROOM_CLARITY_ADMIN_TOKEN || '';
  const headerToken = req.headers['x-admin-token'];
  const value = Array.isArray(headerToken) ? headerToken[0] : headerToken;
  if (!token || !value) return false;
  const expected = Buffer.from(token);
  const actual = Buffer.from(String(value));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function createSession(input = {}) {
  const publicSessionId = createPublicSessionId();
  const dashboardToken = createDashboardToken();
  const createdAt = new Date().toISOString();
  const dashboardPath = `/m/${publicSessionId}`;
  const session = {
    id: publicSessionId,
    publicSessionId,
    dashboardPath,
    dashboardUrl: dashboardUrlForPath(dashboardPath),
    dashboardTokenHash: hashDashboardToken(dashboardToken),
    accessMode: normalizeAccessMode(input.accessMode),
    topic: input.topic || 'Untitled meeting',
    host: input.host || 'Meeting host',
    attendees: Array.isArray(input.attendees) ? input.attendees : [],
    zoomMeetingId: input.zoomMeetingId ? String(input.zoomMeetingId) : null,
    zoomMeetingUuid: input.meetingUuid ? String(input.meetingUuid) : null,
    hostZoomUserId: input.hostZoomUserId || input.zoomUserId || null,
    hostEmail: input.hostEmail || input.zoomUserEmail || null,
    alternativeHostZoomUserIds: normalizeStringList(input.alternativeHostZoomUserIds),
    alternativeHostEmails: normalizeEmailList(input.alternativeHostEmails),
    attendeeZoomUserIds: normalizeStringList(input.attendeeZoomUserIds),
    attendeeEmails: normalizeEmailList(input.attendeeEmails),
    platform: input.platform || 'web',
    recordMode: normalizeRecordMode(input.recordMode),
    createdAt,
    updatedAt: createdAt
  };
  await saveSession(session);
  await saveMeetingOutput(initialMeetingOutput(session));
  return Object.assign(sessionForResponse(session, dashboardToken), { dashboardToken });
}

function rtmsKey(payload = {}) {
  return payload.meeting_uuid || payload.webinar_uuid || payload.meeting_id || payload.session_id || payload.engagement_id || payload.rtms_stream_id || 'unknown';
}

function getRtmsState(payload = {}) {
  const key = rtmsKey(payload);
  if (!rtmsSessionStates.has(key)) {
    rtmsSessionStates.set(key, Object.assign(emptyMeetingState(), {
      id: key,
      meetingUuid: payload.meeting_uuid || null,
      meetingId: payload.meeting_id || null,
      webinarUuid: payload.webinar_uuid || null,
      sessionId: payload.session_id || null,
      engagementId: payload.engagement_id || null,
      streamId: payload.rtms_stream_id || null,
      transcript: [],
      analyses: [],
      recordMode: 'on',
      offRecordCueCount: 0,
      status: 'created',
      statusReason: null,
      firstTranscriptTimestampUnit: null,
      firstTranscriptWallMs: null,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }
  const state = rtmsSessionStates.get(key);
  if (payload.rtms_stream_id) state.streamId = payload.rtms_stream_id;
  if (payload.meeting_id) state.meetingId = payload.meeting_id;
  return state;
}

function normalizeTranscriptText(buffer, size) {
  if (typeof buffer === 'object' && !Buffer.isBuffer(buffer) && buffer !== null) {
    if (typeof buffer.text === 'string') return buffer.text.trim();
    if (typeof buffer.transcript === 'string') return buffer.transcript.trim();
    if (typeof buffer.caption === 'string') return buffer.caption.trim();
  }
  if (Buffer.isBuffer(buffer)) return buffer.subarray(0, size || buffer.length).toString('utf8').trim();
  if (typeof buffer === 'string') return buffer.trim();
  return '';
}

function transcriptTimestampUnit(value) {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000_000_000_000) return 'ns';
  if (absolute >= 1_000_000_000_000_000) return 'us';
  if (absolute >= 1_000_000_000_000) return 'ms';
  if (absolute >= 1_000_000_000) return 's';
  if (absolute >= 10_000_000) return 'ns';
  if (absolute >= 10_000) return 'ms';
  return 's';
}

function timestampUnitScale(unit) {
  if (unit === 'ns') return 1_000_000_000;
  if (unit === 'us') return 1_000_000;
  if (unit === 'ms') return 1000;
  return 1;
}

function resolveTimestampUnit(value, unitHint) {
  const inferred = transcriptTimestampUnit(value);
  if (!unitHint) return inferred;
  const absolute = Math.abs(Number(value));
  if (unitHint === 'ns' && absolute < 1_000_000_000_000_000) return inferred;
  if (unitHint === 'us' && absolute < 1_000_000_000_000) return inferred;
  if (unitHint === 'ms' && absolute >= 1_000_000_000_000_000) return inferred;
  return unitHint;
}

function timestampToSeconds(timestamp, state, unitHint) {
  const value = Number(timestamp != null ? timestamp : Date.now());
  if (!Number.isFinite(value)) return state.transcript.length ? state.transcript[state.transcript.length - 1].end : 0;
  const unit = state.firstTranscriptTimestampUnit || resolveTimestampUnit(value, unitHint);
  if (state.firstTranscriptTimestamp == null) {
    state.firstTranscriptTimestamp = value;
    state.firstTranscriptTimestampUnit = unit;
  }
  const scale = timestampUnitScale(state.firstTranscriptTimestampUnit);
  return Math.max(0, (value - state.firstTranscriptTimestamp) / scale);
}

function transcriptArrivalSeconds(state) {
  const now = Date.now();
  if (state.firstTranscriptWallMs == null) state.firstTranscriptWallMs = now;
  return Math.max(0, (now - state.firstTranscriptWallMs) / 1000);
}

function normalizedTranscriptStart(rawTimestamp, state, metadata = {}) {
  const arrivalStart = transcriptArrivalSeconds(state);
  const previousCue = state.transcript[state.transcript.length - 1];
  if (metadata.timestampUnit === 'arrival') {
    return Math.max(arrivalStart, previousCue ? previousCue.end || previousCue.start + 3 : 0);
  }
  const parsedStart = timestampToSeconds(rawTimestamp, state, metadata.timestampUnit);
  if (!previousCue || parsedStart > previousCue.start) return parsedStart;
  return Math.max(arrivalStart, previousCue.end || previousCue.start + 3);
}

function transcriptWindowForServerCue(state, cue) {
  const windowStart = Math.max(0, cue.start - 90);
  return state.transcript.filter(function(item) {
    return item.start >= windowStart;
  }).slice(-12);
}

function rtmsCueSource(metadata = {}) {
  return metadata.source === 'chat' ? 'chat' : 'transcript';
}

function rtmsSpeaker(metadata = {}, source = 'transcript') {
  return metadata.userName || metadata.displayName || metadata.user || metadata.sender || (source === 'chat' ? 'Zoom chat' : 'Zoom participant');
}

async function ingestRtmsTranscript(payload, buffer, size, timestamp, metadata = {}) {
  const state = getRtmsState(payload);
  const session = await findSessionForRtmsState(state);
  if (session) state.recordMode = normalizeRecordMode(session.recordMode);
  const source = rtmsCueSource(metadata);
  const text = normalizeTranscriptText(buffer, size);
  if (!text) return { ignored: true, reason: `empty ${source}` };
  if (state.recordMode === 'off') {
    state.offRecordCueCount = (state.offRecordCueCount || 0) + 1;
    state.updatedAt = new Date().toISOString();
    await persistMeetingOutputForRtmsState(state);
    return {
      ignored: true,
      reason: 'off_the_record',
      sessionId: state.id,
      offRecordCueCount: state.offRecordCueCount
    };
  }

  const rawTs = timestamp != null ? timestamp : (metadata.startTs != null ? metadata.startTs : payload.event_ts);
  const cueIndex = state.transcript.length;
  if (cueIndex < 3) {
    console.log(`RTMS cue[${cueIndex}] source=${source} rawTs=${rawTs} type=${typeof rawTs} start_time=${payload.start_time} timestamp=${payload.timestamp} event_ts=${payload.event_ts} endTime=${metadata.endTime} unit=${state.firstTranscriptTimestampUnit}`);
  }
  const start = normalizedTranscriptStart(rawTs, state, metadata);
  if (cueIndex < 3) {
    console.log(`RTMS cue[${cueIndex}] computed start=${start}s firstTs=${state.firstTranscriptTimestamp} unit=${state.firstTranscriptTimestampUnit}`);
  }
  const rawEnd = metadata.endTime != null ? Number(metadata.endTime) : null;
  const parsedEnd = rawEnd != null && Number.isFinite(rawEnd) ? timestampToSeconds(rawEnd, state) : null;
  const end = (parsedEnd != null && parsedEnd > start) ? parsedEnd : start + 3;
  const speaker = rtmsSpeaker(metadata, source);
  const cue = {
    id: randomUUID(),
    start,
    end,
    speaker,
    text,
    source,
    evidence: `${formatServerTime(start)} · ${speaker}${source === 'chat' ? ' · chat' : ''}`
  };

  state.transcript.push(cue);
  state.transcript = state.transcript.slice(-200);
  state.updatedAt = new Date().toISOString();

  let analysis = null;
  if (analysisEnabled()) {
    const session = await findSessionForRtmsState(state);
    const existingOutput = session ? await getMeetingOutput(session.id) : null;
    applyDismissedItemsToRtmsState(state, existingOutput && existingOutput.dismissedItems);
    analysis = await analyzeCueWithProvider({
      cue,
      transcriptWindow: transcriptWindowForServerCue(state, cue),
      meetingState: serverMeetingStateForAnalysis(state)
    });
    applyServerAnalysisItems(state, analysis.items || [], cue);
    state.analyses.unshift(analysis);
    state.analyses = state.analyses.slice(0, 50);
  }

  await persistMeetingOutputForRtmsState(state);

  return {
    ignored: false,
    sessionId: state.id,
    cue,
    analysis
  };
}

function normalizeRtmsChatText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (Buffer.isBuffer(value)) return value.toString('utf8').trim();
  if (typeof value === 'object') {
    return String(
      value.text || value.message || value.chat_message || value.chatMessage || value.content || ''
    ).trim();
  }
  return String(value).trim();
}

function payloadLooksLikeRtmsChat(payload = {}, eventName = '') {
  const lowerEvent = String(eventName || payload.event || payload.event_type || payload.type || '').toLowerCase();
  const lowerMedia = String(payload.media_type || payload.mediaType || payload.media_data_type || payload.data_type || payload.dataType || '').toLowerCase();
  const numericType = Number(payload.message_type || payload.messageType || payload.media_type || payload.mediaType || payload.media_data_type || payload.data_type);
  return lowerEvent.includes('chat') ||
    lowerMedia.includes('chat') ||
    numericType === 18 ||
    payload.chat_message != null ||
    payload.chatMessage != null;
}

async function ingestRtmsChat(payload, buffer, size, timestamp, metadata = {}) {
  return ingestRtmsTranscript(payload, buffer, size, timestamp, Object.assign({ source: 'chat' }, metadata));
}

function collectRtmsChatPayloads(value, eventName = '', output = []) {
  if (!value || typeof value !== 'object') return output;
  if (payloadLooksLikeRtmsChat(value, eventName) && normalizeRtmsChatText(value)) output.push(value);
  Object.keys(value).forEach(function(key) {
    const child = value[key];
    if (Array.isArray(child)) {
      child.forEach(function(item) { collectRtmsChatPayloads(item, eventName, output); });
    } else if (child && typeof child === 'object' && !Buffer.isBuffer(child)) {
      collectRtmsChatPayloads(child, eventName || key, output);
    }
  });
  return output;
}

function ingestRtmsRawEventChats(payload, rawEventData) {
  let parsed;
  try {
    parsed = typeof rawEventData === 'string' ? JSON.parse(rawEventData) : rawEventData;
  } catch (_error) {
    return 0;
  }
  const eventName = parsed && (parsed.event || parsed.event_type || parsed.type || '');
  const chatPayloads = collectRtmsChatPayloads(parsed, eventName);
  chatPayloads.forEach(function(chatPayload) {
    const text = normalizeRtmsChatText(chatPayload);
    const timestamp = chatPayload.start_time || chatPayload.timestamp || chatPayload.event_ts || parsed.timestamp || parsed.event_ts || Date.now();
    ingestRtmsChat(Object.assign({}, payload, chatPayload), text, text.length, timestamp, {
      userName: chatPayload.sender || chatPayload.sender_name || chatPayload.user_name || chatPayload.userName || chatPayload.participant_name,
      endTime: chatPayload.end_time,
      timestampUnit: chatPayload.timestampUnit
    }).catch(function(error) {
      console.error('RTMS chat analysis failed:', error.message);
    });
  });
  return chatPayloads.length;
}

function zoomMeetingChatPayload(event = {}) {
  if (!/^meeting\.chat_message_/i.test(String(event.event || ''))) return null;
  const payload = event.payload || {};
  const object = payload.object || {};
  const chatMessage = object.chat_message || {};
  const text = normalizeRtmsChatText({
    text: chatMessage.message_content || chatMessage.message || chatMessage.text || chatMessage.content
  });
  if (!text) return null;
  const meetingUuid = object.meeting_uuid || object.uuid || payload.meeting_uuid || payload.uuid || '';
  const meetingId = object.meeting_id || object.id || payload.meeting_id || payload.id || '';
  const sentAt = chatMessage.date_time ? Date.parse(chatMessage.date_time) : Number(event.event_ts || Date.now());
  return {
    payload: {
      meeting_uuid: meetingUuid,
      meeting_id: meetingId,
      rtms_stream_id: object.rtms_stream_id || payload.rtms_stream_id || null,
      media_type: 'chat',
      message_id: chatMessage.message_id || null
    },
    text,
    timestamp: Number.isFinite(sentAt) ? sentAt : Date.now(),
    metadata: {
      userName: chatMessage.sender_name || object.sender_name || payload.sender_name || 'Zoom chat',
      timestampUnit: 'arrival'
    }
  };
}

function formatServerTime(seconds) {
  const total = Math.floor(seconds);
  return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
}

function stopRtmsClient(payload = {}) {
  const key = rtmsKey(payload);
  const client = rtmsClients.get(key) || rtmsClients.get(payload.rtms_stream_id);
  if (!client) return false;
  try {
    client.leave();
  } catch (error) {
    console.error('RTMS leave failed:', error.message);
  }
  deleteRtmsClientReferences(client);
  return true;
}

function deleteRtmsClientReferences(client) {
  for (const [id, storedClient] of rtmsClients.entries()) {
    if (storedClient === client) rtmsClients.delete(id);
  }
}

async function loadRtmsSdk() {
  if (!rtmsModulePromise) {
    rtmsModulePromise = import('@zoom/rtms').then(function(module) {
      return module.default || module;
    });
  }
  return rtmsModulePromise;
}

async function startRtmsClient(payload = {}) {
  const key = rtmsKey(payload);
  const existingClient = rtmsClients.get(key);
  if (existingClient && payload.rtms_stream_id && !rtmsClients.has(payload.rtms_stream_id)) {
    stopRtmsClient(payload);
  }

  const state = getRtmsState(payload);
  if (!payload.rtms_stream_id || !payload.server_urls) {
    state.status = 'start_failed';
    state.statusReason = 'missing rtms_stream_id or server_urls';
    state.updatedAt = new Date().toISOString();
    await persistMeetingOutputForRtmsState(state);
    return { started: false, reason: 'missing rtms_stream_id or server_urls' };
  }
  if (rtmsClients.has(payload.rtms_stream_id)) return { started: false, reason: 'already connected' };

  console.log('RTMS starting:', key, 'media_type:', payload.media_type, 'stream_id:', payload.rtms_stream_id);

  const rtms = await loadRtmsSdk();
  const client = new rtms.Client();
  rtmsClients.set(key, client);
  rtmsClients.set(payload.rtms_stream_id, client);
  state.status = 'starting';
  state.statusReason = null;
  state.updatedAt = new Date().toISOString();
  persistMeetingOutputForRtmsStateSafely(state, 'starting');

  client.onJoinConfirm(function(reason) {
    console.log('RTMS join confirmed:', key, reason);
    state.status = 'active';
    state.statusReason = reason || null;
    state.updatedAt = new Date().toISOString();
    persistMeetingOutputForRtmsState(state).catch(function(error) {
      console.error('RTMS output persistence failed:', error.message);
    });
  });
  let transcriptCount = 0;
  client.onTranscriptData(function(buffer, size, timestamp, metadata) {
    if (transcriptCount < 3) {
      console.log(`RTMS SDK transcript[${transcriptCount}] key=${key} timestamp=${timestamp} type=${typeof timestamp} user=${metadata && metadata.userName}`);
    }
    transcriptCount++;
    ingestRtmsTranscript(payload, buffer, size, timestamp, Object.assign({ timestampUnit: 'us' }, metadata)).catch(function(error) {
      console.error('RTMS transcript analysis failed:', error.message);
    });
  });
  if (typeof client.onChatData === 'function') {
    let chatCount = 0;
    client.onChatData(function(buffer, size, timestamp, metadata) {
      if (chatCount < 3) {
        console.log(`RTMS SDK chat[${chatCount}] key=${key} timestamp=${timestamp} type=${typeof timestamp} user=${metadata && metadata.userName}`);
      }
      chatCount++;
      ingestRtmsChat(payload, buffer, size, timestamp, Object.assign({ timestampUnit: 'us' }, metadata)).catch(function(error) {
        console.error('RTMS chat analysis failed:', error.message);
      });
    });
  }
  if (typeof client.onEventEx === 'function') {
    client.onEventEx(function(eventData) {
      const count = ingestRtmsRawEventChats(payload, eventData);
      if (count) console.log('RTMS raw chat events ingested:', key, count);
    });
  }
  client.onLeave(function(reason) {
    console.log('RTMS leave:', key, 'reason:', reason, 'status:', state.status);
    if (!['stopped', 'interrupted'].includes(state.status)) {
      state.status = 'ended';
      state.statusReason = reason || null;
    }
    state.updatedAt = new Date().toISOString();
    deleteRtmsClientReferences(client);
    persistMeetingOutputForRtmsState(state).catch(function(error) {
      console.error('RTMS output persistence failed:', error.message);
    });
  });

  let joined = false;
  try {
    joined = client.join(Object.assign({}, payload, {
      client: process.env.ZM_RTMS_CLIENT || process.env.ZOOM_CLIENT_ID,
      secret: process.env.ZM_RTMS_SECRET || process.env.ZOOM_CLIENT_SECRET,
      pollInterval: Number(process.env.RTMS_POLL_INTERVAL_MS || 10),
      ca: process.env.RTMS_CA_PATH || '/etc/ssl/certs/ca-certificates.crt'
    }));
  } catch (error) {
    state.status = 'start_failed';
    state.statusReason = error.message;
    state.updatedAt = new Date().toISOString();
    deleteRtmsClientReferences(client);
    persistMeetingOutputForRtmsStateSafely(state, 'join exception');
    console.error('RTMS join failed:', key, error.message);
    return { started: false, reason: error.message, sessionId: key };
  }
  if (!joined) {
    state.status = 'start_failed';
    state.statusReason = 'client.join returned false';
    state.updatedAt = new Date().toISOString();
    deleteRtmsClientReferences(client);
    persistMeetingOutputForRtmsStateSafely(state, 'join returned false');
  }
  return { started: joined, streamId: payload.rtms_stream_id, sessionId: key };
}

function handleZoomUrlValidation(event) {
  const plainToken = event.payload && event.payload.plainToken;
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  if (!plainToken || !secret) return null;
  return {
    plainToken,
    encryptedToken: createHmac('sha256', secret).update(plainToken).digest('hex')
  };
}

function verifyZoomWebhookSignature(req, rawBody, event) {
  if (event.event === 'endpoint.url_validation') return true;

  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  const timestamp = req.headers['x-zm-request-timestamp'];
  const signature = req.headers['x-zm-signature'];
  if (!secret || !timestamp || !signature) return false;
  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs)) return false;
  if (Math.abs(Date.now() - timestampMs) > zoomWebhookMaxAgeMs) return false;

  const message = `v0:${timestamp}:${rawBody}`;
  const expected = 'v0=' + createHmac('sha256', secret).update(message).digest('hex');
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(String(signature));
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

async function handleRtmsWebhookEvent(event) {
  const payload = event.payload || {};
  if (event.event === 'endpoint.url_validation') {
    return handleZoomUrlValidation(event) || { ok: false, reason: 'missing validation token or secret' };
  }
  const meetingChat = zoomMeetingChatPayload(event);
  if (meetingChat) {
    console.log('Zoom meeting chat webhook received:', rtmsKey(meetingChat.payload), 'message_id:', meetingChat.payload.message_id || 'n/a');
    return ingestRtmsChat(meetingChat.payload, meetingChat.text, meetingChat.text.length, meetingChat.timestamp, meetingChat.metadata);
  }

  if (event.event && event.event !== 'meeting.transcript_completed') {
    const messageLooksLikeChat = payloadLooksLikeRtmsChat(payload, event.event);
    const operationalReason = payload.reason || payload.error_message || (messageLooksLikeChat ? null : payload.message);
    console.log('RTMS webhook event:', event.event, 'key:', rtmsKey(payload), 'media_type:', payload.media_type || 'n/a', 'stream_id:', payload.rtms_stream_id || 'n/a', 'reason:', operationalReason || 'n/a');
  }

  if (event.event === 'meeting.rtms_started' || event.event === 'webinar.rtms_started' || event.event === 'session.rtms_started') {
    return startRtmsClient(payload);
  }
  if (event.event === 'meeting.rtms_stopped' || event.event === 'meeting.rtms_interrupted' ||
      event.event === 'webinar.rtms_stopped' || event.event === 'session.rtms_stopped') {
    const state = getRtmsState(payload);
    const isInterrupted = event.event.endsWith('rtms_interrupted');
    state.status = isInterrupted ? 'interrupted' : 'stopped';
    state.statusReason = payload.reason || payload.error_message || null;
    state.updatedAt = new Date().toISOString();
    const stopped = stopRtmsClient(payload);
    await persistMeetingOutputForRtmsState(state);
    // Auto-retry when interrupted with no transcript yet (e.g. host is silent waiting for others to join).
    // Cap at 10 retries (~5-10 min at Zoom's ~30-60s silence timeout) so real failures eventually surface an error.
    const MAX_AUTO_RETRIES = 10;
    if (isInterrupted && state.transcript.length === 0 && (state._autoRetryCount || 0) < MAX_AUTO_RETRIES) {
      state._autoRetryCount = (state._autoRetryCount || 0) + 1;
      console.log('RTMS interrupted with no transcript, auto-retrying in 3s (attempt', state._autoRetryCount + '/' + MAX_AUTO_RETRIES + '):', rtmsKey(payload));
      setTimeout(() => startRtmsClient(payload), 3000);
    }
    return { stopped, sessionId: rtmsKey(payload) };
  }

  if (event.event === 'rtms.start_failed' ||
      event.event === 'rtms.concurrency_limited' ||
      event.event === 'rtms.concurrency_near_limit') {
    const state = getRtmsState(payload);
    state.status = event.event.replace(/^rtms\./, '');
    state.statusReason = payload.reason || payload.error_message || payload.message || null;
    state.updatedAt = new Date().toISOString();
    await persistMeetingOutputForRtmsState(state);
    return { received: true, event: event.event, sessionId: state.id };
  }

  const chatText = payloadLooksLikeRtmsChat(payload, event.event) ? normalizeRtmsChatText(payload) : '';
  if (chatText) {
    const state = getRtmsState(payload);
    if (state.transcript.length < 2) {
      console.log('RTMS webhook chat payload keys:', Object.keys(payload).join(', '));
    }
    return ingestRtmsChat(payload, chatText, chatText.length, payload.start_time || payload.timestamp || event.event_ts, {
      userName: payload.sender || payload.sender_name || payload.user_name || payload.userName || payload.participant_name,
      endTime: payload.end_time
    });
  }

  const transcriptText = payload.text || payload.transcript || payload.caption || payload.message;
  if (transcriptText) {
    // Log full payload keys on first few transcript events so we can see what Zoom actually sends.
    const state = getRtmsState(payload);
    if (state.transcript.length < 2) {
      console.log('RTMS webhook transcript payload keys:', Object.keys(payload).join(', '));
      console.log('RTMS webhook ts fields: start_time=%s end_time=%s timestamp=%s event_ts=%s',
        payload.start_time, payload.end_time, payload.timestamp, event.event_ts);
    }
    // start_time is the transcript-specific Unix timestamp (ms); timestamp/event_ts is the generic event time
    // and is the same for every cue in a batch, so it must not be used as the primary source.
    return ingestRtmsTranscript(payload, transcriptText, transcriptText.length, payload.start_time || payload.timestamp || event.event_ts, {
      userName: payload.speaker || payload.user_name || payload.participant_name,
      endTime: payload.end_time
    });
  }

  return { received: true, event: event.event || null };
}

async function exchangeZoomOAuthCode(code) {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const redirectUri = process.env.ZOOM_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    const missing = ['ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET', 'ZOOM_REDIRECT_URI']
      .filter(function(name) { return !process.env[name]; });
    const error = new Error('Zoom OAuth is not configured. Missing: ' + missing.join(', '));
    error.status = 503;
    throw error;
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri
  });
  const credentials = Buffer.from(clientId + ':' + clientSecret).toString('base64');
  const response = await fetch('https://zoom.us/oauth/token?' + params.toString(), {
    method: 'POST',
    headers: {
      authorization: 'Basic ' + credentials
    }
  });
  const body = await response.json().catch(function() { return {}; });
  if (!response.ok) {
    const message = body.reason || body.error_description || body.error || 'Zoom token exchange failed';
    const error = new Error(message);
    error.status = 502;
    error.details = body;
    throw error;
  }
  return body;
}

async function fetchZoomUserProfile(accessToken) {
  const response = await fetch('https://api.zoom.us/v2/users/me', {
    headers: {
      authorization: 'Bearer ' + accessToken,
      accept: 'application/json'
    }
  });
  const body = await response.json().catch(function() { return {}; });
  if (!response.ok) {
    const error = new Error(body.message || body.reason || 'Zoom profile lookup failed');
    error.status = 502;
    throw error;
  }
  return {
    id: body.id || body.user_id || '',
    email: body.email || '',
    accountId: body.account_id || '',
    displayName: [body.first_name, body.last_name].filter(Boolean).join(' ') || body.display_name || body.email || 'Zoom user'
  };
}

function safeReturnPath(value) {
  const raw = String(value || '/app');
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/app';
  return raw.slice(0, 500);
}

function createZoomLoginState(nextPath) {
  const nonce = randomBytes(16).toString('base64url');
  zoomLoginStates.set(nonce, {
    nextPath: safeReturnPath(nextPath),
    createdAt: Date.now()
  });
  return nonce;
}

function consumeZoomLoginState(nonce) {
  const state = zoomLoginStates.get(nonce);
  zoomLoginStates.delete(nonce);
  if (!state || Date.now() - state.createdAt > 10 * 60 * 1000) return null;
  return state;
}

function isAllowedGithubPath(path) {
  if (typeof path !== 'string') return false;
  const allowed = [
    /^\/repos\/[^/]+\/[^/]+$/,
    /^\/repos\/[^/]+\/[^/]+\/issues$/,
    /^\/repos\/[^/]+\/[^/]+\/issues\/\d+\/comments$/,
    /^\/repos\/[^/]+\/[^/]+\/contents\/.+$/,
    /^\/repos\/[^/]+\/[^/]+\/pulls$/,
    /^\/repos\/[^/]+\/[^/]+\/git\/refs$/,
    /^\/repos\/[^/]+\/[^/]+\/git\/refs\/.+$/,
    /^\/search\/issues$/
  ];
  return allowed.some(function(pattern) { return pattern.test(path); });
}

function isAllowedGithubGraphql(query) {
  if (typeof query !== 'string' || query.length > 5000) return false;
  return /\bquery\s+RoomClarityDiscussionCategories\b/.test(query) ||
    /\bmutation\s+RoomClarityCreateDiscussion\b/.test(query);
}

function isAllowedJiraPath(path) {
  if (typeof path !== 'string') return false;
  const allowed = [
    /^\/rest\/api\/3\/myself$/,
    /^\/rest\/api\/3\/project\/search$/,
    /^\/rest\/api\/3\/project\/[^/]+$/,
    /^\/rest\/api\/3\/search\/jql$/,           // correct JQL search endpoint (v3)
    /^\/rest\/api\/3\/issue\/[^/]+$/,
    /^\/rest\/api\/3\/issue\/[^/]+\/comment$/,
    /^\/rest\/api\/3\/issue$/,
    /^\/rest\/api\/3\/issue\/[^/]+\/remotelink$/,
    /^\/rest\/agile\/1\.0\/board$/,
    /^\/rest\/agile\/1\.0\/board\/\d+$/,
    /^\/rest\/agile\/1\.0\/board\/\d+\/sprint$/
  ];
  return allowed.some(function(pattern) { return pattern.test(path); });
}

function isAllowedConfluencePath(path) {
  if (typeof path !== 'string') return false;
  const allowed = [
    /^\/wiki\/api\/v2\/spaces$/,
    /^\/wiki\/api\/v2\/pages$/,
    /^\/wiki\/api\/v2\/pages\/\d+$/,
    /^\/wiki\/rest\/api\/content\/\d+\/metadata\/labels$/
  ];
  return allowed.some(function(pattern) { return pattern.test(path); });
}

function renderAtlassianOAuthPage(res, success, token, cloudId, site, refreshToken) {
  const origin = publicBaseUrl || 'null';
  if (success && token) {
    const safeToken = JSON.stringify(String(token));
    const safeCloudId = JSON.stringify(String(cloudId || ''));
    const safeSite = JSON.stringify(String(site || ''));
    const safeRefresh = JSON.stringify(String(refreshToken || ''));
    // Write directly to localStorage (same origin as main app) so the storage
    // event fires on the opener even if window.opener is nulled by cross-origin
    // navigation through auth.atlassian.com.
    sendOAuthHtml(res, 200, '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Atlassian connected</title></head><body><p>Connected to Atlassian. This window will close automatically.</p><script>try{localStorage.setItem(\'atlassianToken\',' + safeToken + ');localStorage.setItem(\'atlassianCloudId\',' + safeCloudId + ');localStorage.setItem(\'atlassianSite\',' + safeSite + ');localStorage.setItem(\'atlassianRefreshToken\',' + safeRefresh + ');localStorage.setItem(\'trackerProvider\',\'atlassian\');}catch(e){}try{if(window.opener)window.opener.postMessage({type:\'atlassian_token\',token:' + safeToken + ',cloudId:' + safeCloudId + ',site:' + safeSite + ',refreshToken:' + safeRefresh + '},' + JSON.stringify(origin) + ');}catch(e){}window.close();</script></body></html>');
  } else {
    sendOAuthHtml(res, 400, '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Atlassian auth failed</title></head><body><p>Atlassian authorization failed. Please close this window and try again.</p><script>try{if(window.opener)window.opener.postMessage({type:\'atlassian_error\'},' + JSON.stringify(origin) + ');}catch(e){}setTimeout(function(){window.close();},3000);</script></body></html>');
  }
}

function renderGithubOAuthPage(res, success, token) {
  const origin = publicBaseUrl || 'null';
  if (success && token) {
    const safeToken = JSON.stringify(String(token));
    sendOAuthHtml(res, 200, '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>GitHub connected</title></head><body><p>Connected to GitHub. This window will close automatically.</p><script>try{if(window.opener)window.opener.postMessage({type:\'github_token\',token:' + safeToken + '},' + JSON.stringify(origin) + ');}catch(e){}window.close();</script></body></html>');
  } else {
    sendOAuthHtml(res, 400, '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>GitHub auth failed</title></head><body><p>GitHub authorization failed. Please close this window and try again.</p><script>try{if(window.opener)window.opener.postMessage({type:\'github_error\'},' + JSON.stringify(origin) + ');}catch(e){}setTimeout(function(){window.close();},3000);</script></body></html>');
  }
}

function renderOAuthPage(req, res, status, title, message) {
  const appHref = escapeHtml(appUrl(req, '/'));
  sendHtml(res, status, '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + escapeHtml(title) + ' | Room Clarity</title><link rel="icon" type="image/png" href="/meeting-decision-maker-icon.png"><link rel="apple-touch-icon" href="/meeting-decision-maker-icon.png"><link rel="stylesheet" href="/styles.css"></head><body class="oauth-page"><div class="oauth-shell"><header class="oauth-nav" aria-label="Room Clarity"><a class="oauth-brand" href="' + appHref + '"><img src="/meeting-decision-maker-icon.png" alt="" aria-hidden="true"><span>Room Clarity</span></a></header><main class="oauth-content"><section class="oauth-card" aria-labelledby="pageTitle"><img class="oauth-mark" src="/meeting-decision-maker-icon.png" alt="" aria-hidden="true"><p class="home-kicker">Zoom authorization</p><h1 id="pageTitle">' + escapeHtml(title) + '</h1><p>' + escapeHtml(message) + '</p><div class="oauth-actions"><a class="home-button primary" href="' + appHref + '">Open Room Clarity</a><a class="home-button" href="/support.html">Support</a></div></section></main></div></body></html>');
}

function resolveStaticPath(pathname) {
  const rawPath = pathname === '/'
    ? '/home.html'
    : (pathname === '/app' || pathname === '/app/' || pathname.startsWith('/m/') ? '/index.html' : pathname);
  const decoded = decodeURIComponent(rawPath);
  const safePath = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  return join(rootDir, safePath);
}

async function serveStatic(req, res, pathname) {
  const filePath = resolveStaticPath(pathname);
  if (!filePath.startsWith(rootDir) || !existsSync(filePath)) {
    sendText(res, 404, 'Not found');
    return;
  }

  const data = await readFile(filePath);
  const contentType = mimeTypes[extname(filePath)] || 'application/octet-stream';
  const shouldCache = !contentType.includes('text/html') &&
    !contentType.includes('text/javascript') &&
    !contentType.includes('text/css');
  res.writeHead(200, withSecurityHeaders({
    'content-type': contentType,
    'cache-control': shouldCache ? 'public, max-age=300' : 'no-store'
  }));
  res.end(data);
}

async function handleApi(req, res, pathname) {
  if (req.method === 'GET' && (pathname === '/api/healthz' || pathname === '/healthz')) {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/sessions') {
    const input = await readBody(req);
    sendJson(res, 201, await createSession(input));
    return;
  }

  const recordModeMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/record-mode$/);
  if (req.method === 'POST' && recordModeMatch) {
    const limit = checkRateLimit(req, 'record-mode-update', { limit: 30, windowMs: 60_000 });
    if (!limit.allowed) {
      sendRateLimited(res, limit);
      return;
    }
    const session = await getSessionByAccessId(decodeURIComponent(recordModeMatch[1]));
    if (!session) {
      sendJson(res, 404, { error: 'Session not found' });
      return;
    }
    if (!hasSessionAccess(req, session)) {
      sendSessionAccessDenied(req, res, session);
      return;
    }
    const input = await readBody(req);
    session.recordMode = normalizeRecordMode(input.recordMode);
    await updateSession(session);
    syncRtmsStatesForSession(session);
    const existingOutput = await getMeetingOutput(session.id);
    if (existingOutput) {
      await saveMeetingOutput(Object.assign({}, existingOutput, {
        recordMode: session.recordMode,
        updatedAt: new Date().toISOString()
      }));
    }
    sendJson(res, 200, { recordMode: session.recordMode, updatedAt: session.updatedAt });
    return;
  }

  const dispositionMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/items\/([^/]+)\/disposition$/);
  if (req.method === 'POST' && dispositionMatch) {
    const limit = checkRateLimit(req, 'board-item-disposition', { limit: 60, windowMs: 60_000 });
    if (!limit.allowed) {
      sendRateLimited(res, limit);
      return;
    }
    const session = await getSessionByAccessId(decodeURIComponent(dispositionMatch[1]));
    if (!session) {
      sendJson(res, 404, { error: 'Session not found' });
      return;
    }
    if (!hasSessionAccess(req, session)) {
      sendSessionAccessDenied(req, res, session);
      return;
    }
    const input = await readBody(req);
    const itemId = decodeURIComponent(dispositionMatch[2]);
    const state = findRtmsStateForSession(session);
    let dismissed = state ? dismissRtmsBoardItem(state, itemId, input.disposition) : null;
    if (state && dismissed) {
      await persistMeetingOutputForRtmsState(state);
    } else {
      const outputs = await getMeetingOutputsForSession(session);
      for (const output of outputs) {
        const outputDismissal = dismissMeetingOutputItem(output, itemId, input.disposition);
        if (!outputDismissal) continue;
        dismissed = dismissed || outputDismissal;
        await saveMeetingOutput(output);
      }
    }
    if (!dismissed) {
      sendJson(res, 404, { error: 'Board item not found' });
      return;
    }
    sendJson(res, 200, { dismissedItem: dismissed });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/analysis/config') {
    const defaultSpec = parseAnalysisModelSpec('');
    sendJson(res, 200, {
      enabled: analysisEnabled(defaultSpec.provider),
      provider: defaultSpec.provider,
      model: defaultSpec.model,
      providers: {
        gemini: {
          enabled: analysisEnabled('gemini'),
          model: geminiModel
        },
        openai: {
          enabled: analysisEnabled('openai'),
          model: openaiModel,
          reasoningEffort: openaiReasoningEffort
        }
      },
      skillSource: 'skills/manifest.yaml'
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/analyze-cue') {
    let input = {};
    try {
      input = await readBody(req);
      sendJson(res, 200, await analyzeCueWithProvider(input));
    } catch (error) {
      const modelSpec = parseAnalysisModelSpec(input.model);
      sendJson(res, error.status || 500, {
        error: publicErrorMessage(error, 'Analysis failed'),
        provider: error.provider || modelSpec.provider,
        model: error.model || modelSpec.model
      });
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/analyze-runway') {
    let input = {};
    try {
      input = await readBody(req);
      sendJson(res, 200, await analyzeRunwayWithProvider(input));
    } catch (error) {
      sendJson(res, error.status || 500, { error: publicErrorMessage(error, 'Runway analysis failed') });
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/analyze-brief') {
    let input = {};
    try {
      input = await readBody(req);
      sendJson(res, 200, await analyzeBriefWithProvider(input));
    } catch (error) {
      sendJson(res, error.status || 500, { error: publicErrorMessage(error, 'Brief analysis failed') });
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/github/oauth/start') {
    if (!githubClientId) {
      sendJson(res, 503, { error: 'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID.' });
      return;
    }
    const params = new URLSearchParams({
      client_id: githubClientId,
      scope: 'repo',
      state: randomBytes(16).toString('hex')
    });
    res.writeHead(302, withSecurityHeaders({ location: 'https://github.com/login/oauth/authorize?' + params }));
    res.end();
    return;
  }

  if (req.method === 'GET' && pathname === '/api/github/oauth/callback') {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const code = url.searchParams.get('code');
    const githubError = url.searchParams.get('error');
    if (githubError || !code) {
      renderGithubOAuthPage(res, false, null);
      return;
    }
    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify({ client_id: githubClientId, client_secret: githubClientSecret, code })
      });
      const tokenBody = await tokenResponse.json().catch(function() { return {}; });
      if (!tokenBody.access_token) throw new Error('No access token returned');
      renderGithubOAuthPage(res, true, tokenBody.access_token);
    } catch (error) {
      renderGithubOAuthPage(res, false, null);
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/github/proxy') {
    const limit = checkRateLimit(req, 'github-proxy', { limit: 30, windowMs: 60_000 });
    if (!limit.allowed) {
      sendRateLimited(res, limit);
      return;
    }
    let input = {};
    try {
      input = await readBody(req);
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid request body' });
      return;
    }
    const { token, method, path: githubPath, body: githubBody } = input;
    if (!token || typeof token !== 'string' || token.length > 200) {
      sendJson(res, 401, { error: 'GitHub token required' });
      return;
    }
    if (!isAllowedGithubPath(githubPath)) {
      sendJson(res, 400, { error: 'GitHub API path not allowed' });
      return;
    }
    const allowedMethods = new Set(['GET', 'POST', 'PATCH', 'PUT']);
    const upperMethod = String(method || 'GET').toUpperCase();
    if (!allowedMethods.has(upperMethod)) {
      sendJson(res, 400, { error: 'GitHub API method not allowed' });
      return;
    }
    const githubUrl = 'https://api.github.com' + githubPath;
    const fetchOptions = {
      method: upperMethod,
      headers: {
        'authorization': 'Bearer ' + token,
        'accept': 'application/vnd.github+json',
        'content-type': 'application/json',
        'x-github-api-version': '2022-11-28',
        'user-agent': 'RoomClarity/1.0'
      }
    };
    if (githubBody && upperMethod !== 'GET') {
      fetchOptions.body = JSON.stringify(githubBody);
    }
    const githubSearchUrl = upperMethod === 'GET' && input.params
      ? githubUrl + '?' + new URLSearchParams(input.params).toString()
      : githubUrl;
    const githubResponse = await fetch(githubSearchUrl, fetchOptions);
    const githubResponseBody = await githubResponse.json().catch(function() { return {}; });
    sendJson(res, githubResponse.status, githubResponseBody);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/github/graphql') {
    const limit = checkRateLimit(req, 'github-graphql', { limit: 20, windowMs: 60_000 });
    if (!limit.allowed) {
      sendRateLimited(res, limit);
      return;
    }
    let input = {};
    try {
      input = await readBody(req);
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid request body' });
      return;
    }
    const { token, query, variables } = input;
    if (!token || typeof token !== 'string' || token.length > 200) {
      sendJson(res, 401, { error: 'GitHub token required' });
      return;
    }
    if (!isAllowedGithubGraphql(query)) {
      sendJson(res, 400, { error: 'GitHub GraphQL operation not allowed' });
      return;
    }
    const githubResponse = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'authorization': 'Bearer ' + token,
        'accept': 'application/vnd.github+json',
        'content-type': 'application/json',
        'user-agent': 'RoomClarity/1.0'
      },
      body: JSON.stringify({ query, variables: variables || {} })
    });
    const githubResponseBody = await githubResponse.json().catch(function() { return {}; });
    sendJson(res, githubResponse.status, githubResponseBody);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/atlassian/oauth/start') {
    if (!atlassianClientId) {
      sendJson(res, 503, { error: 'Atlassian OAuth is not configured. Set ATLASSIAN_CLIENT_ID.' });
      return;
    }
    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: atlassianClientId,
      // Classic scopes for platform (REST v3): read:jira-work, write:jira-work
      // Granular scopes for Jira Software (Agile API): read:board-scope, read:sprint
      // Do NOT mix classic + granular for the same product — causes 401 scope mismatch
      scope: 'read:jira-work write:jira-work read:board-scope:jira-software read:sprint:jira-software read:confluence-space.summary read:confluence-content.all write:confluence-content offline_access',
      redirect_uri: (publicBaseUrl || 'http://localhost:8787') + '/api/atlassian/oauth/callback',
      state: randomBytes(16).toString('hex'),
      response_type: 'code',
      prompt: 'consent'
    });
    res.writeHead(302, withSecurityHeaders({ location: 'https://auth.atlassian.com/authorize?' + params }));
    res.end();
    return;
  }

  if (req.method === 'GET' && pathname === '/api/atlassian/oauth/callback') {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const code = url.searchParams.get('code');
    const atlassianError = url.searchParams.get('error');
    if (atlassianError || !code) {
      renderAtlassianOAuthPage(res, false, null, null, null);
      return;
    }
    try {
      const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: atlassianClientId,
          client_secret: atlassianClientSecret,
          code,
          redirect_uri: (publicBaseUrl || 'http://localhost:8787') + '/api/atlassian/oauth/callback'
        })
      });
      const tokenBody = await tokenResponse.json().catch(function() { return {}; });
      if (!tokenBody.access_token) throw new Error('No access token returned');
      // Resolve the accessible resources (cloud sites) for this token
      const resourcesResponse = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
        headers: {
          'authorization': 'Bearer ' + tokenBody.access_token,
          'accept': 'application/json'
        }
      });
      const resources = await resourcesResponse.json().catch(function() { return []; });
      const site = Array.isArray(resources) && resources[0] ? resources[0] : null;
      const cloudId = site ? site.id : '';
      const siteUrl = site ? site.url : '';
      renderAtlassianOAuthPage(res, true, tokenBody.access_token, cloudId, siteUrl, tokenBody.refresh_token);
    } catch (error) {
      renderAtlassianOAuthPage(res, false, null, null, null);
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/atlassian/oauth/refresh') {
    const limit = checkRateLimit(req, 'atlassian-refresh', { limit: 10, windowMs: 60_000 });
    if (!limit.allowed) {
      sendRateLimited(res, limit);
      return;
    }
    let input = {};
    try { input = await readBody(req); } catch (e) { /* ignore */ }
    const { refreshToken } = input;
    if (!refreshToken) {
      sendJson(res, 400, { error: 'refreshToken required' });
      return;
    }
    if (!atlassianClientId || !atlassianClientSecret) {
      sendJson(res, 503, { error: 'Atlassian OAuth not configured' });
      return;
    }
    try {
      const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: atlassianClientId,
          client_secret: atlassianClientSecret,
          refresh_token: refreshToken
        })
      });
      const tokenBody = await tokenResponse.json().catch(function() { return {}; });
      if (!tokenBody.access_token) {
        sendJson(res, 401, { error: 'Token refresh failed' });
        return;
      }
      sendJson(res, 200, {
        accessToken: tokenBody.access_token,
        refreshToken: tokenBody.refresh_token || refreshToken
      });
    } catch (e) {
      sendJson(res, 500, { error: 'Token refresh error' });
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/atlassian/proxy') {
    const limit = checkRateLimit(req, 'atlassian-proxy', { limit: 30, windowMs: 60_000 });
    if (!limit.allowed) {
      sendRateLimited(res, limit);
      return;
    }
    let input = {};
    try {
      input = await readBody(req);
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid request body' });
      return;
    }
    const { token, cloudId, method, path: jiraPath, body: jiraBody } = input;
    if (!token || typeof token !== 'string' || token.length > 4000) {
      sendJson(res, 401, { error: 'Atlassian token required' });
      return;
    }
    if (!cloudId || typeof cloudId !== 'string' || cloudId.length > 100) {
      sendJson(res, 400, { error: 'Atlassian cloudId required' });
      return;
    }
    if (!isAllowedJiraPath(jiraPath)) {
      sendJson(res, 400, { error: 'Jira API path not allowed' });
      return;
    }
    const allowedMethods = new Set(['GET', 'POST', 'PUT']);
    const upperMethod = String(method || 'GET').toUpperCase();
    if (!allowedMethods.has(upperMethod)) {
      sendJson(res, 400, { error: 'Jira API method not allowed' });
      return;
    }
    const jiraUrl = 'https://api.atlassian.com/ex/jira/' + cloudId + jiraPath;
    const fetchOptions = {
      method: upperMethod,
      headers: {
        'authorization': 'Bearer ' + token,
        'accept': 'application/json',
        'content-type': 'application/json',
        'user-agent': 'RoomClarity/1.0'
      }
    };
    if (jiraBody && upperMethod !== 'GET') {
      fetchOptions.body = JSON.stringify(jiraBody);
    }
    let jiraSearchUrl = jiraUrl;
    if (upperMethod === 'GET' && input.params) {
      const qs = Object.entries(input.params)
        .map(function([k, v]) { return encodeURIComponent(k) + '=' + encodeURIComponent(v); })
        .join('&');
      jiraSearchUrl = jiraUrl + '?' + qs;
    }
    console.log('Jira proxy:', upperMethod, jiraSearchUrl.replace(/Bearer [^ ]+/, 'Bearer [redacted]'));
    const jiraResponse = await fetch(jiraSearchUrl, fetchOptions);
    const jiraResponseBody = await jiraResponse.json().catch(function() { return {}; });
    sendJson(res, jiraResponse.status, jiraResponseBody);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/confluence/proxy') {
    const limit = checkRateLimit(req, 'confluence-proxy', { limit: 20, windowMs: 60_000 });
    if (!limit.allowed) {
      sendRateLimited(res, limit);
      return;
    }
    let input = {};
    try {
      input = await readBody(req);
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid request body' });
      return;
    }
    const { token, cloudId, method, path: confluencePath, body: confluenceBody } = input;
    if (!token || typeof token !== 'string' || token.length > 4000) {
      sendJson(res, 401, { error: 'Atlassian token required' });
      return;
    }
    if (!cloudId || typeof cloudId !== 'string' || cloudId.length > 100) {
      sendJson(res, 400, { error: 'Atlassian cloudId required' });
      return;
    }
    if (!isAllowedConfluencePath(confluencePath)) {
      sendJson(res, 400, { error: 'Confluence API path not allowed' });
      return;
    }
    const allowedMethods = new Set(['GET', 'POST', 'PUT']);
    const upperMethod = String(method || 'GET').toUpperCase();
    if (!allowedMethods.has(upperMethod)) {
      sendJson(res, 400, { error: 'Confluence API method not allowed' });
      return;
    }
    const confluenceUrl = 'https://api.atlassian.com/ex/confluence/' + cloudId + confluencePath;
    const fetchOptions = {
      method: upperMethod,
      headers: {
        'authorization': 'Bearer ' + token,
        'accept': 'application/json',
        'content-type': 'application/json',
        'user-agent': 'RoomClarity/1.0'
      }
    };
    if (confluenceBody && upperMethod !== 'GET') {
      fetchOptions.body = JSON.stringify(confluenceBody);
    }
    const confluenceSearchUrl = upperMethod === 'GET' && input.params
      ? confluenceUrl + '?' + new URLSearchParams(input.params).toString()
      : confluenceUrl;
    const confluenceResponse = await fetch(confluenceSearchUrl, fetchOptions);
    const confluenceResponseBody = await confluenceResponse.json().catch(function() { return {}; });
    sendJson(res, confluenceResponse.status, confluenceResponseBody);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/zoom/login/start') {
    if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_REDIRECT_URI) {
      sendJson(res, 503, { error: 'Zoom OAuth is not configured. Set ZOOM_CLIENT_ID and ZOOM_REDIRECT_URI.' });
      return;
    }
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const nonce = createZoomLoginState(url.searchParams.get('next') || '/app');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.ZOOM_CLIENT_ID,
      redirect_uri: process.env.ZOOM_REDIRECT_URI,
      state: 'login:' + nonce
    });
    res.writeHead(302, withSecurityHeaders({ location: 'https://zoom.us/oauth/authorize?' + params.toString() }));
    res.end();
    return;
  }

  if (req.method === 'GET' && pathname === '/api/zoom/me') {
    const user = zoomUserFromRequest(req);
    if (!user) {
      sendJson(res, 401, { authenticated: false });
      return;
    }
    sendJson(res, 200, {
      authenticated: true,
      user: {
        id: user.id || '',
        email: user.email || '',
        accountId: user.accountId || '',
        displayName: user.displayName || user.email || 'Zoom user'
      }
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/zoom/logout') {
    clearZoomUserCookie(req, res);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/zoom/oauth/callback') {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state') || 'development';
    const zoomError = url.searchParams.get('error');

    if (zoomError) {
      renderOAuthPage(req, res, 400, 'Zoom authorization was cancelled', zoomError);
      return;
    }
    if (!code || code === 'missing') {
      renderOAuthPage(req, res, 400, 'Zoom authorization needs a code', 'Zoom did not send an authorization code. Try adding the app again from Local Test.');
      return;
    }

    try {
      const token = await exchangeZoomOAuthCode(code);
      if (stateParam.startsWith('login:')) {
        const loginState = consumeZoomLoginState(stateParam.slice('login:'.length));
        if (!loginState) {
          renderOAuthPage(req, res, 400, 'Zoom sign-in expired', 'Please return to the Room Clarity meeting link and sign in again.');
          return;
        }
        const user = await fetchZoomUserProfile(token.access_token);
        setZoomUserCookie(req, res, user);
        sendRedirect(res, loginState.nextPath, 302);
        return;
      }
      const installationId = randomUUID();
      oauthInstallations.set(installationId, {
        state: stateParam,
        scope: token.scope || '',
        tokenType: token.token_type || 'bearer',
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: Date.now() + Number(token.expires_in || 0) * 1000,
        installedAt: new Date().toISOString()
      });
      renderOAuthPage(req, res, 200, 'Room Clarity connected', 'Zoom authorized the development app. You can now open it from the Zoom Apps panel during a meeting.');
    } catch (error) {
      const status = error.status || 500;
      renderOAuthPage(req, res, status, 'Zoom authorization could not finish', 'Zoom authorization failed. Please try again or contact support.');
    }
    return;
  }

  const sessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (req.method === 'GET' && sessionMatch) {
    const limit = checkRateLimit(req, 'session-read', { limit: 30, windowMs: 60_000 });
    if (!limit.allowed) {
      sendRateLimited(res, limit);
      return;
    }
    const session = await getSession(sessionMatch[1]);
    if (!session) {
      sendJson(res, 404, { error: 'Session not found' });
      return;
    }
    if (!hasSessionAccess(req, session)) {
      sendSessionAccessDenied(req, res, session);
      return;
    }
    sendJson(res, 200, sessionForResponse(session, getDashboardTokenFromRequest(req)));
    return;
  }

  const meetingOutputMatch = pathname.match(/^\/api\/meeting-outputs\/([^/]+)$/);
  if (req.method === 'GET' && meetingOutputMatch) {
    const limit = checkRateLimit(req, 'meeting-output-read', { limit: 30, windowMs: 60_000 });
    if (!limit.allowed) {
      sendRateLimited(res, limit);
      return;
    }
    const session = await getSession(meetingOutputMatch[1]);
    if (!session) {
      sendJson(res, 404, { error: 'Session not found' });
      return;
    }
    if (!hasSessionAccess(req, session)) {
      sendSessionAccessDenied(req, res, session);
      return;
    }
    const output = await getMeetingOutput(session.id);
    if (!output) {
      sendJson(res, 404, { error: 'Meeting output not found' });
      return;
    }
    sendJson(res, 200, output);
    return;
  }

  const rtmsStateMatch = pathname.match(/^\/api\/rtms\/sessions\/([^/]+)$/);
  if (req.method === 'GET' && rtmsStateMatch) {
    const limit = checkRateLimit(req, 'rtms-session-read', { limit: 30, windowMs: 60_000 });
    if (!limit.allowed) {
      sendRateLimited(res, limit);
      return;
    }
    const requestedId = decodeURIComponent(rtmsStateMatch[1]);
    const state = rtmsSessionStates.get(requestedId) ||
      Array.from(rtmsSessionStates.values()).find(function(s) {
        return String(s.meetingUuid || '') === requestedId ||
          String(s.streamId || '') === requestedId ||
          String(s.sessionId || '') === requestedId ||
          (!s.meetingUuid && String(s.meetingId || '') === requestedId);
      });
    if (!state) {
      sendJson(res, 404, { error: 'RTMS session not found' });
      return;
    }
    if (!await hasRtmsDashboardAccess(req, state, requestedId)) {
      sendJson(res, 403, { error: 'Invalid or missing dashboard token' });
      return;
    }
    sendJson(res, 200, state);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/rtms/sessions') {
    const limit = checkRateLimit(req, 'rtms-session-list', { limit: 20, windowMs: 60_000 });
    if (!limit.allowed) {
      sendRateLimited(res, limit);
      return;
    }
    if (!hasServiceAdminAccess(req)) {
      sendJson(res, 403, { error: 'Service admin access required' });
      return;
    }
    sendJson(res, 200, {
      sessions: Array.from(rtmsSessionStates.values()).map(function(state) {
        return {
          id: state.id,
          meetingUuid: state.meetingUuid,
          streamId: state.streamId,
          status: state.status,
          statusReason: state.statusReason,
          transcriptCount: state.transcript.length,
          decisionCount: state.decisions.length,
          riskCount: state.risks.length,
          actionCount: state.actions.length,
          agentIssueCount: state.openAgentIssues.length,
          updatedAt: state.updatedAt
        };
      })
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/zoom/rtms-webhook') {
    const rawBody = await readRawBody(req);
    const event = rawBody ? JSON.parse(rawBody) : {};
    if (!verifyZoomWebhookSignature(req, rawBody, event)) {
      sendJson(res, 401, { error: 'Invalid Zoom webhook signature' });
      return;
    }
    if (event.event === 'endpoint.url_validation') {
      sendJson(res, 200, await handleRtmsWebhookEvent(event));
      return;
    }
    sendJson(res, 202, { received: true, event: event.event || null });
    handleRtmsWebhookEvent(event).catch(function(error) {
      console.error('RTMS webhook processing failed:', event.event || 'unknown', error.message);
    });
    return;
  }

  sendJson(res, 404, { error: 'API route not found' });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const redirectUrl = canonicalRedirectUrl(req);
    if (redirectUrl) {
      sendRedirect(res, redirectUrl);
      return;
    }
    if (url.pathname.startsWith('/api/') || url.pathname === '/healthz') {
      await handleApi(req, res, url.pathname);
      return;
    }
    await serveStatic(req, res, url.pathname);
  } catch (error) {
    console.error('Request failed:', req.method, req.url, error);
    sendJson(res, error.status || 500, { error: publicErrorMessage(error, 'Internal server error') });
  }
});

server.listen(port, () => {
  console.log(`Meeting Decision Maker listening on http://localhost:${port}`);
});

server.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
