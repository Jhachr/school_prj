# Literature Search And Evidence-Grounded Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real public-source retrieval, conservative record processing, evidence tracking, topic research scans, and citation-grounded long-form literature reviews without treating missing public data as proof that research does not exist.

**Architecture:** Separate source adapters from a stable normalized-record contract. OpenAlex performs discovery; Crossref verifies and supplements publishing metadata. Deterministic Node.js scripts save raw responses, normalized JSONL, duplicate relationships, verification results, and run summaries. The Skill performs research judgment and prose synthesis only from saved evidence records and the claim ledger.

**Tech Stack:** Node.js built-in `fetch`, Node.js standard library, JSON/JSONL, Markdown, `node:test`, fixed offline API fixtures

---

**Required implementation skills:** Use `superpowers:test-driven-development` for every adapter/processor change and `superpowers:writing-skills` for the topic-scan and literature-review instruction changes. Behavioral forward tests are required alongside deterministic fixture tests.

## Preconditions And Fixed Contracts

- Complete the teacher profile plan first so a topic scan can consume a confirmed current-session profile snapshot.
- Live public APIs are never called by the default unit test suite. Unit and integration tests use fixed fixtures.
- All scripts are dependency-free and accept `--input` and `--output` paths. Machine-readable results go to files/stdout; diagnostics go to stderr.
- All public and future institutional adapters must produce the same normalized record contract.
- The two fixed teacher-facing content artifacts are `选题研究扫描` and `文献综述长稿`.
- A generic `申报书文献综述` is not generated. Proposal compression belongs to `proposal_mapping` and requires a verified real template, field, structure, and word limit.
- Strictness controls how strongly a record may support a claim; it must not delete plausible literature early.

## Task 1: Define Bilingual Statuses And The Normalized Record Contract

**Files:**

- Create: `skills/research-proposal-coach/scripts/lib/literature-statuses.mjs`
- Create: `skills/research-proposal-coach/scripts/lib/record-contract.mjs`
- Create: `skills/research-proposal-coach/rules/literature-evidence-policy.md`
- Create: `skills/research-proposal-coach/tests/record-contract.test.mjs`

- [ ] Write failing tests for the normalized record keys and status enums.

```js
const record = normalizeRecord(fixture, context);
assert.deepEqual(Object.keys(record), [
  'schema_version', 'record_id', 'source', 'source_record_id', 'source_ids',
  'title', 'authors', 'year', 'doi', 'venue', 'abstract', 'keywords',
  'url', 'open_access_url', 'matched_queries', 'retrieved_at',
  'screening_status', 'verification_status', 'evidence_level', 'relations'
]);
assert.equal(record.screening_status, 'uncertain');
assert.equal(record.verification_status, 'unresolved');
assert.equal(record.evidence_level, 'candidate');
```

- [ ] Require these exact internal values and user-facing labels:

  - relevance: `included（已纳入）`, `uncertain（待判断）`, `excluded（已排除）`, `superseded（已有更完整版本）`;
  - identity: `verified（已核验）`, `unresolved（暂未核验）`, `conflicted（信息冲突）`, `rejected（已排除）`;
  - evidence: `candidate（候选线索）`, `metadata_verified（元数据已核验）`, `abstract_supported（摘要支持）`, `fulltext_supported（全文支持）`;
  - retrieval limitation: `research_gap（可能的研究空白）`, `source_coverage_gap（数据源覆盖不足）`, `query_gap（检索式可能不足）`, `access_gap（缺少摘要或全文）`.

- [ ] Run the test and confirm it fails because the modules do not exist.

Run: `node --test skills/research-proposal-coach/tests/record-contract.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] Implement frozen status maps and helper functions `assertStatus()`, `displayStatus()`, `normalizeDoi()`, `normalizeTitle()`, and `createNormalizedRecord()`.

```js
export const VERIFICATION_STATUS = Object.freeze({
  verified: 'verified（已核验）',
  unresolved: 'unresolved（暂未核验）',
  conflicted: 'conflicted（信息冲突）',
  rejected: 'rejected（已排除）'
});
```

- [ ] Encode in `literature-evidence-policy.md` that the four dimensions are independent and that every English status shown to a teacher must carry its Chinese meaning plus a plain-language consequence on first use.

- [ ] Add validation tests for missing required fields, bad URL types, invalid years, duplicate query IDs, invalid statuses, and DOI normalization.

- [ ] Run the focused test.

Run: `node --test skills/research-proposal-coach/tests/record-contract.test.mjs`

Expected: PASS.

- [ ] Commit the contract.

```bash
git add skills/research-proposal-coach/scripts/lib skills/research-proposal-coach/rules/literature-evidence-policy.md skills/research-proposal-coach/tests/record-contract.test.mjs
git commit -m "feat: define literature record and evidence statuses"
```

## Task 2: Build The Shared HTTP And JSONL Runtime

**Files:**

- Create: `skills/research-proposal-coach/scripts/lib/http-client.mjs`
- Create: `skills/research-proposal-coach/scripts/lib/jsonl.mjs`
- Create: `skills/research-proposal-coach/tests/http-client.test.mjs`
- Create: `skills/research-proposal-coach/tests/jsonl.test.mjs`

- [ ] Write failing tests for retry behavior, rate-limit handling, partial failures, JSONL line diagnostics, and atomic output.

The HTTP result must use this shape instead of throwing away provenance:

```json
{
  "ok": false,
  "status": 429,
  "attempts": 3,
  "retrieved_at": "2026-10-25T00:00:00.000Z",
  "request_url": "https://api.openalex.org/works",
  "error": { "code": "rate_limited", "message": "..." }
}
```

- [ ] Confirm the tests fail before implementation.

Run: `node --test skills/research-proposal-coach/tests/http-client.test.mjs skills/research-proposal-coach/tests/jsonl.test.mjs`

Expected: FAIL with missing modules.

- [ ] Implement `requestJson()` with injectable `fetchImpl`, bounded exponential backoff, `Retry-After` support, request timeout, user-agent identification, and a maximum-attempt cap. Retry 429 and 5xx; do not retry ordinary 4xx errors.

- [ ] Implement streaming-safe JSONL read/write helpers. Each parse error must report line number and leave the input unchanged. Output must be written atomically.

- [ ] Add a test proving a failed API request produces a structured error record and never fabricates an empty successful result.

- [ ] Run the focused tests.

Run: `node --test skills/research-proposal-coach/tests/http-client.test.mjs skills/research-proposal-coach/tests/jsonl.test.mjs`

Expected: PASS.

- [ ] Commit the runtime.

```bash
git add skills/research-proposal-coach/scripts/lib skills/research-proposal-coach/tests/http-client.test.mjs skills/research-proposal-coach/tests/jsonl.test.mjs
git commit -m "feat: add resilient literature script runtime"
```

## Task 3: Implement The OpenAlex Discovery Adapter

**Files:**

- Create: `skills/research-proposal-coach/scripts/adapters/openalex.mjs`
- Create: `skills/research-proposal-coach/scripts/search-openalex.mjs`
- Create: `skills/research-proposal-coach/tests/fixtures/openalex-page-1.json`
- Create: `skills/research-proposal-coach/tests/fixtures/openalex-page-2.json`
- Create: `skills/research-proposal-coach/tests/openalex-adapter.test.mjs`

- [ ] Save small, representative OpenAlex fixtures containing Chinese and English titles, DOI and non-DOI records, inverted-index abstracts, open-access URLs, multiple authors, keywords/concepts, and cursor pagination.

- [ ] Write failing tests for query encoding, cursor pagination, abstract reconstruction, matched-query retention, and source provenance.

```js
const records = mapOpenAlexWorks(fixture.results, { queryId: 'Q1', retrievedAt: NOW });
assert.equal(records[0].source, 'openalex');
assert.deepEqual(records[0].matched_queries, ['Q1']);
assert.match(records[0].abstract, /岗位任务/);
```

- [ ] Run the test and confirm the expected failure.

Run: `node --test skills/research-proposal-coach/tests/openalex-adapter.test.mjs`

Expected: FAIL with missing adapter.

- [ ] Implement adapter exports `buildOpenAlexUrl()`, `reconstructAbstract()`, `mapOpenAlexWork()`, and `searchOpenAlex()`.

- [ ] Implement the CLI contract:

```json
{
  "queries": [
    { "query_id": "Q1", "language": "zh", "text": "职业教育 项目化教学 岗位任务" },
    { "query_id": "Q2", "language": "en", "text": "vocational education project based learning workplace task" }
  ],
  "filters": { "from_year": 2016, "to_year": 2026 },
  "per_query_limit": 100
}
```

The output preserves one raw response envelope per request, including query ID, URL, cursor, retrieval time, response metadata, records, and errors.

- [ ] Add tests for a network error and one failed query among several successful queries. The CLI must keep successful queries and report `source_coverage_gap（数据源覆盖不足）` in its summary rather than fail the whole run silently.

- [ ] Run the focused test.

Run: `node --test skills/research-proposal-coach/tests/openalex-adapter.test.mjs`

Expected: PASS.

- [ ] Commit the discovery adapter.

```bash
git add skills/research-proposal-coach/scripts skills/research-proposal-coach/tests
git commit -m "feat: retrieve literature from OpenAlex"
```

## Task 4: Implement Crossref Metadata Lookup

**Files:**

- Create: `skills/research-proposal-coach/scripts/adapters/crossref.mjs`
- Create: `skills/research-proposal-coach/scripts/lookup-crossref.mjs`
- Create: `skills/research-proposal-coach/tests/fixtures/crossref-doi.json`
- Create: `skills/research-proposal-coach/tests/fixtures/crossref-title-search.json`
- Create: `skills/research-proposal-coach/tests/crossref-adapter.test.mjs`

- [ ] Write failing tests for exact DOI lookup, bibliographic fallback, author/year extraction, missing DOI, 404 DOI, and ambiguous title search.

- [ ] Run the test and confirm it fails.

Run: `node --test skills/research-proposal-coach/tests/crossref-adapter.test.mjs`

Expected: FAIL with missing adapter.

- [ ] Implement DOI lookup first. Use title/author/year bibliographic search only when DOI is absent, and retain all top candidates plus their match inputs rather than declaring the first result correct.

- [ ] Ensure the adapter produces raw Crossref result envelopes; it must not assign `verified` itself. Verification is a separate deterministic comparison step.

- [ ] Add a polite contact configuration via `CROSSREF_MAILTO` without requiring it. Never store that value in literature artifacts.

- [ ] Run the focused test.

Run: `node --test skills/research-proposal-coach/tests/crossref-adapter.test.mjs`

Expected: PASS.

- [ ] Commit the metadata adapter.

```bash
git add skills/research-proposal-coach/scripts skills/research-proposal-coach/tests
git commit -m "feat: add Crossref metadata lookup"
```

## Task 5: Normalize And Conservatively Deduplicate Records

**Files:**

- Create: `skills/research-proposal-coach/scripts/normalize-records.mjs`
- Create: `skills/research-proposal-coach/scripts/deduplicate-records.mjs`
- Create: `skills/research-proposal-coach/scripts/lib/deduplication.mjs`
- Create: `skills/research-proposal-coach/tests/normalize-records.test.mjs`
- Create: `skills/research-proposal-coach/tests/deduplicate-records.test.mjs`

- [ ] Write failing normalization tests that combine multiple OpenAlex query hits into one normalized record while retaining every `matched_queries` entry and raw source ID.

- [ ] Write failing deduplication tests for:

  - exact normalized DOI: auto-merge;
  - exact source and source record ID: auto-merge;
  - highly similar title plus same first author and nearby year: keep both and create `possible_duplicate（疑似重复）`;
  - preprint/final, conference/journal, and Chinese/English versions: keep both and record a version relationship;
  - keyword-only similarity: keep both with no merge.

```js
assert.equal(result.records.length, 2);
assert.deepEqual(result.relationships[0], {
  relation: 'possible_duplicate',
  display: 'possible_duplicate（疑似重复）',
  left_record_id: 'openalex:W1',
  right_record_id: 'openalex:W2',
  reasons: ['title_similarity', 'same_first_author', 'year_within_1']
});
```

- [ ] Run the tests and confirm they fail.

Run: `node --test skills/research-proposal-coach/tests/normalize-records.test.mjs skills/research-proposal-coach/tests/deduplicate-records.test.mjs`

Expected: FAIL with missing modules.

- [ ] Implement exact-identity merging and conservative fuzzy relationship detection. Keep the threshold and matching reasons in the emitted relationship; never delete a fuzzy match.

- [ ] Make deduplication deterministic: identical input produces byte-stable JSONL ordered by `record_id`.

- [ ] Run the focused tests.

Run: `node --test skills/research-proposal-coach/tests/normalize-records.test.mjs skills/research-proposal-coach/tests/deduplicate-records.test.mjs`

Expected: PASS.

- [ ] Commit normalization and deduplication.

```bash
git add skills/research-proposal-coach/scripts skills/research-proposal-coach/tests
git commit -m "feat: normalize and conservatively deduplicate literature"
```

## Task 6: Verify Identity Without Over-Rejecting Literature

**Files:**

- Create: `skills/research-proposal-coach/scripts/lib/metadata-verification.mjs`
- Create: `skills/research-proposal-coach/scripts/verify-metadata.mjs`
- Create: `skills/research-proposal-coach/tests/metadata-verification.test.mjs`

- [ ] Write a decision-table test covering exact DOI matches, title punctuation differences, translated titles, missing author/year, DOI conflicts, 404 identifiers, and no public-source match.

Expected outcomes:

| Situation | Status | Evidence level |
|---|---|---|
| DOI and core metadata agree | `verified` | at least `metadata_verified` |
| Public source cannot confirm | `unresolved` | stays `candidate` or existing supported level |
| DOI points to different title/authors/year | `conflicted` | no final citation |
| Identifier definitively does not exist or record is clearly invalid | `rejected` | no final citation |

- [ ] Confirm a Chinese record without DOI or abstract remains `unresolved（暂未核验）`, not `rejected（已排除）`.

- [ ] Run the test and confirm it fails.

Run: `node --test skills/research-proposal-coach/tests/metadata-verification.test.mjs`

Expected: FAIL with missing verifier.

- [ ] Implement field-by-field comparison with normalized values and an emitted `verification_notes` array. Never collapse uncertainty into a boolean.

- [ ] Require explicit reasons for `conflicted` and `rejected`. Do not infer `rejected` from missing Crossref coverage.

- [ ] Run the focused test.

Run: `node --test skills/research-proposal-coach/tests/metadata-verification.test.mjs`

Expected: PASS.

- [ ] Commit verification.

```bash
git add skills/research-proposal-coach/scripts skills/research-proposal-coach/tests/metadata-verification.test.mjs
git commit -m "feat: verify literature metadata with graded outcomes"
```

## Task 7: Add Reproducible Run Directories And Offline Pipeline Orchestration

**Files:**

- Create: `skills/research-proposal-coach/scripts/lib/run-directory.mjs`
- Create: `skills/research-proposal-coach/scripts/run-literature-pipeline.mjs`
- Create: `skills/research-proposal-coach/tests/pipeline-offline.test.mjs`
- Create: `skills/research-proposal-coach/tests/fixtures/search-plan.json`

- [ ] Write a failing offline integration test that injects fixture-backed adapters and asserts this exact layout:

```text
literature/runs/<run-id>/
├── search-plan.md
├── raw/openalex.json
├── raw/crossref.json
├── corpus.jsonl
├── relationships.jsonl
├── screening.jsonl
├── evidence-matrix.md
├── claim-ledger.jsonl
└── run-summary.md
```

- [ ] Require a collision-resistant run ID (`YYYYMMDD-HHmmss-<6 hex chars>`), source/query/retrieval timestamps, record counts at each stage, partial failures, and limitations in `run-summary.md`.

- [ ] Run the test and confirm it fails.

Run: `node --test skills/research-proposal-coach/tests/pipeline-offline.test.mjs`

Expected: FAIL with missing orchestrator.

- [ ] Implement orchestration with resumable stages. A later script failure leaves prior raw data intact and marks the run incomplete; rerunning with `--resume <run-id>` continues from valid saved artifacts.

- [ ] Create empty-but-valid `screening.jsonl`, `evidence-matrix.md`, and `claim-ledger.jsonl` work files for the Skill to populate. Do not auto-generate scholarly claims in scripts.

- [ ] Add a regression test for one failed source plus successful remaining sources. The run must finish with an incomplete/limited summary, not fabricate coverage.

- [ ] Run the offline pipeline test.

Run: `node --test skills/research-proposal-coach/tests/pipeline-offline.test.mjs`

Expected: PASS.

- [ ] Commit orchestration.

```bash
git add skills/research-proposal-coach/scripts skills/research-proposal-coach/tests
git commit -m "feat: persist reproducible literature runs"
```

## Task 8: Add Topic Research Scan Guidance And Template

**Files:**

- Create: `skills/research-proposal-coach/modules/topic-research-scan.md`
- Create: `skills/research-proposal-coach/templates/topic-research-scan.md`
- Modify: `skills/research-proposal-coach/modules/topic-discovery.md`
- Modify: `skills/research-proposal-coach/rules/stage-contract.md`
- Create: `skills/research-proposal-coach/tests/topic-scan-contract.test.mjs`
- Create: `skills/research-proposal-coach/maintenance/evals/literature-scenarios.md`

- [ ] Before editing the Skill, run three independent baseline scenarios and save the observed failures: (1) the teacher has only a vague work problem and no citations, (2) public sources return few Chinese results and the teacher asks whether that proves a research gap, and (3) a plausible record has no DOI while the user asks to discard anything unverified. Do not give the evaluator the intended answer. This is the RED phase for the Skill behavior.

- [ ] Write failing static tests requiring the scan to consume a current-session profile snapshot, a real work problem, resources, multiple Chinese/English queries, saved retrieval records, and coverage limitations. These tests enforce mechanical invariants only.

- [ ] Require every recommended direction to contain:

  - teacher/work-scene fit;
  - the problem it addresses;
  - traceable literature signals;
  - feasible data/resources;
  - risks and unresolved evidence;
  - the next confirmation question.

- [ ] Add explicit gap classification. `research_gap（可能的研究空白）` is allowed only after query expansion, time-range review, and coverage review rule out `query_gap`, `source_coverage_gap`, and `access_gap` as better explanations.

- [ ] Add a stage transition that prevents focused review work until the teacher confirms or edits one topic direction.

- [ ] Run the static tests.

Run: `node --test skills/research-proposal-coach/tests/topic-scan-contract.test.mjs`

Expected: PASS.

- [ ] Commit topic scanning.

```bash
git add skills/research-proposal-coach/modules skills/research-proposal-coach/templates skills/research-proposal-coach/rules/stage-contract.md skills/research-proposal-coach/tests/topic-scan-contract.test.mjs
git commit -m "feat: add evidence-grounded topic research scan"
```

## Task 9: Upgrade The Long-Form Literature Review And Claim Ledger

**Files:**

- Modify: `skills/research-proposal-coach/modules/literature-review.md`
- Modify: `skills/research-proposal-coach/templates/literature-review-longform.md`
- Create: `skills/research-proposal-coach/templates/evidence-matrix.md`
- Create: `skills/research-proposal-coach/templates/claim-ledger.jsonl.example`
- Create: `skills/research-proposal-coach/templates/literature-run-summary.md`
- Modify: `skills/research-proposal-coach/templates/literature-review-proposal-section.md`
- Create: `skills/research-proposal-coach/tests/literature-review-contract.test.mjs`

- [ ] Write failing contract tests requiring the long-form review to cover retrieval scope, concepts, thematic research status, methods/practices, agreement, disagreement/counterexamples, limitations, implications for the topic, public-source/full-text limitations, local cases to ask the teacher about, and traceable references.

- [ ] Define the claim ledger contract:

```json
{"claim_id":"C01","claim":"...","source_ids":["openalex:W1"],"support_level":"abstract_supported","evidence_locations":["abstract"],"limitations":["尚未读取全文"]}
```

- [ ] Require every substantive sentence or paragraph in the review to map to one or more claim IDs. Only records in the saved corpus can appear in `source_ids`.

- [ ] Enforce evidence boundaries:

  - `candidate（候选线索）` expands retrieval only;
  - `metadata_verified（元数据已核验）` proves that a study exists, not what it found;
  - `abstract_supported（摘要支持）` permits cautious summaries within the abstract;
  - `fulltext_supported（全文支持）` permits specific claims only with page/section/paragraph locations.

- [ ] Change `literature-review-proposal-section.md` into a compatibility notice/template consumed only by `proposal_mapping`. It must refuse generic compression when no verified application template and field constraints exist.

- [ ] Run the contract tests.

Run: `node --test skills/research-proposal-coach/tests/literature-review-contract.test.mjs`

Expected: PASS.

- [ ] Commit the review workflow.

```bash
git add skills/research-proposal-coach/modules/literature-review.md skills/research-proposal-coach/templates skills/research-proposal-coach/tests/literature-review-contract.test.mjs
git commit -m "feat: ground literature reviews in claim evidence"
```

## Task 10: Wire Search And Review Into The Skill

**Files:**

- Modify: `skills/research-proposal-coach/SKILL.md`
- Modify: `skills/research-proposal-coach/rules/source-policy.md`
- Modify: `skills/research-proposal-coach/rules/material-passport.md`
- Modify: `skills/research-proposal-coach/templates/material-passport.md`
- Create: `skills/research-proposal-coach/tests/literature-skill-wiring.test.mjs`

- [ ] Write failing tests requiring the Skill to load the evidence policy, topic scan module, literature module, and the public-source scripts only when literature work is in scope.

- [ ] Add the two-pass route:

```text
unknown topic -> exploratory queries -> topic research scan -> teacher confirmation
confirmed topic -> focused queries -> evidence matrix -> claim ledger -> long-form review
```

- [ ] Add source-ledger fields for adapter, exact query, filters, retrieval time, raw response path, result count, error count, and coverage limitation.

- [ ] Add hard boundaries: never create references from model memory; never treat an API miss as nonexistence; never cite `conflicted` or `rejected`; never draft claims absent from the claim ledger.

- [ ] Re-run the exact baseline scenarios from Task 8 with an independent evaluator and the updated Skill. Record whether it expands queries, distinguishes coverage/query/access gaps from a research gap, and retains `unresolved` records without using them for unsupported claims. Close only observed instruction gaps, then re-run until the scenarios pass.

- [ ] Run the focused and full suites.

Run: `node --test skills/research-proposal-coach/tests/*literature*.test.mjs skills/research-proposal-coach/tests/topic-scan-contract.test.mjs skills/research-proposal-coach/tests/record-contract.test.mjs`

Expected: PASS.

Run: `node --test skills/research-proposal-coach/tests/*.test.mjs demo/tests/*.test.mjs`

Expected: all tests pass; existing demo remains green until the readiness migration plan intentionally updates it.

- [ ] Commit Skill wiring.

```bash
git add skills/research-proposal-coach/SKILL.md skills/research-proposal-coach/rules skills/research-proposal-coach/templates/material-passport.md skills/research-proposal-coach/tests
git commit -m "feat: integrate public literature research workflow"
```

## Task 11: Add An Explicit Online Smoke Test

**Files:**

- Create: `skills/research-proposal-coach/scripts/smoke-public-sources.mjs`
- Create: `skills/research-proposal-coach/tests/smoke-command.test.mjs`
- Modify: `skills/research-proposal-coach/maintenance/update-log.md`

- [ ] Add a local contract test proving the smoke command requires explicit invocation, uses a tiny request limit, and emits structured success/failure without modifying a real teacher profile.

- [ ] Implement one OpenAlex query and one Crossref DOI lookup with timeouts. Return a non-zero exit code if both fail; return success with warnings if one source succeeds and the other fails.

- [ ] Document that this test is opt-in because network availability and public API behavior are not deterministic.

- [ ] Run offline tests first.

Run: `node --test skills/research-proposal-coach/tests/*.test.mjs`

Expected: PASS without network access.

- [ ] Run the online smoke test only in a network-enabled environment.

Run: `node skills/research-proposal-coach/scripts/smoke-public-sources.mjs`

Expected: JSON reports OpenAlex and Crossref reachability separately; no literature claims or citations are generated.

- [ ] Commit the smoke test.

```bash
git add skills/research-proposal-coach/scripts/smoke-public-sources.mjs skills/research-proposal-coach/tests/smoke-command.test.mjs skills/research-proposal-coach/maintenance/update-log.md
git commit -m "test: add opt-in public source smoke check"
```

## Completion Criteria

- A vague real-world problem can produce multiple saved Chinese/English queries and a traceable topic research scan.
- A confirmed topic can produce a focused corpus, screening record, evidence matrix, claim ledger, and long-form review.
- Exact identities merge; probable duplicates and versions remain recoverable.
- `unresolved（暂未核验）` is retained as uncertainty rather than treated as falsehood.
- Every substantive review claim is bounded by actual abstract/full-text evidence.
- Partial source failures and public-source coverage gaps are visible.
- Adding CNKI or Wanfang later requires a new adapter, not a rewrite of downstream contracts.
