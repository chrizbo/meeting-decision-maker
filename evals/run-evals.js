import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const evalDir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const liveIndex = args.indexOf('--live');
const liveBaseUrl = liveIndex >= 0 ? args[liveIndex + 1] : '';
const caseIndex = args.indexOf('--case');
const caseFilter = caseIndex >= 0 ? args[caseIndex + 1] : '';
const timingToleranceSeconds = 8;
const titleSimilarityThreshold = 0.35;
const liveRetryCount = 2;
const liveRetryDelayMs = 1200;

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

async function liveEventsForCue(baseUrl, cues, cue, meetingState) {
  let lastError = null;
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
          meetingState: compactMeetingState(meetingState)
        })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`${response.status} ${body}`);
      }

      const result = await response.json();
      return Array.isArray(result.items) ? result.items : [];
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

async function runEval(casePath) {
  const evalCase = JSON.parse(await readFile(casePath, 'utf8'));
  const transcriptPath = resolve(dirname(casePath), evalCase.transcript);
  const transcript = parseVtt(await readFile(transcriptPath, 'utf8'));
  const expectedFixture = evalCase.expected
    ? JSON.parse(await readFile(resolve(dirname(casePath), evalCase.expected), 'utf8'))
    : evalCase;
  const meetingState = Object.assign(emptyMeetingState(), { nextId: 1 });
  const actualEvents = [];
  const errors = [];

  for (const cue of transcript) {
    let items = [];
    try {
      items = liveBaseUrl
        ? await liveEventsForCue(liveBaseUrl, transcript, cue, meetingState)
        : fixtureEventsForCue(expectedFixture, cue);
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
    score: scoreEvents(expectedFixture.events, actualEvents),
    errors
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

function printResult(result) {
  const score = result.score;
  console.log(`\n${result.name} (${result.mode})`);
  console.log(`  expected: ${score.expectedCount}`);
  console.log(`  actual:   ${score.actualCount}`);
  if (score.toleratedUpdates.length) console.log(`  updates:  ${score.toleratedUpdates.length} tolerated`);
  console.log(`  matched:  ${score.matchedCount}`);
  console.log(`  precision ${percent(score.precision)} · recall ${percent(score.recall)} · f1 ${percent(score.f1)}`);

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
}

function byTime(items) {
  return items.slice().sort(function(left, right) {
    return left.at - right.at;
  });
}

const results = [];
for (const casePath of await discoverEvalCases()) {
  const result = await runEval(casePath);
  results.push(result);
  printResult(result);
}

const aggregate = aggregateScores(results);
if (results.length > 1) {
  console.log('\nall cases');
  console.log(`  expected: ${aggregate.expectedCount}`);
  console.log(`  actual:   ${aggregate.actualCount}`);
  console.log(`  matched:  ${aggregate.matchedCount}`);
  console.log(`  precision ${percent(aggregate.precision)} · recall ${percent(aggregate.recall)} · f1 ${percent(aggregate.f1)}`);
}

if (aggregate.f1 < 0.8) {
  process.exitCode = 1;
}

function aggregateScores(resultsToAggregate) {
  const totals = resultsToAggregate.reduce(function(acc, result) {
    acc.expectedCount += result.score.expectedCount;
    acc.actualCount += result.score.actualCount;
    acc.scoredActualCount += result.score.scoredActualCount;
    acc.matchedCount += result.score.matchedCount;
    return acc;
  }, {
    expectedCount: 0,
    actualCount: 0,
    scoredActualCount: 0,
    matchedCount: 0
  });

  const precision = totals.scoredActualCount ? totals.matchedCount / totals.scoredActualCount : 1;
  const recall = totals.expectedCount ? totals.matchedCount / totals.expectedCount : 1;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;

  return Object.assign(totals, { precision, recall, f1 });
}
