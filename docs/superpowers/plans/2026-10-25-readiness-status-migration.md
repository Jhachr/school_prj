# Semantic Readiness Status Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ambiguous A/B/C grading language with module readiness and explicit output permissions, while preserving a one-time compatibility path for old session JSON and updating the current demo so customers see what can be generated and why.

**Architecture:** Use one canonical readiness evaluator whose result contains an output permission, independent module statuses, blockers, allowed outputs, and next actions. Read old `quality_grade` values only through a migration utility. User-facing surfaces show natural-language capability explanations and bilingual status labels, never A/B/C.

**Tech Stack:** Markdown contracts, browser-native JavaScript demo, Node.js standard library, `node:test`

---

**Required implementation skills:** Use `superpowers:test-driven-development` for the evaluator/demo changes and `superpowers:writing-skills` for Skill instruction changes. Regex scans protect terminology; independent behavior scenarios prove the model applies the new semantics.

## Preconditions And Fixed Contracts

- This plan can be implemented after the profile plan and in parallel with the literature plan only if the executor coordinates shared files (`SKILL.md`, `stage-contract.md`, `source-policy.md`, and `material-passport.md`). In a single-agent execution, implement it after both plans to avoid merge churn.
- Canonical output permissions are:
  - `coaching_only（仅继续引导）`;
  - `stage_artifact_ready（可生成阶段产物）`;
  - `structured_draft_ready（可生成申报结构稿）`.
- Canonical module statuses are:
  - `blocked（暂时阻断）`;
  - `needs_revision（需要修订）`;
  - `ready（已就绪）`.
- The old mapping exists only in migration code: C -> `coaching_only`, B -> `stage_artifact_ready`, A -> `structured_draft_ready`.
- Missing a verified proposal template blocks only proposal mapping/structured proposal drafting. It must not downgrade a completed topic scan or literature review.
- Historical design docs, archived customer communications, and old plans may retain A/B/C as historical context. Current Skill instructions, active product-design docs, demo UI, fixtures, and tests may not present it as the current model.

## Task 1: Replace The Skill Quality Contract

**Files:**

- Create: `skills/research-proposal-coach/rules/output-readiness.md`
- Modify: `skills/research-proposal-coach/rules/quality-rubric.md`
- Modify: `skills/research-proposal-coach/rules/stage-contract.md`
- Create: `skills/research-proposal-coach/tests/readiness-policy.test.mjs`
- Create: `skills/research-proposal-coach/maintenance/evals/readiness-scenarios.md`

- [ ] Before changing instructions, run independent baseline scenarios where (1) literature review evidence is ready but the school template is absent, (2) the teacher asks “我是 A 级还是 B 级”, and (3) one module regresses after a topic change. Record whether the current Skill collapses everything into one grade or misrepresents the teacher. This is the RED phase.

- [ ] Write failing static tests requiring every canonical bilingual status and prohibiting the phrases `Grade A`, `Grade B`, `Grade C`, `A/B/C`, and the JSON key `quality_grade` in current Skill rules.

- [ ] Define `output-readiness.md` as an output-permission policy, not an assessment of the teacher or proposal quality.

The canonical state shape is:

```json
{
  "output_permission": "coaching_only",
  "module_statuses": {
    "teacher_profile": "blocked",
    "topic_research_scan": "blocked",
    "literature_review": "blocked",
    "proposal_mapping": "blocked"
  },
  "allowed_outputs": ["questions", "explanations", "topic_directions"],
  "blockers": [],
  "next_actions": []
}
```

- [ ] Refocus `quality-rubric.md` on separate quality dimensions: teacher fit, problem authenticity, evidence sufficiency, method feasibility, outcome usefulness, template fit, traceability, and dialogue health. Do not collapse them into one grade.

- [ ] Update stage gates so each module has its own status. A topic scan and literature review can be `ready` while proposal mapping is `blocked` because the school template is absent.

- [ ] Run the focused test.

Run: `node --test skills/research-proposal-coach/tests/readiness-policy.test.mjs`

Expected: PASS.

- [ ] Commit the canonical policy.

```bash
git add skills/research-proposal-coach/rules skills/research-proposal-coach/tests/readiness-policy.test.mjs
git commit -m "refactor: replace quality grades with readiness states"
```

## Task 2: Update Skill Modules, Templates, And Examples

**Files:**

- Modify: `skills/research-proposal-coach/SKILL.md`
- Modify: `skills/research-proposal-coach/rules/dialogue-health.md`
- Modify: `skills/research-proposal-coach/rules/guidance-principles.md`
- Modify: `skills/research-proposal-coach/rules/human-ai-collaboration.md`
- Modify: `skills/research-proposal-coach/rules/material-passport.md`
- Modify: `skills/research-proposal-coach/rules/source-policy.md`
- Modify: `skills/research-proposal-coach/modules/literature-review.md`
- Modify: `skills/research-proposal-coach/modules/learning-feedback.md`
- Modify: `skills/research-proposal-coach/modules/proposal-mapping.md`
- Modify: `skills/research-proposal-coach/templates/material-passport.md`
- Modify: `skills/research-proposal-coach/templates/quality-report.md`
- Modify: `skills/research-proposal-coach/templates/topic-card.md`
- Rename: `skills/research-proposal-coach/examples/live-commerce-b-grade.md` to `skills/research-proposal-coach/examples/live-commerce-stage-artifact-ready.md`
- Modify: `skills/research-proposal-coach/maintenance/eval-case-template.md`
- Create: `skills/research-proposal-coach/tests/no-user-facing-grades.test.mjs`

- [ ] Write a failing scan test over current Skill files. Exclude `docs/`, design specs, migration scripts/tests, and archives; fail on user-facing A/B/C terminology or legacy fields.

```js
const forbidden = [/A\/B\/C/, /Grade [ABC]/, /quality_grade/, /[ABC] 级/];
for (const file of currentSkillFiles) {
  for (const pattern of forbidden) assert.doesNotMatch(await read(file), pattern, file);
}
```

- [ ] Replace hard boundaries with capability language:

  - `coaching_only`: questions, explanation, search planning, and tentative directions;
  - `stage_artifact_ready`: confirmed stage artifacts such as topic scan and literature review;
  - `structured_draft_ready`: verified-template proposal field drafts that still require human/expert review.

- [ ] Update module statuses from `pass` to `ready` and use bilingual labels on teacher-facing output.

- [ ] Make the quality report list module status, evidence, blocker, allowed action, and next action. It must answer “现在能做什么、为什么、还缺什么”.

- [ ] Rename the example and rewrite it as a `stage_artifact_ready` regression case.

- [ ] Run the scan test.

Run: `node --test skills/research-proposal-coach/tests/no-user-facing-grades.test.mjs`

Expected: PASS.

- [ ] Re-run the exact Task 1 scenarios through an independent evaluator. It must explain capability in natural Chinese, preserve independent module statuses, and avoid presenting internal status codes as a teacher score. Record the GREEN result and fix only observed loopholes.

- [ ] Commit the Skill migration.

```bash
git add skills/research-proposal-coach
git commit -m "refactor: use semantic readiness across the skill"
```

## Task 3: Add One-Time Legacy Session Migration

**Files:**

- Create: `skills/research-proposal-coach/scripts/migrate-session-state.mjs`
- Create: `skills/research-proposal-coach/scripts/lib/readiness-migration.mjs`
- Create: `skills/research-proposal-coach/tests/readiness-migration.test.mjs`

- [ ] Write failing tests for C, B, A, already-migrated input, unknown grades, malformed JSON, and retention of unrelated state fields.

```js
assert.deepEqual(migrateLegacyState({ quality_grade: 'B', selected_topic: { id: 'T1' } }), {
  output_readiness: { output_permission: 'stage_artifact_ready' },
  selected_topic: { id: 'T1' },
  migration: { from_schema: 'legacy-grade', to_schema: 'readiness-v1' }
});
```

- [ ] Run the test and confirm it fails because the migration module does not exist.

Run: `node --test skills/research-proposal-coach/tests/readiness-migration.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] Implement an idempotent pure migration function. Unknown grades must return an error and must not guess an output permission.

- [ ] Implement a CLI that reads one JSON file and writes a separate migrated file by default. `--in-place` requires an explicit flag and creates a timestamped backup first.

- [ ] Ensure migration output contains no `quality_grade` field and includes a schema/migration note.

- [ ] Run the focused test.

Run: `node --test skills/research-proposal-coach/tests/readiness-migration.test.mjs`

Expected: PASS.

- [ ] Commit the compatibility utility.

```bash
git add skills/research-proposal-coach/scripts skills/research-proposal-coach/tests/readiness-migration.test.mjs
git commit -m "feat: migrate legacy grade session state"
```

## Task 4: Migrate The Demo State Engine

**Files:**

- Modify: `demo/src/state.mjs`
- Modify: `demo/src/outputs.mjs`
- Modify: `demo/src/fixtures.mjs`
- Modify: `demo/tests/state.test.mjs`
- Modify: `demo/tests/outputs.test.mjs`
- Modify: `demo/tests/progressive-flow.test.mjs`

- [ ] Rewrite tests first to import `evaluateReadiness()` and assert permission plus independent module statuses.

```js
test('缺少申报模板只阻断申报映射', () => {
  const result = evaluateReadiness(completeLiteratureWithoutTemplate);
  assert.equal(result.outputPermission, 'stage_artifact_ready');
  assert.equal(result.moduleStatuses.literature_review, 'ready');
  assert.equal(result.moduleStatuses.proposal_mapping, 'blocked');
});
```

- [ ] Preserve the existing business gates but map them semantically:

  - missing core profile/problem/topic/question -> `coaching_only`;
  - core research direction confirmed but one or more stage artifacts still need work -> module-level statuses and `stage_artifact_ready` when at least one stage artifact is valid;
  - real guide, literature, method/outcomes, and template confirmed -> `structured_draft_ready`.

- [ ] Make `ALLOWED_OUTPUTS` keyed by output permission. Include `topic_research_scan` and `literature_review_longform`; do not list generic proposal literature compression.

- [ ] Rename fixture input from `gradeInput` to `readinessInput`, snapshot `quality` to `readiness`, and user notes to natural capability explanations.

- [ ] Run the demo tests and confirm they pass with the new expectations.

Run: `node --test demo/tests/*.test.mjs`

Expected: the same 18 behavioral tests pass after their assertions are migrated; no A/B/C assertion remains.

- [ ] Commit the state migration.

```bash
git add demo/src/state.mjs demo/src/outputs.mjs demo/src/fixtures.mjs demo/tests
git commit -m "refactor: migrate demo to semantic readiness"
```

## Task 5: Migrate The Demo UI

**Files:**

- Modify: `demo/index.html`
- Modify: `demo/src/app.mjs`
- Modify: `demo/styles.css`
- Create: `demo/tests/ui-copy.test.mjs`

- [ ] Write a failing static test that prohibits A/B/C badges/copy and requires `当前可做`, `暂时不能做`, and `下一步` in the user-facing UI.

- [ ] Replace the single-letter grade badge with a compact capability badge. Keep internal codes out of the primary visual; show natural Chinese labels such as `继续引导`, `可生成阶段产物`, and `可生成申报结构稿`.

- [ ] Add module-status rows where helpful so missing proposal template does not visually invalidate a finished literature review.

- [ ] Rename CSS selectors from `grade-*` to `readiness-*` and retain accessible color contrast. Status must remain understandable without color.

- [ ] Update step-guide copy and output panel headings to the two fixed literature artifacts.

- [ ] Run all demo tests.

Run: `node --test demo/tests/*.test.mjs`

Expected: PASS; UI-copy test finds no current grade language.

- [ ] Commit the UI migration.

```bash
git add demo/index.html demo/src/app.mjs demo/styles.css demo/tests/ui-copy.test.mjs
git commit -m "refactor: explain demo output readiness in plain language"
```

## Task 6: Update Active Product Documentation

**Files:**

- Modify: `README.md`
- Modify: `product-design/README.md`
- Modify: `product-design/01-novice-teacher-user-flow.md`
- Modify: `product-design/03-proposal-quality-rubric.md`
- Modify: `product-design/04-customer-materials-request.md`
- Modify: `product-design/05-stage-rule-blueprint.md`
- Modify: `product-design/06-demo-output-samples.md`
- Modify: `product-design/10-skill-development-technical-plan.md`
- Create: `product-design/11-readiness-status-migration.md`
- Create: `demo/tests/active-docs-copy.test.mjs`

- [ ] Add a current-doc scan test. Exclude `product-design/archive/`, dated historical plans/specs, and customer raw records.

- [ ] Rewrite active documentation to explain why A/B/C was retired, the new semantic states, independent module status, and the legacy migration mapping.

- [ ] Update customer material rationale: templates and guides are required for proposal mapping, not for assigning an A/B/C score.

- [ ] Preserve history by documenting the migration in `11-readiness-status-migration.md`; do not rewrite archived customer quotations.

- [ ] Run active-doc and full regression tests.

Run: `node --test demo/tests/*.test.mjs skills/research-proposal-coach/tests/*.test.mjs`

Expected: PASS.

- [ ] Commit documentation.

```bash
git add README.md product-design demo/tests/active-docs-copy.test.mjs
git commit -m "docs: document semantic readiness model"
```

## Task 7: Verify Migration Completeness

**Files:** None expected beyond fixes revealed by verification.

- [ ] Search current surfaces for stale grade vocabulary.

Run: `rg -n 'A/B/C|Grade [ABC]|quality_grade|[ABC]级|grade-badge|evaluateGrade|gradeInput' README.md product-design demo skills/research-proposal-coach --glob '!product-design/archive/**' --glob '!docs/**' --glob '!scripts/migrate-session-state.mjs' --glob '!scripts/lib/readiness-migration.mjs' --glob '!tests/readiness-migration.test.mjs'`

Expected: no current-model matches. Historical filenames or explicit migration documentation should be reviewed rather than blindly removed.

- [ ] Run every repository test.

Run: `node --test demo/tests/*.test.mjs skills/research-proposal-coach/tests/*.test.mjs`

Expected: PASS.

- [ ] Inspect `git diff --check` and the final diff.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] Commit any verification fixes.

```bash
git add README.md product-design demo skills/research-proposal-coach
git commit -m "test: complete readiness terminology migration"
```

## Completion Criteria

- Current teacher-facing behavior no longer exposes A/B/C.
- Readiness states answer what the system can generate, why, and what remains.
- Module status is independent, so one missing downstream input does not erase upstream work.
- Old saved session state has one explicit, idempotent migration path.
- Historical documents remain understandable as history rather than silently rewritten evidence.
