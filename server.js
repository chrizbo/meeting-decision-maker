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
const oauthInstallations = new Map();
const useFirestore = process.env.SESSION_STORE === 'firestore';
const firestore = useFirestore ? new Firestore() : null;
const sessionsCollection = process.env.FIRESTORE_SESSIONS_COLLECTION || 'meetingSessions';
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const openaiApiKey = process.env.OPENAI_API_KEY || '';
const openaiModel = process.env.OPENAI_MODEL || 'gpt-5.4';
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

function withSecurityHeaders(headers = {}) {
  return { ...securityHeaders, ...headers };
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

function appUrl(req, path) {
  if (publicBaseUrl) return `${publicBaseUrl}${path}`;
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  return `${proto}://${host}${path}`;
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
  const allowedAgents = new Set(['Assumptions Challenge', 'Pre-Mortem', 'Argument Dissection']);
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
    openAgentIssues: []
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
    return topicSimilarity(candidate, existing) >= 0.62;
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

function hasDistinctDecisionObject(candidate, existing) {
  const candidateNouns = decisionObjectWords(candidate);
  const existingNouns = decisionObjectWords(existing);
  if (!candidateNouns.size || !existingNouns.size) return false;
  const overlap = [...candidateNouns].some(function(word) { return existingNouns.has(word); });
  if (overlap) return false;
  const candidateText = String(candidate || '').toLowerCase();
  const existingText = String(existing || '').toLowerCase();
  return /\b(decision|decide|choose|choosing|accepted|forming|pending)\b/.test(candidateText + ' ' + existingText);
}

function decisionObjectWords(text) {
  const generic = new Set([
    'accepted', 'agreement', 'candidate', 'choose', 'choosing', 'commitment', 'decide',
    'decision', 'direction', 'discourse', 'forming', 'option', 'pending', 'proposal',
    'question', 'scope', 'tradeoff'
  ]);
  return new Set(topicWords(text).filter(function(word) { return !generic.has(word); }));
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
    'about', 'after', 'against', 'because', 'between', 'could', 'decision', 'decide',
    'first', 'focus', 'from', 'have', 'into', 'meeting', 'should', 'that', 'their',
    'there', 'this', 'whether', 'while', 'with', 'would'
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
    'Use the loaded meeting skills to analyze one live transcript cue.',
    'Return only JSON with this shape: {"items":[{"type":"decision|risk|action|agent_issue","updateMode":"create|update","targetId":"existing item id when updating","title":"short title","summary":"short board-ready summary","status":"forming|pending|accepted|rejected","agent":"Assumptions Challenge|Pre-Mortem|Argument Dissection","priority":"low|medium|high"}]}.',
    'Rules: emit no more than 2 items; prefer no item over weak speculation; preserve uncertainty; do not invent owners or agreement; for agent_issue items include agent and priority.',
    'Operational priority: extract durable meeting artifacts first. Do not let agent_issue selectivity suppress real decisions, risks, or actions.',
    'Decision status rules: use "forming" when a real decision topic, tradeoff, option set, or decision question is being discussed but the group has not committed. A forming decision with disagreement or missing evidence must say there is no consensus yet in the summary. Use "pending" when there is a concrete proposed decision ready for host confirmation. Use "accepted" only when the transcript contains explicit agreement or decision language. Never move an accepted decision back to forming or pending unless the transcript explicitly corrects the record.',
    'Preference-as-decision guardrail: one person saying "I think", "I want", "my preference", or naming a disliked implementation is not enough to create a decision. If others challenge the evidence, ask for measurements, or say they are not asking for approval, treat it as discourse, risk, or an agent_issue until the transcript frames a decision question or option tradeoff.',
    'Use Current meeting state before creating new items. If the latest cue continues the same decision question, return updateMode "update" with that item targetId. Update summaries should be the current best concise state, not a running log of the conversation. Create a new decision when the cue introduces a distinct decision object, surface, feature, policy, access choice, retention choice, or interaction pattern, even if it belongs under the same product area.',
    'Do not create separate decision items for each side of the same tradeoff. Keep one forming decision topic and update it as the conversation evolves. Do not let a broad parent decision absorb later distinct implementation decisions. Do not emit a risk just because the cue names uncertainty; emit a risk only when there is a plausible negative outcome, dependency, blocker, mitigation, warning sign, cognitive/social bias, or option-value loss. Do not emit an item on every cue.',
    'Risk rules: if a cue names a concrete downside, failure path, blocker, stakeholder concern, mitigation, warning sign, or option-value loss, emit or update a risk even if an agent_issue would also be useful. Risk cards are durable artifacts; agent_issue cards are live facilitation nudges.',
    'Agent issue rules: throttle only agent_issue items. Do not emit an agent_issue simply because a skill could comment. Emit one only when the host could use it immediately to improve the decision discourse, expose a central assumption, name a major failure path, or challenge weak evidence. If the same concern repeats, update the existing open agent_issue instead of creating another.',
    'Agent trigger rules: when the cue says "what has to be true", "my assumption is", or names an important untested assumption, consider an Assumptions Challenge issue. When the cue says "if we imagine this failing", "fails because", "warning sign", or names a serious failure path, consider a Pre-Mortem issue. When the cue asks "what evidence do we have", distinguishes intuition from evidence, or challenges rationale quality, consider an Argument Dissection issue. Emit at most one agent_issue for a cue.',
    'Action rules: emit an action when the transcript explicitly says "Action:", "next action", "I will", "can you", or names concrete follow-up work after the meeting. The labels "Action:" and "next action" override the general caution about future product ideas. Do not emit actions for general future product ideas, mitigations, or things the current prototype might eventually need unless the cue frames them as a next action or explicit follow-up.',
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
    '# Recent transcript window',
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
                  agent: { type: 'string', enum: ['', 'Assumptions Challenge', 'Pre-Mortem', 'Argument Dissection'] },
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
    createdAt: input.createdAt,
    updatedAt: input.updatedAt
  };
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

async function getSession(id) {
  if (!firestore) return sessions.get(id) || null;
  const snapshot = await firestore.collection(sessionsCollection).doc(id).get();
  if (!snapshot.exists) return null;
  return snapshot.data();
}

async function getSessionByAccessId(id) {
  if (!id) return null;
  const direct = await getSession(id);
  if (direct) return direct;

  if (!firestore) {
    return Array.from(sessions.values()).find(function(session) {
      return session.publicSessionId === id || session.zoomMeetingId === id || session.zoomMeetingUuid === id;
    }) || null;
  }

  const snapshot = await firestore.collection(sessionsCollection)
    .where('zoomMeetingId', '==', id)
    .limit(1)
    .get();
  if (!snapshot.empty) return snapshot.docs[0].data();

  const uuidSnapshot = await firestore.collection(sessionsCollection)
    .where('zoomMeetingUuid', '==', id)
    .limit(1)
    .get();
  return uuidSnapshot.empty ? null : uuidSnapshot.docs[0].data();
}

async function hasRtmsDashboardAccess(req, state, requestedId) {
  const candidates = [
    requestedId,
    state && state.id,
    state && state.meetingUuid,
    state && state.sessionId,
    state && state.streamId
  ].filter(Boolean);

  for (const id of candidates) {
    const session = await getSessionByAccessId(id);
    if (session && hasValidDashboardToken(req, session)) return true;
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
    accessMode: input.accessMode || 'linkViewable',
    topic: input.topic || 'Untitled meeting',
    host: input.host || 'Meeting host',
    attendees: Array.isArray(input.attendees) ? input.attendees : [],
    zoomMeetingId: input.zoomMeetingId || null,
    zoomMeetingUuid: input.meetingUuid || null,
    platform: input.platform || 'web',
    createdAt,
    updatedAt: createdAt
  };
  await saveSession(session);
  return Object.assign(sessionForResponse(session, dashboardToken), { dashboardToken });
}

function rtmsKey(payload = {}) {
  return payload.meeting_uuid || payload.webinar_uuid || payload.session_id || payload.engagement_id || payload.rtms_stream_id || 'unknown';
}

function getRtmsState(payload = {}) {
  const key = rtmsKey(payload);
  if (!rtmsSessionStates.has(key)) {
    rtmsSessionStates.set(key, Object.assign(emptyMeetingState(), {
      id: key,
      meetingUuid: payload.meeting_uuid || null,
      webinarUuid: payload.webinar_uuid || null,
      sessionId: payload.session_id || null,
      engagementId: payload.engagement_id || null,
      streamId: payload.rtms_stream_id || null,
      transcript: [],
      analyses: [],
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

async function ingestRtmsTranscript(payload, buffer, size, timestamp, metadata = {}) {
  const state = getRtmsState(payload);
  const text = normalizeTranscriptText(buffer, size);
  if (!text) return { ignored: true, reason: 'empty transcript' };

  const rawTs = timestamp != null ? timestamp : (metadata.startTs != null ? metadata.startTs : payload.event_ts);
  if (state.transcript.length === 0) console.log('RTMS first cue raw timestamp:', rawTs, 'type:', typeof rawTs);
  const start = normalizedTranscriptStart(rawTs, state, metadata);
  const rawEnd = metadata.endTime != null ? Number(metadata.endTime) : null;
  const parsedEnd = rawEnd != null && Number.isFinite(rawEnd) ? timestampToSeconds(rawEnd, state) : null;
  const end = (parsedEnd != null && parsedEnd > start) ? parsedEnd : start + 3;
  const cue = {
    id: randomUUID(),
    start,
    end,
    speaker: metadata.userName || metadata.displayName || metadata.user || 'Zoom participant',
    text,
    evidence: `${formatServerTime(start)} · ${metadata.userName || metadata.displayName || 'Zoom participant'}`
  };

  state.transcript.push(cue);
  state.transcript = state.transcript.slice(-200);
  state.updatedAt = new Date().toISOString();

  let analysis = null;
  if (analysisEnabled()) {
    analysis = await analyzeCueWithProvider({
      cue,
      transcriptWindow: transcriptWindowForServerCue(state, cue),
      meetingState: serverMeetingStateForAnalysis(state)
    });
    applyServerAnalysisItems(state, analysis.items || [], cue);
    state.analyses.unshift(analysis);
    state.analyses = state.analyses.slice(0, 50);
  }

  return {
    ignored: false,
    sessionId: state.id,
    cue,
    analysis
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

  client.onJoinConfirm(function(reason) {
    console.log('RTMS join confirmed:', key, reason);
    state.status = 'active';
    state.statusReason = reason || null;
    state.updatedAt = new Date().toISOString();
  });
  let transcriptCount = 0;
  client.onTranscriptData(function(buffer, size, timestamp, metadata) {
    if (transcriptCount === 0) console.log('RTMS first transcript:', key, 'user:', metadata && metadata.userName);
    transcriptCount++;
    ingestRtmsTranscript(payload, buffer, size, timestamp, Object.assign({ timestampUnit: 'ns' }, metadata)).catch(function(error) {
      console.error('RTMS transcript analysis failed:', error.message);
    });
  });
  client.onLeave(function(reason) {
    console.log('RTMS leave:', key, 'reason:', reason, 'status:', state.status);
    if (!['stopped', 'interrupted'].includes(state.status)) {
      state.status = 'ended';
      state.statusReason = reason || null;
    }
    state.updatedAt = new Date().toISOString();
    deleteRtmsClientReferences(client);
  });

  const joined = client.join(Object.assign({}, payload, {
    client: process.env.ZM_RTMS_CLIENT || process.env.ZOOM_CLIENT_ID,
    secret: process.env.ZM_RTMS_SECRET || process.env.ZOOM_CLIENT_SECRET,
    pollInterval: Number(process.env.RTMS_POLL_INTERVAL_MS || 10),
    ca: process.env.RTMS_CA_PATH || '/etc/ssl/certs/ca-certificates.crt'
  }));
  if (!joined) {
    state.status = 'start_failed';
    state.statusReason = 'client.join returned false';
    state.updatedAt = new Date().toISOString();
    rtmsClients.delete(key);
    rtmsClients.delete(payload.rtms_stream_id);
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
  if (event.event === 'meeting.rtms_started' || event.event === 'webinar.rtms_started' || event.event === 'session.rtms_started') {
    return startRtmsClient(payload);
  }
  if (event.event === 'meeting.rtms_stopped' || event.event === 'meeting.rtms_interrupted' ||
      event.event === 'webinar.rtms_stopped' || event.event === 'session.rtms_stopped') {
    const state = getRtmsState(payload);
    state.status = event.event.endsWith('rtms_interrupted') ? 'interrupted' : 'stopped';
    state.statusReason = payload.reason || payload.error_message || null;
    state.updatedAt = new Date().toISOString();
    return { stopped: stopRtmsClient(payload), sessionId: rtmsKey(payload) };
  }

  if (event.event === 'rtms.start_failed' ||
      event.event === 'rtms.concurrency_limited' ||
      event.event === 'rtms.concurrency_near_limit') {
    const state = getRtmsState(payload);
    state.status = event.event.replace(/^rtms\./, '');
    state.statusReason = payload.reason || payload.error_message || payload.message || null;
    state.updatedAt = new Date().toISOString();
    return { received: true, event: event.event, sessionId: state.id };
  }

  const transcriptText = payload.text || payload.transcript || payload.caption || payload.message;
  if (transcriptText) {
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
        error: error.message || 'Analysis failed',
        provider: error.provider || modelSpec.provider,
        model: error.model || modelSpec.model
      });
    }
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
      renderOAuthPage(req, res, status, 'Zoom authorization could not finish', error.message || 'Unknown error');
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
    if (!hasValidDashboardToken(req, session)) {
      sendJson(res, 403, { error: 'Invalid or missing dashboard token' });
      return;
    }
    sendJson(res, 200, sessionForResponse(session, getDashboardTokenFromRequest(req)));
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
        return s.meetingUuid === requestedId || s.streamId === requestedId || s.sessionId === requestedId;
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
    const result = await handleRtmsWebhookEvent(event);
    const status = event.event === 'endpoint.url_validation' ? 200 : 202;
    sendJson(res, status, result);
    return;
  }

  sendJson(res, 404, { error: 'API route not found' });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/') || url.pathname === '/healthz') {
      await handleApi(req, res, url.pathname);
      return;
    }
    await serveStatic(req, res, url.pathname);
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message || 'Internal server error' });
  }
});

server.listen(port, () => {
  console.log(`Meeting Decision Maker listening on http://localhost:${port}`);
});

server.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
