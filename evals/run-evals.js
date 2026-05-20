import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const evalDir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const liveIndex = args.indexOf('--live');
const liveBaseUrl = liveIndex >= 0 ? args[liveIndex + 1] : '';
const caseIndex = args.indexOf('--case');
const caseFilter = caseIndex >= 0 ? args[caseIndex + 1] : '';
const modelIndex = args.indexOf('--model');
const modelsIndex = args.indexOf('--models');
const evalModels = parseEvalModels();
const judgeEnabled = args.includes('--judge') || process.env.EVAL_JUDGE === '1';
const judgeModel = process.env.EVAL_JUDGE_MODEL || 'gemini-2.5-pro';
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const timingToleranceSeconds = 8;
const titleSimilarityThreshold = 0.35;
const liveRetryCount = 2;
const liveRetryDelayMs = 1200;

function parseEvalModels() {
  const raw = modelsIndex >= 0
    ? args[modelsIndex + 1]
    : (modelIndex >= 0 ? args[modelIndex + 1] : process.env.EVAL_MODELS || process.env.EVAL_MODEL || '');
  return String(raw || '')
    .split(',')
    .map(function(model) { return model.trim(); })
    .filter(Boolean);
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
  if (!match) return { speaker: 'Unknown', text };
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
      text: parsed.text,
      evidence: formatTime(parseTimestamp(times[0])) + ' · ' + parsed.speaker
    }];
  }).sort(function(a, b) { return a.start - b.start; });
}

function formatTime(seconds) {
  const total = Math.floor(seconds);
  return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
}

function transcriptWindowForCue(cues, cue) {
  const index = cues.findIndex(function(item) { return item.id === cue.id; });
  const end = index >= 0 ? index + 1 : cues.length;
  const windowStart = Math.max(0, cue.start - 90);
  return cues.slice(0, end).filter(function(item) {
    return item.start >= windowStart;
  }).slice(-12);
}

function emptyMeetingState() {
  return {
    decisions: [],
    risks: [],
    actions: [],
    openAgentIssues: []
  };
}

function compactMeetingState(state) {
  return {
    decisions: state.decisions.slice(0, 8),
    risks: state.risks.slice(0, 8),
    actions: state.actions.slice(0, 8),
    openAgentIssues: state.openAgentIssues.slice(0, 8)
  };
}

function applyItemsToState(state, items, cue) {
  items.forEach(function(item) {
    if (item.updateMode === 'update' && updateStateItem(state, item, cue)) return;

    const record = {
      id: item.id || `${item.type}-${state.nextId++}`,
      title: item.title,
      summary: item.summary,
      evidence: cue.evidence,
      status: item.status,
      agent: item.agent,
      priority: item.priority
    };

    if (item.type === 'decision') state.decisions.unshift(record);
    if (item.type === 'risk') state.risks.unshift(record);
    if (item.type === 'action') state.actions.unshift(record);
    if (item.type === 'agent_issue') state.openAgentIssues.unshift(record);
  });
}

function updateStateItem(state, item, cue) {
  const list = stateListForType(state, item.type);
  const existing = item.targetId
    ? list.find(function(record) { return record.id === item.targetId; })
    : list.find(function(record) {
      return record.title && item.title && record.title.toLowerCase() === item.title.toLowerCase();
    });
  if (!existing) return false;

  if (item.title) existing.title = item.title;
  if (item.summary) existing.summary = item.summary;
  if (item.status) existing.status = item.status;
  if (item.priority) existing.priority = item.priority;
  existing.evidence = cue.evidence;
  return true;
}

function stateListForType(state, type) {
  if (type === 'decision') return state.decisions;
  if (type === 'risk') return state.risks;
  if (type === 'action') return state.actions;
  if (type === 'agent_issue') return state.openAgentIssues;
  return [];
}

function fixtureEventsForCue(fixture, cue) {
  const event = fixture.events.find(function(record) {
    return Math.abs(Number(record.at) - cue.start) < 0.01;
  });
  return event ? event.items : [];
}

async function liveEventsForCue(baseUrl, cues, cue, meetingState, model) {
  let lastError = null;
  const startedAt = performance.now();
  for (let attempt = 0; attempt <= liveRetryCount; attempt += 1) {
    try {
      const response = await fetch(baseUrl.replace(/\/$/, '') + '/api/analyze-cue', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cue: {
            id: cue.id,
            start: cue.start,
            end: cue.end,
            speaker: cue.speaker,
            text: cue.text,
            evidence: cue.evidence
          },
          transcriptWindow: transcriptWindowForCue(cues, cue),
          meetingState: compactMeetingState(meetingState),
          model: model || undefined
        })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`${response.status} ${body}`);
      }

      const result = await response.json();
      return {
        items: Array.isArray(result.items) ? result.items : [],
        durationMs: performance.now() - startedAt
      };
    } catch (error) {
      lastError = error;
      if (attempt < liveRetryCount) await delay(liveRetryDelayMs * (attempt + 1));
    }
  }

  throw new Error(`Live analysis failed at ${cue.start}s after ${liveRetryCount + 1} attempts: ${lastError.message}`);
}

function delay(ms) {
  return new Promise(function(resolveDelay) {
    setTimeout(resolveDelay, ms);
  });
}

function normalizeWords(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(function(word) { return word.length > 2; });
}

function jaccardSimilarity(a, b) {
  const left = new Set(normalizeWords(a));
  const right = new Set(normalizeWords(b));
  if (!left.size && !right.size) return 1;
  const intersection = [...left].filter(function(word) { return right.has(word); }).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function flattenEvents(events) {
  return events.flatMap(function(event) {
    return event.items.map(function(item) {
      return {
        at: Number(event.at),
        type: item.type,
        title: item.title || item.summary || item.agent || '',
        summary: item.summary,
        status: item.status || '',
        updateMode: item.updateMode || 'create',
        targetId: item.targetId || '',
        agent: item.agent || '',
        priority: item.priority || ''
      };
    });
  });
}

function scoreEvents(expectedEvents, actualEvents) {
  const expected = flattenEvents(expectedEvents);
  const actual = flattenEvents(actualEvents);
  const usedActualIndexes = new Set();
  const matches = [];
  const misses = [];

  expected.forEach(function(expectedItem) {
    let best = null;
    actual.forEach(function(actualItem, index) {
      if (usedActualIndexes.has(index)) return;
      if (actualItem.type !== expectedItem.type) return;
      if (Math.abs(actualItem.at - expectedItem.at) > timingToleranceSeconds) return;
      const titleScore = itemSimilarity(expectedItem, actualItem);
      if (titleScore < titleSimilarityThreshold) return;
      const score = titleScore - Math.abs(actualItem.at - expectedItem.at) / 100;
      if (!best || score > best.score) best = { index, actualItem, titleScore, score };
    });

    if (best) {
      usedActualIndexes.add(best.index);
      matches.push({ expected: expectedItem, actual: best.actualItem, titleScore: best.titleScore });
    } else {
      misses.push(expectedItem);
    }
  });

  const unmatched = actual.filter(function(_item, index) {
    return !usedActualIndexes.has(index);
  });
  const toleratedUpdates = unmatched.filter(function(item) {
    return item.updateMode === 'update' && item.targetId;
  });
  const falsePositives = unmatched.filter(function(item) {
    return !(item.updateMode === 'update' && item.targetId);
  });
  const duplicateDecisionTopics = findDuplicateDecisionTopics(actual, matches.map(function(match) {
    return match.actual;
  }));

  const scoredActualCount = actual.length - toleratedUpdates.length;
  const precision = scoredActualCount ? matches.length / scoredActualCount : 1;
  const recall = expected.length ? matches.length / expected.length : 1;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    expectedCount: expected.length,
    actualCount: actual.length,
    scoredActualCount,
    matchedCount: matches.length,
    precision,
    recall,
    f1,
    matches,
    misses,
    falsePositives,
    toleratedUpdates,
    duplicateDecisionTopics
  };
}

function itemSimilarity(expectedItem, actualItem) {
  const expectedText = [expectedItem.title, expectedItem.summary].filter(Boolean).join(' ');
  const actualText = [actualItem.title, actualItem.summary].filter(Boolean).join(' ');
  return Math.max(jaccardSimilarity(expectedText, actualText), topicSimilarity(expectedText, actualText));
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

function findDuplicateDecisionTopics(actualItems, matchedItems) {
  const matched = new Set(matchedItems);
  const decisions = actualItems.filter(function(item) {
    return item.type === 'decision' && item.updateMode !== 'update';
  });
  const duplicates = [];
  decisions.forEach(function(item, index) {
    const isDuplicate = decisions.slice(0, index).some(function(previous) {
      return Math.abs(item.at - previous.at) <= 90 && itemSimilarity(previous, item) >= 0.42;
    });
    if (isDuplicate && !matched.has(item)) duplicates.push(item);
  });
  return duplicates;
}

async function runEval(casePath, options = {}) {
  const model = options.model || '';
  const evalCase = JSON.parse(await readFile(casePath, 'utf8'));
  const transcriptPath = resolve(dirname(casePath), evalCase.transcript);
  const transcript = parseVtt(await readFile(transcriptPath, 'utf8'));
  const expectedFixture = evalCase.expected
    ? JSON.parse(await readFile(resolve(dirname(casePath), evalCase.expected), 'utf8'))
    : evalCase;
  const meetingState = Object.assign(emptyMeetingState(), { nextId: 1 });
  const actualEvents = [];
  const errors = [];
  const timings = [];

  for (const cue of transcript) {
    let items = [];
    try {
      if (liveBaseUrl) {
        const liveResult = await liveEventsForCue(liveBaseUrl, transcript, cue, meetingState, model);
        items = liveResult.items;
        timings.push(liveResult.durationMs);
      } else {
        items = fixtureEventsForCue(expectedFixture, cue);
      }
    } catch (error) {
      errors.push({ at: cue.start, message: error.message });
    }
    if (items.length) {
      actualEvents.push({ at: cue.start, items });
      applyItemsToState(meetingState, items, cue);
    }
  }

  return {
    name: evalCase.name,
    mode: liveBaseUrl ? 'live' : 'fixture',
    model,
    score: scoreEvents(expectedFixture.events, actualEvents),
    judge: await maybeJudgeCase(evalCase, transcript, expectedFixture, actualEvents),
    errors,
    timing: summarizeTimings(timings)
  };
}

async function discoverEvalCases() {
  if (caseFilter) return [resolve(evalDir, caseFilter)];

  const legacyCase = resolve(evalDir, 'product-decision-demo.eval.json');
  const casesDir = resolve(evalDir, 'cases');
  let caseFiles = [];
  try {
    const entries = await readdir(casesDir, { withFileTypes: true });
    caseFiles = entries
      .filter(function(entry) { return entry.isDirectory(); })
      .map(function(entry) { return join(casesDir, entry.name, 'expected.json'); });
  } catch (_error) {
    caseFiles = [];
  }

  return [legacyCase].concat(caseFiles);
}

function percent(value) {
  return `${Math.round(value * 1000) / 10}%`;
}

function summarizeTimings(values) {
  if (!values.length) {
    return {
      count: 0,
      totalMs: 0,
      avgMs: 0,
      maxMs: 0
    };
  }
  const totalMs = values.reduce(function(sum, value) { return sum + value; }, 0);
  return {
    count: values.length,
    totalMs,
    avgMs: totalMs / values.length,
    maxMs: Math.max(...values)
  };
}

function formatDuration(ms) {
  if (!ms) return 'n/a';
  return `${Math.round(ms / 100) / 10}s`;
}

function printResult(result) {
  const score = result.score;
  const modelSuffix = result.model ? ` · ${result.model}` : '';
  console.log(`\n${result.name} (${result.mode}${modelSuffix})`);
  console.log(`  expected: ${score.expectedCount}`);
  console.log(`  actual:   ${score.actualCount}`);
  if (score.toleratedUpdates.length) console.log(`  updates:  ${score.toleratedUpdates.length} tolerated`);
  console.log(`  matched:  ${score.matchedCount}`);
  console.log(`  precision ${percent(score.precision)} · recall ${percent(score.recall)} · f1 ${percent(score.f1)}`);
  if (result.timing.count) {
    console.log(`  avg response ${formatDuration(result.timing.avgMs)} · max ${formatDuration(result.timing.maxMs)} · cues ${result.timing.count}`);
  }

  if (result.errors.length) {
    console.log(`\n  Live errors: ${result.errors.length}`);
    result.errors.slice(0, 5).forEach(function(error) {
      console.log(`  - ${formatTime(error.at)} ${error.message}`);
    });
  }

  if (score.misses.length) {
    console.log('\n  Misses');
    byTime(score.misses).slice(0, 12).forEach(function(item) {
      console.log(`  - ${formatTime(item.at)} ${item.type}: ${item.title}`);
    });
  }

  if (score.falsePositives.length) {
    console.log('\n  False positives');
    byTime(score.falsePositives).slice(0, 12).forEach(function(item) {
      console.log(`  - ${formatTime(item.at)} ${item.type}: ${item.title}`);
    });
  }

  if (score.toleratedUpdates.length) {
    console.log('\n  Tolerated updates');
    byTime(score.toleratedUpdates).slice(0, 12).forEach(function(item) {
      console.log(`  - ${formatTime(item.at)} ${item.type}: ${item.title}`);
    });
  }

  if (score.duplicateDecisionTopics.length) {
    console.log('\n  Duplicate decision topics');
    byTime(score.duplicateDecisionTopics).slice(0, 12).forEach(function(item) {
      console.log(`  - ${formatTime(item.at)} ${item.title}`);
    });
  }

  if (score.matches.length) {
    console.log('\n  Matched');
    byTime(score.matches.map(function(match) { return match.actual; })).slice(0, 12).forEach(function(item) {
      console.log(`  - ${formatTime(item.at)} ${item.type}: ${item.title}`);
    });
  }

  if (result.judge) {
    printJudgeResult(result.judge);
  }
}

function byTime(items) {
  return items.slice().sort(function(left, right) {
    return left.at - right.at;
  });
}

const casePaths = await discoverEvalCases();
const modelRuns = liveBaseUrl && evalModels.length ? evalModels : [''];
const aggregateResults = [];

for (const model of modelRuns) {
  if (model) console.log(`\n## Model: ${model}`);
  const results = [];
  for (const casePath of casePaths) {
    const result = await runEval(casePath, { model });
    results.push(result);
    printResult(result);
  }

  const aggregate = aggregateScores(results);
  aggregateResults.push({ model, aggregate });
  if (results.length > 1) {
    const modelSuffix = model ? ` · ${model}` : '';
    console.log(`\nall cases${modelSuffix}`);
    console.log(`  expected: ${aggregate.expectedCount}`);
    console.log(`  actual:   ${aggregate.actualCount}`);
    console.log(`  matched:  ${aggregate.matchedCount}`);
    console.log(`  precision ${percent(aggregate.precision)} · recall ${percent(aggregate.recall)} · f1 ${percent(aggregate.f1)}`);
    if (aggregate.timing.count) {
      console.log(`  avg response ${formatDuration(aggregate.timing.avgMs)} · max ${formatDuration(aggregate.timing.maxMs)} · cues ${aggregate.timing.count}`);
    }
  }
}

if (aggregateResults.length > 1) {
  console.log('\nmodel comparison');
  aggregateResults
    .slice()
    .sort(function(left, right) { return right.aggregate.f1 - left.aggregate.f1; })
    .forEach(function(result) {
      const timing = result.aggregate.timing.count
        ? ` · avg ${formatDuration(result.aggregate.timing.avgMs)} · max ${formatDuration(result.aggregate.timing.maxMs)}`
        : '';
      console.log(`  ${result.model || '(service default)'}: precision ${percent(result.aggregate.precision)} · recall ${percent(result.aggregate.recall)} · f1 ${percent(result.aggregate.f1)} · actual ${result.aggregate.actualCount}${timing}`);
    });
}

const bestF1 = Math.max(...aggregateResults.map(function(result) { return result.aggregate.f1; }));
if (bestF1 < 0.8) {
  process.exitCode = 1;
}

async function maybeJudgeCase(evalCase, transcript, expectedFixture, actualEvents) {
  if (!judgeEnabled) return null;
  if (!liveBaseUrl) return {
    skipped: true,
    reason: 'Judge mode only runs for live evals.'
  };
  if (!geminiApiKey) return {
    skipped: true,
    reason: 'Set GEMINI_API_KEY or GOOGLE_API_KEY to run judge mode.'
  };

  try {
    return await judgeCase(evalCase, transcript, expectedFixture, actualEvents);
  } catch (error) {
    return {
      skipped: true,
      reason: error.message
    };
  }
}

async function judgeCase(evalCase, transcript, expectedFixture, actualEvents) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(judgeModel) + ':generateContent?key=' + encodeURIComponent(geminiApiKey), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(buildJudgeRequest(evalCase, transcript, expectedFixture, actualEvents))
  });
  const body = await response.json().catch(function() { return {}; });
  if (!response.ok) {
    const message = body.error && body.error.message ? body.error.message : 'judge request failed';
    throw new Error(message);
  }

  const text = body.candidates &&
    body.candidates[0] &&
    body.candidates[0].content &&
    body.candidates[0].content.parts &&
    body.candidates[0].content.parts.map(function(part) { return part.text || ''; }).join('');
  return parseJudgeJson(text);
}

function buildJudgeRequest(evalCase, transcript, expectedFixture, actualEvents) {
  const compactTranscript = transcript.map(function(cue) {
    return {
      at: cue.start,
      speaker: cue.speaker,
      text: cue.text
    };
  });

  return {
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              'You are a qualitative judge for Meeting Decision Maker evals.',
              'Judge whether the actual output supports high-quality human decision making. Do not re-score exact string matches; focus on product qualities.',
              'Return only JSON with this shape: {"overall":1-5,"useful_friction":1-5,"decision_discourse":1-5,"consensus_handling":1-5,"risk_relevance":1-5,"agent_helpfulness":1-5,"human_judgment_support":1-5,"findings":["short finding"],"missed_opportunities":["short missed opportunity"],"overreach":["short overreach"]}.',
              'Use 5 for excellent, 3 for mixed/acceptable, and 1 for harmful or badly misleading.',
              'Important qualities: timely useful friction, no false consensus, forming vs committed distinction, decision-relevant risk, host-sayable agent notes, and supporting human judgment rather than replacing it.',
              '',
              '# Case metadata',
              JSON.stringify({
                name: evalCase.name,
                principles_under_test: evalCase.principles_under_test || [],
                decision_context: evalCase.decision_context || {},
                should_not_emit: evalCase.should_not_emit || []
              }, null, 2),
              '',
              '# Transcript',
              JSON.stringify(compactTranscript, null, 2),
              '',
              '# Expected labels',
              JSON.stringify(expectedFixture.events || [], null, 2),
              '',
              '# Actual output',
              JSON.stringify(actualEvents, null, 2)
            ].join('\n')
          }
        ]
      }
    ]
  };
}

function parseJudgeJson(text) {
  const trimmed = String(text || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(trimmed || '{}');
}

function printJudgeResult(judge) {
  if (judge.skipped) {
    console.log(`\n  Judge skipped: ${judge.reason}`);
    return;
  }

  console.log('\n  Judge');
  console.log(`  overall ${judge.overall}/5 · useful friction ${judge.useful_friction}/5 · discourse ${judge.decision_discourse}/5 · consensus ${judge.consensus_handling}/5`);
  console.log(`  risk relevance ${judge.risk_relevance}/5 · agent helpfulness ${judge.agent_helpfulness}/5 · human judgment ${judge.human_judgment_support}/5`);

  if (Array.isArray(judge.findings) && judge.findings.length) {
    console.log('  findings:');
    judge.findings.slice(0, 3).forEach(function(item) { console.log(`  - ${item}`); });
  }
  if (Array.isArray(judge.missed_opportunities) && judge.missed_opportunities.length) {
    console.log('  missed opportunities:');
    judge.missed_opportunities.slice(0, 3).forEach(function(item) { console.log(`  - ${item}`); });
  }
  if (Array.isArray(judge.overreach) && judge.overreach.length) {
    console.log('  overreach:');
    judge.overreach.slice(0, 3).forEach(function(item) { console.log(`  - ${item}`); });
  }
}

function aggregateScores(resultsToAggregate) {
  const totals = resultsToAggregate.reduce(function(acc, result) {
    acc.expectedCount += result.score.expectedCount;
    acc.actualCount += result.score.actualCount;
    acc.scoredActualCount += result.score.scoredActualCount;
    acc.matchedCount += result.score.matchedCount;
    acc.timing.totalMs += result.timing.totalMs;
    acc.timing.count += result.timing.count;
    acc.timing.maxMs = Math.max(acc.timing.maxMs, result.timing.maxMs);
    return acc;
  }, {
    expectedCount: 0,
    actualCount: 0,
    scoredActualCount: 0,
    matchedCount: 0,
    timing: {
      totalMs: 0,
      count: 0,
      maxMs: 0
    }
  });

  const precision = totals.scoredActualCount ? totals.matchedCount / totals.scoredActualCount : 1;
  const recall = totals.expectedCount ? totals.matchedCount / totals.expectedCount : 1;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  totals.timing.avgMs = totals.timing.count ? totals.timing.totalMs / totals.timing.count : 0;

  return Object.assign(totals, { precision, recall, f1 });
}
