import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkLiteratureRun } from '../scripts/check-literature-run.mjs';

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = join(skillRoot, 'scripts', 'check-literature-run.mjs');

test('valid run links every review claim and reference to saved evidence', async () => {
  await withRun(async ({ run }) => {
    const result = await checkLiteratureRun({ inputDir: run });

    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.counts, { records: 2, claims: 2, cited_records: 2 });
  });
});

for (const [name, mutate, expected] of [
  [
    'claim refers to a missing record',
    ({ claims }) => { claims[0].evidence[0].record_id = 'openalex:missing'; },
    /unknown record openalex:missing/,
  ],
  [
    'review contains an unknown claim id',
    ({ review }) => review.replace('[C01]', '[C99]'),
    /unknown claim marker C99/,
  ],
  [
    'claim uses a conflicted record',
    ({ corpus }) => { corpus.records[0].verification_status = 'conflicted'; },
    /cannot use verification_status conflicted/,
  ],
  [
    'abstract excerpt was fabricated',
    ({ claims }) => { claims[0].evidence[0].excerpt = '摘要中不存在的句子'; },
    /excerpt not found in abstract/,
  ],
  [
    'review omits a used reference',
    ({ review }) => review.replace(/^.*\[record:manual:M1\].*\n?/m, ''),
    /missing reference marker for manual:M1/,
  ],
]) {
  test(`checker rejects ${name}`, async () => {
    await withRun(async ({ run }) => {
      const corpusPath = join(run, 'corpus.json');
      const claimsPath = join(run, 'claims.jsonl');
      const reviewPath = join(run, 'review.md');
      const state = {
        corpus: JSON.parse(await readFile(corpusPath, 'utf8')),
        claims: parseJsonl(await readFile(claimsPath, 'utf8')),
        review: await readFile(reviewPath, 'utf8'),
      };
      const returnedReview = mutate(state);
      if (typeof returnedReview === 'string') state.review = returnedReview;
      await writeFile(corpusPath, `${JSON.stringify(state.corpus, null, 2)}\n`, 'utf8');
      await writeFile(claimsPath, `${state.claims.map(JSON.stringify).join('\n')}\n`, 'utf8');
      await writeFile(reviewPath, state.review, 'utf8');

      const result = await checkLiteratureRun({ inputDir: run });

      assert.equal(result.ok, false);
      assert.match(result.errors.join('\n'), expected);
    });
  });
}

test('manual text evidence must use a safe relative path and a real excerpt', async () => {
  await withRun(async ({ run }) => {
    const claimsPath = join(run, 'claims.jsonl');
    const claims = parseJsonl(await readFile(claimsPath, 'utf8'));
    claims[1].evidence[0].location = '../outside.md#page=3';
    await writeFile(claimsPath, `${claims.map(JSON.stringify).join('\n')}\n`, 'utf8');

    const result = await checkLiteratureRun({ inputDir: run });

    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /unsafe evidence path/);
  });
});

test('CLI emits JSON and exits non-zero for broken associations', async () => {
  await withRun(async ({ run }) => {
    await writeFile(join(run, 'review.md'), '# 综述\n\n未知论点。[C88]\n', 'utf8');

    const result = await runCli(['--input', run]);

    assert.notEqual(result.code, 0);
    assert.equal(result.stdout.ok, false);
    assert.match(result.stderr, /unknown claim marker C88/);
  });
});

function baseCorpus() {
  return {
    schema_version: 'literature-corpus-v1',
    records: [
      {
        record_id: 'openalex:W1',
        title: '岗位任务研究',
        authors: ['李明'],
        year: 2024,
        doi: null,
        url: 'https://example.org/W1',
        abstract: '岗位任务驱动有助于学生理解工作过程，但证据仅来自一个课程案例。',
        provenance: [{ source: 'openalex', source_record_id: 'W1', query_id: 'Q1', retrieved_at: '2026-10-26T00:00:00.000Z', raw_ref: 'raw/openalex.jsonl#L1' }],
        screening_status: 'included',
        screening_reason: '直接讨论岗位任务与项目学习',
        verification_status: 'unresolved',
        verification_notes: ['尚未进行跨库核验'],
      },
      {
        record_id: 'manual:M1',
        title: '本校课程任务单分析',
        authors: ['李老师'],
        year: 2025,
        doi: null,
        url: null,
        abstract: null,
        provenance: [{ source: 'teacher_material', source_record_id: 'M1', query_id: null, retrieved_at: '2026-10-26T00:00:00.000Z', raw_ref: 'raw/local-note.md' }],
        screening_status: 'included',
        screening_reason: '提供本校情境证据',
        verification_status: 'verified',
        verification_notes: ['教师确认材料名称和来源'],
      },
    ],
  };
}

function baseClaims() {
  return [
    {
      claim_id: 'C01',
      claim: '岗位任务驱动可帮助学生理解工作过程，但现有摘要只支持有限场景判断。',
      evidence: [{
        record_id: 'openalex:W1',
        location: 'abstract',
        excerpt: '岗位任务驱动有助于学生理解工作过程',
        support_level: 'abstract_supported',
      }],
      limitations: ['尚未读取全文', '摘要只报告一个课程案例'],
    },
    {
      claim_id: 'C02',
      claim: '本校任务单尚未要求学生独立拆解岗位任务。',
      evidence: [{
        record_id: 'manual:M1',
        location: 'raw/local-note.md#page=3',
        excerpt: '任务单主要要求复现教师示范流程',
        support_level: 'fulltext_supported',
      }],
      limitations: ['仅代表本校当前课程材料'],
    },
  ];
}

function baseReview() {
  return `# 文献综述初稿

现有摘要提示岗位任务驱动可能帮助学生理解工作过程，但不能推出普遍效果。[C01]

本校任务单当前更重视复现流程，这为问题界定提供本地依据。[C02]

## 参考文献与材料

- 岗位任务研究。[record:openalex:W1]
- 本校课程任务单分析。[record:manual:M1]
`;
}

async function withRun(runTest) {
  const root = await mkdtemp(join(tmpdir(), 'literature-check-test-'));
  const run = join(root, 'run');
  try {
    await mkdir(join(run, 'raw'), { recursive: true });
    await writeFile(join(run, 'corpus.json'), `${JSON.stringify(baseCorpus(), null, 2)}\n`, 'utf8');
    await writeFile(join(run, 'claims.jsonl'), `${baseClaims().map(JSON.stringify).join('\n')}\n`, 'utf8');
    await writeFile(join(run, 'review.md'), baseReview(), 'utf8');
    await writeFile(join(run, 'raw', 'local-note.md'), '第3页\n任务单主要要求复现教师示范流程\n', 'utf8');
    await runTest({ root, run });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function parseJsonl(content) {
  return content.split('\n').filter(Boolean).map(JSON.parse);
}

function runCli(args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => resolvePromise({
      code,
      stdout: JSON.parse(stdout),
      stderr,
    }));
  });
}
