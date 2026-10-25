import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  mapOpenAlexWork,
  mergeExactRecords,
  normalizeDoi,
  normalizeTitle,
  reconstructAbstract,
} from '../scripts/lib/literature-records.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(await readFile(join(here, 'fixtures', 'openalex-small.json'), 'utf8'));
const NOW = '2026-10-26T00:00:00.000Z';

function context(queryId, rawRef = 'raw/openalex.jsonl#L1') {
  return { queryId, retrievedAt: NOW, rawRef };
}

test('maps Chinese OpenAlex metadata and reconstructs the inverted abstract', () => {
  const record = mapOpenAlexWork(fixture.results[0], context('Q-ZH-1'));

  assert.deepEqual(Object.keys(record), [
    'record_id', 'title', 'authors', 'year', 'doi', 'url', 'abstract',
    'provenance', 'screening_status', 'screening_reason',
    'verification_status', 'verification_notes',
  ]);
  assert.equal(record.record_id, 'openalex:W1001');
  assert.equal(record.title, '岗位任务驱动的项目化教学研究');
  assert.deepEqual(record.authors, ['李明', 'Zhang San']);
  assert.equal(record.doi, '10.1000/abc.1');
  assert.equal(record.abstract, '岗位任务 能够 改善 项目学习');
  assert.equal(record.screening_status, 'uncertain');
  assert.equal(record.verification_status, 'unresolved');
  assert.deepEqual(record.provenance[0], {
    source: 'openalex',
    source_record_id: 'W1001',
    query_id: 'Q-ZH-1',
    retrieved_at: NOW,
    raw_ref: 'raw/openalex.jsonl#L1',
  });
});

test('normalization preserves Unicode words and canonicalizes DOI identity', () => {
  assert.equal(normalizeTitle(' 岗位任务——项目化教学（高职） '), '岗位任务 项目化教学 高职');
  assert.equal(normalizeTitle('Project-Based, Learning!'), 'project based learning');
  assert.equal(normalizeDoi(' HTTPS://doi.org/10.1000/AbC.1 '), '10.1000/abc.1');
  assert.equal(normalizeDoi(null), null);
  assert.equal(reconstructAbstract(null), null);
});

test('exact DOI and source identities merge while retaining every query provenance', () => {
  const first = mapOpenAlexWork(fixture.results[0], context('Q-ZH-1', 'raw/openalex.jsonl#L1'));
  const repeated = mapOpenAlexWork(fixture.results[0], context('Q-EN-1', 'raw/openalex.jsonl#L2'));
  const sameDoi = mapOpenAlexWork(fixture.results[2], context('Q-ZH-2', 'raw/openalex.jsonl#L3'));

  const result = mergeExactRecords([sameDoi, repeated, first]);

  assert.equal(result.records.length, 1);
  assert.equal(result.exact_overlap_count, 2);
  assert.deepEqual(
    result.records[0].provenance.map((item) => item.query_id).sort(),
    ['Q-EN-1', 'Q-ZH-1', 'Q-ZH-2'],
  );
  assert.equal(result.records[0].abstract, '岗位任务 能够 改善 项目学习');
});

test('missing DOI and abstract are retained and similar titles do not auto-merge', () => {
  const missing = mapOpenAlexWork(fixture.results[1], context('Q-EN-1'));
  const similar = {
    ...structuredClone(missing),
    record_id: 'openalex:W2002',
    title: 'Workplace task in vocational project learning',
    provenance: [{ ...missing.provenance[0], source_record_id: 'W2002' }],
  };

  const result = mergeExactRecords([missing, similar]);

  assert.equal(result.records.length, 2);
  assert.equal(result.exact_overlap_count, 0);
  assert.equal(result.records[0].doi, null);
  assert.equal(result.records[0].abstract, null);
});

test('conflicting metadata on one exact identity is surfaced instead of overwritten', () => {
  const first = mapOpenAlexWork(fixture.results[0], context('Q1'));
  const conflict = {
    ...structuredClone(first),
    title: '完全不同的标题',
    year: 2018,
    provenance: [{ ...first.provenance[0], query_id: 'Q2', raw_ref: 'raw/openalex.jsonl#L2' }],
  };

  const result = mergeExactRecords([first, conflict]);

  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].title, first.title);
  assert.equal(result.records[0].verification_status, 'conflicted');
  assert.match(result.records[0].verification_notes.join('\n'), /title conflict/);
  assert.match(result.records[0].verification_notes.join('\n'), /year conflict/);
});
