import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildOpenAlexUrl,
  exitCodeForSummary,
  searchLiterature,
} from '../scripts/search-literature.mjs';

const NOW = '2026-10-26T00:00:00.000Z';

function request(queries = [
  { query_id: 'Q-ZH-1', language: 'zh', text: '职业教育 岗位任务 项目化教学' },
]) {
  return {
    teacher_context: {
      role_or_course: '高职市场营销课程',
      work_scene: '直播电商项目实训',
      observed_problem: '学生会模仿流程但不能独立拆解岗位任务',
      current_method: '教师示范后小组练习',
      resources: '课程任务单和学生作品',
      confirmation_source: 'conversation:turn-3',
    },
    queries,
    filters: { from_year: 2020, to_year: 2026 },
    per_query_limit: 20,
  };
}

test('buildOpenAlexUrl uses current first-page parameters without embedding credentials', () => {
  const url = new URL(buildOpenAlexUrl(request().queries[0], request()));
  assert.equal(url.origin, 'https://api.openalex.org');
  assert.equal(url.pathname, '/works');
  assert.equal(url.searchParams.get('search'), '职业教育 岗位任务 项目化教学');
  assert.equal(url.searchParams.get('per_page'), '20');
  assert.equal(
    url.searchParams.get('filter'),
    'from_publication_date:2020-01-01,to_publication_date:2026-12-31',
  );
  assert.equal(url.searchParams.has('api_key'), false);
  assert.equal(url.searchParams.has('cursor'), false);
});

test('successful and zero-result queries are saved distinctly without network access', async () => {
  await withTempOutput(async ({ output }) => {
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({ url: String(url), options });
      const query = new URL(url).searchParams.get('search');
      if (query.includes('zero')) return jsonResponse({ meta: { count: 0 }, results: [] });
      return jsonResponse({
        meta: { count: 1 },
        results: [{
          id: 'https://openalex.org/W1',
          title: '岗位任务研究',
          publication_year: 2024,
          doi: null,
          authorships: [],
          primary_location: { landing_page_url: 'https://example.org/W1' },
          abstract_inverted_index: { '岗位任务': [0], '研究': [1] },
        }],
      });
    };
    const input = request([
      { query_id: 'Q1', language: 'zh', text: '岗位任务' },
      { query_id: 'Q2', language: 'en', text: 'zero result' },
    ]);

    const summary = await searchLiterature({
      request: input,
      outputDir: output,
      fetchImpl,
      now: () => NOW,
      sleep: async () => {},
    });

    assert.equal(summary.status, 'complete');
    assert.equal(summary.successful_queries, 2);
    assert.equal(summary.zero_result_queries, 1);
    assert.equal(summary.failed_queries, 0);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].options.headers.Authorization, undefined);
    const raw = (await readFile(join(output, 'raw', 'openalex.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
    assert.deepEqual(raw.map((entry) => entry.outcome), ['success', 'empty']);
    const corpus = JSON.parse(await readFile(join(output, 'corpus.json'), 'utf8'));
    assert.equal(corpus.records.length, 1);
    assert.equal(corpus.records[0].provenance[0].query_id, 'Q1');
    await access(join(output, 'claims.jsonl'));
    await access(join(output, 'review.md'));
    const runSummary = await readFile(join(output, 'run-summary.md'), 'utf8');
    assert.match(runSummary, /真实教师试点：未执行/);
    assert.match(runSummary, /Q1.*success.*1/);
    assert.match(runSummary, /Q2.*empty.*0/);
  });
});

test('network failures retry three times and preserve the underlying diagnostic', async () => {
  await withTempOutput(async ({ output }) => {
    let attempts = 0;
    const cause = Object.assign(new Error('getaddrinfo ENOTFOUND api.openalex.org'), {
      code: 'ENOTFOUND',
    });
    const summary = await searchLiterature({
      request: request(),
      outputDir: output,
      fetchImpl: async () => {
        attempts += 1;
        throw new Error('fetch failed', { cause });
      },
      now: () => NOW,
      sleep: async () => {},
    });

    assert.equal(attempts, 3);
    assert.equal(summary.status, 'failed');
    assert.equal(summary.query_results[0].error.code, 'network_error');
    assert.match(summary.query_results[0].error.message, /ENOTFOUND/);
  });
});

test('temporary failures retry at most three attempts and preserve partial success', async () => {
  await withTempOutput(async ({ output }) => {
    const attempts = new Map();
    const fetchImpl = async (url) => {
      const query = new URL(url).searchParams.get('search');
      attempts.set(query, (attempts.get(query) || 0) + 1);
      if (query === 'always fails') return jsonResponse({ message: 'unavailable' }, 503);
      return jsonResponse({ meta: { count: 0 }, results: [] });
    };

    const summary = await searchLiterature({
      request: request([
        { query_id: 'Q1', language: 'en', text: 'always fails' },
        { query_id: 'Q2', language: 'zh', text: '成功查询' },
      ]),
      outputDir: output,
      fetchImpl,
      now: () => NOW,
      sleep: async () => {},
      retryBaseMs: 1,
    });

    assert.equal(attempts.get('always fails'), 3);
    assert.equal(summary.status, 'limited');
    assert.equal(summary.failed_queries, 1);
    assert.equal(summary.successful_queries, 1);
    assert.equal(summary.data_quality_limited, true);
    assert.equal(exitCodeForSummary(summary), 0);
    const rawText = await readFile(join(output, 'raw', 'openalex.jsonl'), 'utf8');
    assert.match(rawText, /"outcome":"failed"/);
    assert.match(rawText, /"attempts":3/);
  });
});

test('ordinary 4xx does not retry and all failed queries require a non-zero CLI result', async () => {
  await withTempOutput(async ({ output }) => {
    let attempts = 0;
    const summary = await searchLiterature({
      request: request(),
      outputDir: output,
      fetchImpl: async () => {
        attempts += 1;
        return jsonResponse({ error: 'bad request' }, 400);
      },
      now: () => NOW,
      sleep: async () => {},
    });

    assert.equal(attempts, 1);
    assert.equal(summary.status, 'failed');
    assert.equal(summary.successful_queries, 0);
    assert.equal(summary.failed_queries, 1);
    assert.equal(exitCodeForSummary(summary), 1);
    assert.equal(JSON.parse(await readFile(join(output, 'corpus.json'), 'utf8')).records.length, 0);
  });
});

test('Retry-After beyond the bounded wait budget stops instead of sleeping indefinitely', async () => {
  await withTempOutput(async ({ output }) => {
    let attempts = 0;
    const waits = [];
    const summary = await searchLiterature({
      request: request(),
      outputDir: output,
      fetchImpl: async () => {
        attempts += 1;
        return jsonResponse({ error: 'rate limited' }, 429, { 'Retry-After': '120' });
      },
      now: () => NOW,
      sleep: async (ms) => { waits.push(ms); },
      maxRetryDelayMs: 2_000,
    });

    assert.equal(attempts, 1);
    assert.deepEqual(waits, []);
    assert.equal(summary.query_results[0].error.code, 'retry_after_exceeds_budget');
  });
});

test('API keys use an Authorization header and are never stored in raw URLs', async () => {
  await withTempOutput(async ({ output }) => {
    let authorization;
    await searchLiterature({
      request: request(),
      outputDir: output,
      apiKey: 'secret-key',
      fetchImpl: async (url, options) => {
        authorization = options.headers.Authorization;
        assert.doesNotMatch(String(url), /secret-key/);
        return jsonResponse({ meta: { count: 0 }, results: [] });
      },
      now: () => NOW,
      sleep: async () => {},
    });

    assert.equal(authorization, 'Bearer secret-key');
    assert.doesNotMatch(await readFile(join(output, 'raw', 'openalex.jsonl'), 'utf8'), /secret-key/);
  });
});

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

async function withTempOutput(run) {
  const root = await mkdtemp(join(tmpdir(), 'literature-search-test-'));
  const output = join(root, 'run');
  try {
    await run({ root, output });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
