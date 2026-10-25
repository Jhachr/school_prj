#!/usr/bin/env node

import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { mapOpenAlexWork, mergeExactRecords } from './lib/literature-records.mjs';

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_MAX_RETRY_DELAY_MS = 2_000;

export function buildOpenAlexUrl(query, request) {
  validateQuery(query);
  const filters = validateFilters(request.filters);
  const limit = validateLimit(request.per_query_limit ?? 20);
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('search', query.text.trim());
  url.searchParams.set(
    'filter',
    `from_publication_date:${filters.from_year}-01-01,to_publication_date:${filters.to_year}-12-31`,
  );
  url.searchParams.set('per_page', String(limit));
  return url.toString();
}

export async function searchLiterature({
  request,
  outputDir,
  fetchImpl = globalThis.fetch,
  apiKey = process.env.OPENALEX_API_KEY,
  now = () => new Date().toISOString(),
  sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms)),
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  retryBaseMs = 250,
  maxRetryDelayMs = DEFAULT_MAX_RETRY_DELAY_MS,
} = {}) {
  validateRequest(request);
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  const destination = resolve(requiredText(outputDir, 'outputDir'));
  await mkdir(dirname(destination), { recursive: true });
  await mkdir(destination);
  await mkdir(join(destination, 'raw'));
  await writeJson(join(destination, 'request.json'), request);
  await writeFile(join(destination, 'claims.jsonl'), '', { encoding: 'utf8', mode: 0o600 });
  await writeFile(
    join(destination, 'review.md'),
    '# 文献综述初稿\n\n尚未生成。请先完成筛选、证据提取和论点登记。\n',
    { encoding: 'utf8', mode: 0o600 },
  );

  const rawPath = join(destination, 'raw', 'openalex.jsonl');
  const queryResults = [];
  const mapped = [];

  for (const [index, query] of request.queries.entries()) {
    const requestUrl = buildOpenAlexUrl(query, request);
    const retrievedAt = normalizeNow(now());
    const result = await requestOpenAlex({
      requestUrl,
      fetchImpl,
      apiKey,
      sleep,
      timeoutMs,
      maxAttempts,
      retryBaseMs,
      maxRetryDelayMs,
    });
    const outcome = result.ok
      ? (result.body.results.length ? 'success' : 'empty')
      : 'failed';
    const rawEntry = {
      query_id: query.query_id,
      language: query.language,
      query_text: query.text,
      retrieved_at: retrievedAt,
      request_url: requestUrl,
      attempts: result.attempts,
      outcome,
      response: result.ok ? result.body : null,
      error: result.ok ? null : result.error,
    };
    await appendFile(rawPath, `${JSON.stringify(rawEntry)}\n`, { encoding: 'utf8', mode: 0o600 });
    queryResults.push({
      query_id: query.query_id,
      outcome,
      attempts: result.attempts,
      result_count: result.ok ? result.body.results.length : 0,
      error: rawEntry.error,
    });
    if (result.ok) {
      for (const work of result.body.results) {
        mapped.push(mapOpenAlexWork(work, {
          queryId: query.query_id,
          retrievedAt,
          rawRef: `raw/openalex.jsonl#L${index + 1}`,
        }));
      }
    }
  }

  const merged = mergeExactRecords(mapped);
  const corpus = {
    schema_version: 'literature-corpus-v1',
    generated_at: normalizeNow(now()),
    exact_overlap_count: merged.exact_overlap_count,
    records: merged.records,
  };
  await writeJson(join(destination, 'corpus.json'), corpus);

  const successfulQueries = queryResults.filter((item) => item.outcome !== 'failed').length;
  const failedQueries = queryResults.length - successfulQueries;
  const zeroResultQueries = queryResults.filter((item) => item.outcome === 'empty').length;
  const status = successfulQueries === 0 ? 'failed' : (failedQueries ? 'limited' : 'complete');
  const summary = {
    status,
    data_quality_limited: failedQueries > 0,
    total_queries: queryResults.length,
    successful_queries: successfulQueries,
    zero_result_queries: zeroResultQueries,
    failed_queries: failedQueries,
    raw_record_count: mapped.length,
    corpus_record_count: merged.records.length,
    exact_overlap_count: merged.exact_overlap_count,
    query_results: queryResults,
    output_dir: destination,
  };
  await writeFile(join(destination, 'run-summary.md'), renderRunSummary(summary), {
    encoding: 'utf8',
    mode: 0o600,
  });
  return summary;
}

export function exitCodeForSummary(summary) {
  return summary?.successful_queries > 0 ? 0 : 1;
}

async function requestOpenAlex({
  requestUrl,
  fetchImpl,
  apiKey,
  sleep,
  timeoutMs,
  maxAttempts,
  retryBaseMs,
  maxRetryDelayMs,
}) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await performOpenAlexAttempt({ requestUrl, fetchImpl, apiKey, timeoutMs });
    if (result.kind === 'success') return { ok: true, attempts: attempt, body: result.body };
    if (result.kind === 'fatal') {
      return { ok: false, attempts: attempt, error: result.error };
    }
    lastError = result.error;
    if (result.kind === 'transport') {
      if (attempt === maxAttempts) return { ok: false, attempts: attempt, error: lastError };
      await sleep(boundedDelay(retryBaseMs, attempt, maxRetryDelayMs));
      continue;
    }
    if (!result.retryable || attempt === maxAttempts) {
      return { ok: false, attempts: attempt, error: lastError };
    }

    const retryAfterMs = parseRetryAfter(result.retryAfter);
    if (retryAfterMs !== null && retryAfterMs > maxRetryDelayMs) {
      return {
        ok: false,
        attempts: attempt,
        error: {
          code: 'retry_after_exceeds_budget',
          message: `Retry-After ${retryAfterMs}ms exceeds ${maxRetryDelayMs}ms budget`,
          status: result.error.status,
        },
      };
    }
    await sleep(retryAfterMs ?? boundedDelay(retryBaseMs, attempt, maxRetryDelayMs));
  }
  return { ok: false, attempts: maxAttempts, error: lastError };
}

async function performOpenAlexAttempt({ requestUrl, fetchImpl, apiKey, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(requestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'research-proposal-coach/1.0 literature-search',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      signal: controller.signal,
    });

    if (response.ok) {
      let body;
      try {
        body = await response.json();
      } catch (error) {
        if (error instanceof SyntaxError && !controller.signal.aborted) {
          return {
            kind: 'fatal',
            error: { code: 'invalid_json', message: 'OpenAlex returned invalid JSON' },
          };
        }
        throw error;
      }
      if (!body || !Array.isArray(body.results)) {
        return {
          kind: 'fatal',
          error: { code: 'invalid_response', message: 'OpenAlex response has no results array' },
        };
      }
      return { kind: 'success', body };
    }

    const responseMessage = await responseMessageText(response);
    return {
      kind: 'http',
      retryable: response.status === 429 || response.status >= 500,
      retryAfter: response.headers.get('Retry-After'),
      error: {
        code: response.status === 429 ? 'rate_limited' : `http_${response.status}`,
        message: responseMessage,
        status: response.status,
      },
    };
  } catch (error) {
    return {
      kind: 'transport',
      error: {
        code: controller.signal.aborted || error?.name === 'AbortError' ? 'timeout' : 'network_error',
        message: networkErrorMessage(error),
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function validateRequest(request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new Error('request must be an object');
  }
  if (!request.teacher_context || typeof request.teacher_context !== 'object') {
    throw new Error('teacher_context is required');
  }
  for (const field of [
    'role_or_course', 'work_scene', 'observed_problem', 'current_method',
    'resources', 'confirmation_source',
  ]) {
    if (!(field in request.teacher_context)) throw new Error(`teacher_context.${field} is required`);
  }
  if (!Array.isArray(request.queries) || request.queries.length < 1 || request.queries.length > 6) {
    throw new Error('queries must contain between 1 and 6 entries');
  }
  const ids = new Set();
  for (const query of request.queries) {
    validateQuery(query);
    if (ids.has(query.query_id)) throw new Error(`duplicate query_id: ${query.query_id}`);
    ids.add(query.query_id);
  }
  validateFilters(request.filters);
  validateLimit(request.per_query_limit ?? 20);
}

function validateQuery(query) {
  if (!query || typeof query !== 'object') throw new Error('query must be an object');
  requiredText(query.query_id, 'query_id');
  requiredText(query.text, 'query text');
  if (!['zh', 'en'].includes(query.language)) throw new Error(`unsupported query language: ${query.language}`);
}

function validateFilters(filters) {
  if (!filters || !Number.isInteger(filters.from_year) || !Number.isInteger(filters.to_year)) {
    throw new Error('filters.from_year and filters.to_year are required integers');
  }
  if (filters.from_year < 1000 || filters.to_year > 9999 || filters.from_year > filters.to_year) {
    throw new Error('invalid publication year range');
  }
  return filters;
}

function validateLimit(limit) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new Error('per_query_limit must be an integer from 1 to 20');
  }
  return limit;
}

function boundedDelay(base, attempt, maximum) {
  return Math.min(maximum, base * (2 ** (attempt - 1)));
}

function parseRetryAfter(value) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return Math.max(0, date.valueOf() - Date.now());
}

async function responseMessageText(response) {
  const text = await response.text();
  return text.slice(0, 500) || `OpenAlex returned HTTP ${response.status}`;
}

function renderRunSummary(summary) {
  const limitations = [];
  if (summary.failed_queries) limitations.push('部分查询失败，数据质量受限。');
  if (summary.zero_result_queries) limitations.push('部分查询成功但返回零条，不等于相关研究不存在。');
  if (!summary.corpus_record_count) limitations.push('当前没有可筛选候选记录，需要扩展检索式或补充合法材料。');
  const queryRows = summary.query_results.map((item) => (
    `| ${item.query_id} | ${item.outcome} | ${item.result_count} | ${item.attempts} | ${item.error?.code ?? ''} |`
  )).join('\n');
  return `# 文献检索运行摘要

- 运行状态：${summary.status}
- 查询总数：${summary.total_queries}
- 查询成功：${summary.successful_queries}
- 成功但零结果：${summary.zero_result_queries}
- 查询失败：${summary.failed_queries}
- 原始候选数：${summary.raw_record_count}
- 精确合并后记录数：${summary.corpus_record_count}
- 精确重合数：${summary.exact_overlap_count}
- 工程检查：检索入口已运行，内容筛选和论点核对尚未执行
- 真实教师试点：未执行

## 分查询结果

| 查询 ID | 结果 | 返回数 | 尝试次数 | 错误代码 |
|---|---|---:|---:|---|
${queryRows}

## 局限

${limitations.length ? limitations.map((item) => `- ${item}`).join('\n') : '- 当前请求未观察到接口失败；仍需人工判断来源覆盖和内容相关性。'}

## 后续行动

- 由 Skill 记录纳入、待判断或排除理由。
- 对拟写入综述的论点保存原文片段和位置。
- 运行关联检查后，再向真实教师展示并记录反馈。
`;
}

function networkErrorMessage(error) {
  const message = error?.message || 'OpenAlex request failed';
  const causeCode = error?.cause?.code;
  const causeMessage = error?.cause?.message;
  if (!causeCode && !causeMessage) return message;
  const detail = [causeCode, causeMessage].filter(Boolean).join(': ');
  return `${message} (${detail})`;
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
}

function normalizeNow(value) {
  const date = new Date(value);
  if (typeof value !== 'string' || Number.isNaN(date.valueOf())) throw new Error('now() must return an ISO timestamp');
  return date.toISOString();
}

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

async function main() {
  const input = option(process.argv.slice(2), '--input');
  const output = option(process.argv.slice(2), '--output');
  const request = JSON.parse(await readFile(resolve(input), 'utf8'));
  const summary = await searchLiterature({ request, outputDir: output });
  process.stdout.write(`${JSON.stringify(summary)}\n`);
  process.exitCode = exitCodeForSummary(summary);
}

function option(args, name) {
  const index = args.indexOf(name);
  if (index === -1 || !args[index + 1]) throw new Error(`${name} is required`);
  return args[index + 1];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
    process.exitCode = 1;
  });
}
