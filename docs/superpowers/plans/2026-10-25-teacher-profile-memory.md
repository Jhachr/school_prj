# Teacher Profile And Local Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give one teacher per computer a transparent, consent-based local identity, teacher profile, and reusable memory that survives across Trae conversations without introducing a database or background service.

**Architecture:** Keep human-readable Markdown as the source of truth under `RESEARCH_COACH_HOME`, and use one dependency-free Node.js CLI only for deterministic path resolution, validation, atomic writes, export, and deletion. The Skill remains responsible for conversation, confirmation, and deciding what is worth remembering. A temporary session bypasses all profile reads and writes.

**Tech Stack:** Markdown with constrained YAML frontmatter, Node.js standard library, `node:test`, Trae Skill instructions

---

**Required implementation skills:** Use `superpowers:test-driven-development` for every script change and `superpowers:writing-skills` for every Skill-instruction change. Skill behavior requires RED/GREEN forward testing in addition to mechanical file tests.

## Preconditions And Fixed Contracts

- Implement in this order before the literature and integration plans.
- The logical data root is `RESEARCH_COACH_HOME` when set; otherwise it is `~/.research-proposal-coach` on macOS/Linux and `%USERPROFILE%/.research-proposal-coach` on Windows via `os.homedir()`.
- The machine has one persisted identity. Do not introduce workspace, project, topic, tenant, or account keys.
- `teacher-profile.md` and the three files under `memories/` are the durable user-facing source of truth.
- Temporary sessions must neither read nor write the durable profile.
- No command may silently overwrite malformed Markdown. Mutating commands must use a temporary sibling file plus `rename()`.
- The CLI accepts JSON on stdin and emits JSON on stdout. Diagnostics go to stderr; failures return a non-zero exit code.
- Tests must set `RESEARCH_COACH_HOME` to a test-owned temporary directory. Never read or modify the developer's real home profile.

## Task 1: Lock The Profile Store Contract With Failing Tests

**Files:**

- Create: `skills/research-proposal-coach/tests/profile-store.test.mjs`
- Create: `skills/research-proposal-coach/tests/helpers/temp-home.mjs`

- [ ] Write a temporary-home helper that creates and cleans a unique directory under `os.tmpdir()` and returns an environment object containing only `RESEARCH_COACH_HOME`.

```js
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function withResearchCoachHome(run) {
  const root = await mkdtemp(join(tmpdir(), 'research-coach-test-'));
  try {
    await run({ root, env: { ...process.env, RESEARCH_COACH_HOME: root } });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
```

- [ ] Add failing tests for `resolveResearchCoachHome()` and `initializeStore()`.

```js
test('RESEARCH_COACH_HOME overrides the platform default', () => {
  assert.equal(resolveResearchCoachHome({ RESEARCH_COACH_HOME: '/tmp/example' }), '/tmp/example');
});

test('initializeStore creates the durable layout without a profile', async () => {
  await withResearchCoachHome(async ({ root }) => {
    const result = await initializeStore({ root });
    assert.equal(result.initialized, true);
    assert.deepEqual(await readdir(root), ['artifacts', 'config', 'literature', 'memories', 'sessions']);
  });
});
```

- [ ] Add failing tests for these invariants:

  - initialization is idempotent;
  - the initial layout contains `memories/research-history.md`, `memories/learning-feedback.md`, and `memories/preferences.md`;
  - no `teacher-profile.md` is created before consent and confirmed minimum fields;
  - all returned paths remain descendants of the resolved root.

- [ ] Run the tests and confirm the intended failure.

Run: `node --test skills/research-proposal-coach/tests/profile-store.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/lib/profile-store.mjs`.

- [ ] Commit the test contract.

```bash
git add skills/research-proposal-coach/tests
git commit -m "test: define local profile store contract"
```

## Task 2: Implement Safe Store Initialization And Profile Parsing

**Files:**

- Create: `skills/research-proposal-coach/scripts/lib/profile-store.mjs`
- Modify: `skills/research-proposal-coach/tests/profile-store.test.mjs`

- [ ] Implement path resolution and store initialization with Node standard-library APIs only.

```js
export function resolveResearchCoachHome(env = process.env) {
  return resolve(env.RESEARCH_COACH_HOME || join(homedir(), '.research-proposal-coach'));
}

export async function initializeStore({ root = resolveResearchCoachHome() } = {}) {
  for (const relative of ['memories', 'sessions', 'literature/runs', 'artifacts', 'config']) {
    await mkdir(join(root, relative), { recursive: true });
  }
  await ensureMemoryTemplates(root);
  return { root, initialized: true };
}
```

- [ ] Add a strict frontmatter parser for the controlled scalar keys `profile_id`, `display_name`, `created_at`, `updated_at`, and `memory_consent`. Reject duplicate keys, missing delimiters, unsupported keys, or invalid dates. Preserve the original file unchanged on errors.

- [ ] Add `readProfile()` with the following machine result shape:

```json
{
  "status": "missing",
  "profile": null,
  "path": "/resolved/root/teacher-profile.md",
  "diagnostics": []
}
```

Allowed `status` values are `missing`, `ready`, and `malformed`.

- [ ] Add parsing tests for a valid Chinese profile, missing profile, malformed frontmatter, duplicate keys, and a path outside the root.

- [ ] Run the focused tests.

Run: `node --test skills/research-proposal-coach/tests/profile-store.test.mjs`

Expected: PASS.

- [ ] Commit the implementation.

```bash
git add skills/research-proposal-coach/scripts/lib/profile-store.mjs skills/research-proposal-coach/tests/profile-store.test.mjs
git commit -m "feat: add safe local profile store"
```

## Task 3: Add The Profile And Memory Markdown Templates

**Files:**

- Create: `skills/research-proposal-coach/templates/teacher-profile.md`
- Create: `skills/research-proposal-coach/templates/research-history.md`
- Create: `skills/research-proposal-coach/templates/learning-feedback-memory.md`
- Create: `skills/research-proposal-coach/templates/preferences.md`
- Create: `skills/research-proposal-coach/templates/session-memory-review.md`
- Create: `skills/research-proposal-coach/tests/profile-templates.test.mjs`

- [ ] Write failing structure tests that require:

  - the profile's fixed frontmatter keys;
  - the minimum fields `院系或专业领域`, `岗位或主要职责`, `课程或工作场景`, `近期重点任务或科研基础`;
  - columns for value, source status, last-confirmed time, and history;
  - an explicit `不得保存` section covering credentials, unrelated identifiers, student personal data, unconfirmed inference, and full chat transcripts;
  - the bilingual values `suggested_from_history（根据历史推荐）`, `user_confirmed（本次已确认）`, and `superseded（已被新信息替代）`.

```js
for (const label of [
  'suggested_from_history（根据历史推荐）',
  'user_confirmed（本次已确认）',
  'superseded（已被新信息替代）'
]) {
  assert.match(allTemplateText, new RegExp(escapeRegExp(label)));
}
```

- [ ] Run the tests and confirm they fail because the templates do not exist.

Run: `node --test skills/research-proposal-coach/tests/profile-templates.test.mjs`

Expected: FAIL with missing file errors.

- [ ] Create concise, user-readable templates. Use stable HTML markers around append-only entries so the CLI can update a controlled region without rewriting teacher-authored prose.

```markdown
<!-- memory-entries:start -->
| 记忆编号 | 内容 | 状态 | 首次确认 | 最后确认 | 关联产物 |
|---|---|---|---|---|---|
<!-- memory-entries:end -->
```

- [ ] Make the session review template separate proposed writes from items that will remain session-only. Require an explicit yes/no decision for every proposed durable item.

- [ ] Run the template tests.

Run: `node --test skills/research-proposal-coach/tests/profile-templates.test.mjs`

Expected: PASS.

- [ ] Commit the templates.

```bash
git add skills/research-proposal-coach/templates skills/research-proposal-coach/tests/profile-templates.test.mjs
git commit -m "feat: add teacher profile and memory templates"
```

## Task 4: Implement Confirmed Profile And Memory Mutations

**Files:**

- Create: `skills/research-proposal-coach/scripts/profile-store.mjs`
- Modify: `skills/research-proposal-coach/scripts/lib/profile-store.mjs`
- Modify: `skills/research-proposal-coach/tests/profile-store.test.mjs`

- [ ] Add failing tests for the CLI commands `status`, `init`, `commit`, `export`, `forget`, and `purge`.

The command contract is:

```text
node scripts/profile-store.mjs status
node scripts/profile-store.mjs init < confirmed-profile.json
node scripts/profile-store.mjs commit < confirmed-memory-batch.json
node scripts/profile-store.mjs export --output <directory>
node scripts/profile-store.mjs forget < memory-selection.json
node scripts/profile-store.mjs purge --confirm <profile-id>
```

`init` input must include `memory_consent: true` and all minimum fields. `commit` input must include `confirmation: "user_confirmed"`; otherwise it performs no write and exits non-zero.

- [ ] Add an atomic writer that creates a temporary sibling, flushes, and renames it over the target. On malformed existing Markdown, copy the original to `config/diagnostics/<timestamp>-<filename>` and return read-only status rather than overwriting it.

- [ ] Implement conflict handling. The current confirmed value becomes active; the previous row remains in the history block with `superseded（已被新信息替代）` and its prior confirmation timestamp.

- [ ] Implement export as a copy of the complete profile, memories, and a manifest containing export time and schema version. Do not include `sessions/` raw working files.

- [ ] Implement deletion protections:

  - `forget` requires exact memory IDs and records a local tombstone so a stale session cannot re-add the item silently;
  - `purge` requires the exact current `profile_id` in `--confirm`;
  - neither command follows symlinks outside the data root;
  - CLI JSON reports exactly what was removed.

- [ ] Add a regression test proving a temporary-session payload is rejected by every mutating command.

```js
await assert.rejects(
  () => commitMemories({ sessionMode: 'temporary', items: [confirmedItem] }),
  /temporary session cannot write durable memory/
);
```

- [ ] Run the focused tests.

Run: `node --test skills/research-proposal-coach/tests/profile-store.test.mjs`

Expected: PASS.

- [ ] Commit the mutation CLI.

```bash
git add skills/research-proposal-coach/scripts skills/research-proposal-coach/tests/profile-store.test.mjs
git commit -m "feat: manage confirmed local teacher memories"
```

## Task 5: Define Session Identity Routing And Memory Policy

**Files:**

- Create: `skills/research-proposal-coach/modules/session-entry.md`
- Create: `skills/research-proposal-coach/rules/profile-memory-policy.md`
- Modify: `skills/research-proposal-coach/modules/teacher-profile.md`
- Modify: `skills/research-proposal-coach/rules/stage-contract.md`
- Create: `skills/research-proposal-coach/tests/profile-instructions.test.mjs`
- Create: `skills/research-proposal-coach/maintenance/evals/profile-memory-scenarios.md`

- [ ] Before editing the Skill, write three realistic pressure scenarios: (1) a returning teacher asks for topic ideas and pushes to skip identity confirmation, (2) a teacher selects temporary mode and later shares useful personal context, and (3) a stale history item conflicts with a current answer while the user asks to “just continue”.

- [ ] Run the scenarios with an independent evaluator against the current Skill, without giving it the desired answer. Save the observed transcript and exact failure/rationalization in `maintenance/evals/profile-memory-scenarios.md`. This is the RED phase for the instruction change.

- [ ] Write failing static contract tests for the session entry behavior. These mechanical tests supplement, but do not replace, the behavioral scenarios.

Required branches:

```text
profile missing -> explain local storage -> request consent -> collect minimum fields -> show summary -> initialize only after confirmation
profile ready -> ask "是否以 X 老师身份继续" -> show proposed historical reuse -> confirm/correct -> enter coaching
teacher declines -> temporary session -> no durable read/write -> optional archive offer at session end
profile malformed -> preserve file -> read-only mode -> show recovery path
```

- [ ] Add the session state fields below and remove any implication that the working directory chooses identity.

```json
{
  "active_identity": "local-teacher|null",
  "session_mode": "teacher|temporary",
  "memory_consent": false,
  "history_reuse": [],
  "memory_candidates": []
}
```

- [ ] Define the memory lifecycle in `profile-memory-policy.md`: candidate generation, end-of-module collection, end-of-session review, explicit confirmation, durable commit, correction, supersession, export, item deletion, and total deletion.

- [ ] Update the teacher profile module so historical facts begin as `suggested_from_history（根据历史推荐）` and become `user_confirmed（本次已确认）` only after current-session confirmation.

- [ ] Require natural-language explanations whenever a status appears. The teacher should hear what the system plans to reuse, not only an internal code.

- [ ] Run the static instruction tests.

Run: `node --test skills/research-proposal-coach/tests/profile-instructions.test.mjs`

Expected: PASS.

- [ ] Commit the session behavior.

```bash
git add skills/research-proposal-coach/modules skills/research-proposal-coach/rules skills/research-proposal-coach/tests/profile-instructions.test.mjs
git commit -m "feat: route teacher and temporary sessions"
```

## Task 6: Wire The Entry Flow Into The Skill

**Files:**

- Modify: `skills/research-proposal-coach/SKILL.md`
- Modify: `skills/research-proposal-coach/agents/openai.yaml`
- Modify: `skills/research-proposal-coach/tests/profile-instructions.test.mjs`

- [ ] Add a failing test proving `SKILL.md` loads `modules/session-entry.md` and `rules/profile-memory-policy.md` before ordinary coaching modules.

- [ ] Update `SKILL.md` with an explicit startup sequence:

  1. resolve and inspect local state with `profile-store.mjs status`;
  2. perform identity routing;
  3. enter the existing stage flow only after the route is known;
  4. collect memory candidates without writing them;
  5. offer a final memory review before any durable commit.

- [ ] Add hard boundaries stating that temporary sessions do not read or write durable data, full chats are not memory, and no successful-save claim is allowed unless the CLI returns success.

- [ ] Update the short description only if needed to mention local, consent-based continuity without promising autonomous memory.

- [ ] Run the focused tests and the existing regression suite.

Run: `node --test skills/research-proposal-coach/tests/profile-instructions.test.mjs skills/research-proposal-coach/tests/profile-store.test.mjs skills/research-proposal-coach/tests/profile-templates.test.mjs`

Expected: PASS.

Run: `node --test demo/tests/*.test.mjs`

Expected: 18 tests pass, 0 fail.

- [ ] Commit the Skill wiring.

```bash
git add skills/research-proposal-coach/SKILL.md skills/research-proposal-coach/agents/openai.yaml skills/research-proposal-coach/tests
git commit -m "feat: enable consent-based teacher continuity"
```

## Task 7: Perform Profile Acceptance Verification

**Files:**

- Create: `skills/research-proposal-coach/tests/profile-acceptance.test.mjs`
- Modify: `skills/research-proposal-coach/maintenance/eval-case-template.md`

- [ ] Add an end-to-end test that runs the CLI as a subprocess in a temporary root and covers first-use init, second-session reuse, correction with supersession, export, one-item deletion, temporary-session rejection, and full purge.

- [ ] Add evaluation cases for these human behaviors:

  - the assistant asks before using the detected teacher identity;
  - a recommended historical fact is visibly distinguished from a current confirmation;
  - the assistant does not pressure the teacher to persist a temporary session;
  - a malformed profile produces an honest read-only fallback.

- [ ] Re-run the exact Task 5 pressure scenarios with the updated Skill through an independent evaluator. The evaluator must choose teacher/temporary routes correctly, avoid durable writes without consent, and surface conflicts without being told the expected behavior. Record the GREEN result and any remaining loopholes; tighten only the instructions that an observed failure justifies.

- [ ] Run the complete profile suite.

Run: `node --test skills/research-proposal-coach/tests/profile-*.test.mjs`

Expected: all profile tests pass, no files are created outside test temporary roots.

- [ ] Inspect changes for accidental personal data or absolute developer paths.

Run: `rg -n '/Users/|teacher-profile\.md' skills/research-proposal-coach --glob '!tests/**'`

Expected: no developer-specific path; template and documentation references are allowed.

- [ ] Commit the acceptance coverage.

```bash
git add skills/research-proposal-coach/tests/profile-acceptance.test.mjs skills/research-proposal-coach/maintenance/eval-case-template.md
git commit -m "test: cover teacher memory lifecycle"
```

## Completion Criteria

- A first-time teacher can opt in and create a confirmed profile.
- A returning teacher is asked whether to use the detected identity before history affects the session.
- A temporary session is isolated from durable data.
- History is proposed, confirmed, corrected, and superseded transparently.
- The teacher can inspect, export, forget, or purge local data.
- No database, daemon, MCP server, external package, or workspace-specific identity is introduced.
