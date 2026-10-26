# Coaching Interaction Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify `research-proposal-coach` so teachers encounter one understandable decision at a time, large artifacts follow a confirmed research backbone, and the assistant detects and stops confirmation fatigue that it creates.

**Architecture:** Keep the existing identity, ten-state pipeline, source policy, quality rubric, and Material Passport as internal controls. Add a teacher-facing interaction layer across the entry module, guidance rules, stage contract, dialogue-health rules, and relevant coaching modules; enforce the new behavior with instruction-wiring tests and realistic evaluation scenarios.

**Tech Stack:** Markdown Agent Skill instructions, Node.js `node:test`, shell validation and packaging.

---

### Task 1: Add failing interaction-contract tests

**Files:**
- Create: `skills/research-proposal-coach/tests/coaching-interaction-instructions.test.mjs`
- Test: `skills/research-proposal-coach/tests/coaching-interaction-instructions.test.mjs`

- [ ] **Step 1: Create the instruction-contract test file**

```javascript
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return readFile(join(skillRoot, relativePath), 'utf8');
}

test('first use offers one low-friction route before profile collection', async () => {
  const entry = await read('modules/session-entry.md');
  assert.match(entry, /只问一个路由问题/);
  assert.match(entry, /先临时聊/);
  assert.match(entry, /一次性收集/);
});

test('question format follows information type and defaults to one user action', async () => {
  const guidance = await read('rules/guidance-principles.md');
  assert.match(guidance, /开放描述[^\n]*正文提问/);
  assert.match(guidance, /封闭路由[^\n]*(列表|选项)/);
  assert.match(guidance, /半开放决策[^\n]*(组合|改写)/);
  assert.match(guidance, /每次回复默认[^\n]*一个[^\n]*动作/);
});

test('valid choices and revisions count as confirmation without a second checkpoint', async () => {
  const stage = await read('rules/stage-contract.md');
  assert.match(stage, /(选择|修订|纠正)[^\n]*构成[^\n]*确认/);
  assert.match(stage, /(不得|不要)[^\n]*(重复|再次)[^\n]*确认/);
});

test('dialogue health detects assistant-created confirmation fatigue', async () => {
  const health = await read('rules/dialogue-health.md');
  for (const required of ['确认疲劳', '连续两轮', '连续三轮', '系统自身']) {
    assert.match(health, new RegExp(required));
  }
  assert.match(health, /黄色[^\n]*(减少|停止)[^\n]*(问题|追问)/);
});

test('large artifacts require a confirmed research backbone card', async () => {
  const [skill, method, template] = await Promise.all([
    read('SKILL.md'),
    read('modules/method-outcome-design.md'),
    read('templates/research-backbone-card.md'),
  ]);
  assert.match(skill, /大型产物[^\n]*研究骨架卡/);
  assert.match(method, /研究骨架卡/);
  for (const field of ['真实问题', '核心问题', '改变措施', '判断证据', '预期成果', '结论边界']) {
    assert.match(template, new RegExp(field));
  }
});

test('goal changes are rerouted and learning feedback is milestone based', async () => {
  const [stage, feedback] = await Promise.all([
    read('rules/stage-contract.md'),
    read('modules/learning-feedback.md'),
  ]);
  assert.match(stage, /(论文|课题申报|教学改进)[^\n]*(目标|路由)/);
  assert.match(feedback, /里程碑/);
  assert.match(feedback, /已经想清楚/);
  assert.match(feedback, /最需要补强/);
  assert.match(feedback, /最值得[^\n]*(收集|阅读)/);
});

test('unexplained direction changes remain unknown instead of user confirmed', async () => {
  const policy = await read('rules/profile-memory-policy.md');
  assert.match(policy, /方向[^\n]*原因[^\n]*(未知|系统推测)/);
  assert.match(policy, /(不得|不能)[^\n]*user_confirmed/);
});
```

- [ ] **Step 2: Run the new test and verify the RED state**

Run:

```bash
node --test skills/research-proposal-coach/tests/coaching-interaction-instructions.test.mjs
```

Expected: FAIL because the current entry, guidance, stage, health, memory, and module files do not contain the new interaction contract and `templates/research-backbone-card.md` does not exist.

- [ ] **Step 3: Commit the failing test**

```bash
git add skills/research-proposal-coach/tests/coaching-interaction-instructions.test.mjs
git commit -m "test: define research coaching interaction contract"
```

### Task 2: Implement the teacher-facing interaction layer

**Files:**
- Modify: `skills/research-proposal-coach/SKILL.md`
- Modify: `skills/research-proposal-coach/modules/session-entry.md`
- Modify: `skills/research-proposal-coach/rules/guidance-principles.md`
- Modify: `skills/research-proposal-coach/rules/stage-contract.md`
- Modify: `skills/research-proposal-coach/rules/dialogue-health.md`
- Modify: `skills/research-proposal-coach/rules/profile-memory-policy.md`
- Test: `skills/research-proposal-coach/tests/coaching-interaction-instructions.test.mjs`

- [ ] **Step 1: Add entrypoint-level invariants to `SKILL.md`**

Add a concise teacher-facing interaction section after `Operating Stance` with these enforceable rules:

```markdown
## Teacher-Facing Simplicity

Keep internal state, source, quality, and Passport codes in working records. By default, translate them into plain teacher-facing language rather than showing `FULL`, `MANDATORY`, A/B/C, or raw source-status codes.

- Each response should normally request one user action, not end with a routine bundle of questions.
- A teacher's explicit choice, correction, rewrite, or instruction to continue is confirmation; do not ask for the same confirmation again.
- Before a large artifact such as a task bank, scale, lesson package, long review, or proposal section, explain why it is needed now and show the research backbone card from `templates/research-backbone-card.md`.
- When the goal changes among paper research, project application, and teaching improvement, confirm the new goal once and reuse only compatible upstream work.
```

Update the default module loop so learning feedback occurs at meaningful milestones instead of after every state.

- [ ] **Step 2: Make first use progressive in `modules/session-entry.md`**

Replace the first-use sequence with one route question that recommends temporary mode, enters coaching immediately after the route is chosen, and only performs one-pass minimum-field collection when the teacher chooses to create a profile now. Preserve the existing no-read/no-write rule for temporary sessions and CLI success requirement for initialization.

- [ ] **Step 3: Define information-type input formats in `rules/guidance-principles.md`**

Replace the response pattern and question-budget rules with:

```markdown
## One-Action Response Pattern

1. Restate the teacher's current decision or problem.
2. Explain the single risk, distinction, or purpose that matters now.
3. Provide a compact draft or options only when useful.
4. Request one next action. Ask two questions only in explicit deep mode when both are independently answerable.

## Question Format

| Type | Format | Rule |
|---|---|---|
| 开放描述 | 正文提问 | Ask one central question; optionally give one short example. |
| 封闭路由 | 2-3 item list | Options must be mutually exclusive; no explanation is required. |
| 半开放决策 | 2-3 candidates plus 组合/改写 | Use concrete scenes first and allow a teacher-created option. |
| 信息核对 | Compact summary | A correction, selection, or “按这个做” confirms the item; do not reconfirm. |
```

Add plain teacher-facing status language and keep internal codes out of ordinary replies.

- [ ] **Step 4: Separate internal gates from visible confirmations in `rules/stage-contract.md`**

Keep all ten internal states, but add a four-stage teacher-facing view, change `FULL` so selection/revision/correction counts as explicit confirmation, prohibit duplicate confirmation, add a `current_goal` field, and route changes among `paper`, `project_application`, and `teaching_improvement` with one clarification.

- [ ] **Step 5: Make dialogue health self-correcting in `rules/dialogue-health.md`**

Add assistant-created fatigue signals for two consecutive low-information confirmations, three consecutive assistant turns ending in a new question, and repeat confirmation of an already-owned decision. Under yellow status, require the assistant to reduce or stop questions, consolidate current state, and either proceed from an existing choice or ask one decision-changing open question.

- [ ] **Step 6: Protect unknown decision reasons in `rules/profile-memory-policy.md`**

Add a rule that an unexplained direction change keeps `decision_reason: unknown` or `ai_suggestion（系统推测）`; it cannot become `user_confirmed`. Add milestone batching for profile conflicts and memory candidates.

- [ ] **Step 7: Run the focused test and inspect remaining failures**

Run:

```bash
node --test skills/research-proposal-coach/tests/coaching-interaction-instructions.test.mjs
```

Expected: the entry, question-format, confirmation, fatigue, goal-route, and memory tests pass; the research-backbone and milestone-feedback tests may still fail until Task 3.

- [ ] **Step 8: Commit the interaction-layer changes**

```bash
git add skills/research-proposal-coach/SKILL.md \
  skills/research-proposal-coach/modules/session-entry.md \
  skills/research-proposal-coach/rules/guidance-principles.md \
  skills/research-proposal-coach/rules/stage-contract.md \
  skills/research-proposal-coach/rules/dialogue-health.md \
  skills/research-proposal-coach/rules/profile-memory-policy.md
git commit -m "feat: simplify teacher-facing coaching interaction"
```

### Task 3: Gate artifacts behind a research backbone and add milestone feedback

**Files:**
- Create: `skills/research-proposal-coach/templates/research-backbone-card.md`
- Create: `skills/research-proposal-coach/maintenance/evals/coaching-interaction-scenarios.md`
- Modify: `skills/research-proposal-coach/modules/topic-discovery.md`
- Modify: `skills/research-proposal-coach/modules/method-outcome-design.md`
- Modify: `skills/research-proposal-coach/modules/learning-feedback.md`
- Modify: `skills/research-proposal-coach/maintenance/eval-case-template.md`
- Test: `skills/research-proposal-coach/tests/coaching-interaction-instructions.test.mjs`

- [ ] **Step 1: Create `templates/research-backbone-card.md`**

Use this teacher-facing template:

```markdown
# 研究骨架卡

这张卡说明当前研究为什么成立，以及下一件产物在研究中承担什么作用。老师可以一次确认整张卡，也可以只改一项。

| 字段 | 当前内容 | 教师可见状态 |
|---|---|---|
| 真实问题 |  |  |
| 核心问题 |  |  |
| 改变措施 |  |  |
| 判断证据 |  |  |
| 预期成果 |  |  |
| 结论边界 |  |  |

## 为什么现在做下一件产物

- 下一件产物：
- 它在研究中的作用：
- 生成前仍需老师决定：
```

- [ ] **Step 2: Update topic and method modules**

In `modules/topic-discovery.md`, require scene-first direction descriptions, a combine/rewrite option, and a non-blocking one-sentence reason. In `modules/method-outcome-design.md`, require the backbone card before task banks, scales, lesson packages, long reviews, or proposal sections; allow samples while unconfirmed but prohibit presenting a large artifact as settled.

- [ ] **Step 3: Make learning feedback milestone based**

Replace the generic feedback shape in `modules/learning-feedback.md` with exactly three teacher-facing items at direction confirmation, backbone confirmation, literature-understanding completion, or session end:

```markdown
### 本阶段学习反馈

- 你已经想清楚的一个点：
- 当前最需要补强的一个点：
- 下一步最值得收集或阅读的材料：
```

- [ ] **Step 4: Add behavioral evaluation scenarios**

Create `maintenance/evals/coaching-interaction-scenarios.md` with six cases: first-use vague request, open pain-point description, incomprehensible direction names, direction switch without reason, request for a task bank before backbone confirmation, and target change from application to paper. For each case record expected user-facing action, disallowed behavior, expected dialogue-health intervention, and memory consequence.

- [ ] **Step 5: Extend the evaluation template**

Add fields to `maintenance/eval-case-template.md` for question type, visible next action, duplicate-confirmation check, artifact/backbone dependency, and assistant-created fatigue signals.

- [ ] **Step 6: Run the focused test and verify GREEN**

Run:

```bash
node --test skills/research-proposal-coach/tests/coaching-interaction-instructions.test.mjs
```

Expected: 7 tests pass, 0 fail.

- [ ] **Step 7: Commit the artifact and feedback changes**

```bash
git add skills/research-proposal-coach/templates/research-backbone-card.md \
  skills/research-proposal-coach/maintenance/evals/coaching-interaction-scenarios.md \
  skills/research-proposal-coach/modules/topic-discovery.md \
  skills/research-proposal-coach/modules/method-outcome-design.md \
  skills/research-proposal-coach/modules/learning-feedback.md \
  skills/research-proposal-coach/maintenance/eval-case-template.md
git commit -m "feat: add research backbone coaching gate"
```

### Task 4: Run regressions, validate the Skill, and deploy the updated copy

**Files:**
- Modify mechanically: `/Users/jhachr/.trae-cn/skills/research-proposal-coach/**`
- Modify mechanically: `skills/research-proposal-coach.zip`
- Verify: `skills/research-proposal-coach/**`

- [ ] **Step 1: Run the full Skill test suite**

Run:

```bash
node --test skills/research-proposal-coach/tests/*.test.mjs
```

Expected: all tests pass with 0 failures.

- [ ] **Step 2: Run syntax and whitespace checks**

Run:

```bash
git diff --check
node --check skills/research-proposal-coach/scripts/profile-store.mjs
node --check skills/research-proposal-coach/scripts/search-literature.mjs
node --check skills/research-proposal-coach/scripts/check-literature-run.mjs
```

Expected: all commands exit 0 with no syntax or whitespace errors.

- [ ] **Step 3: Run the Skill quick validator**

Run:

```bash
python3 /Users/jhachr/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/research-proposal-coach
```

Expected: the validator reports a valid Skill.

- [ ] **Step 4: Synchronize the installed Trae Skill**

Run:

```bash
rsync -a --delete --exclude '.DS_Store' \
  skills/research-proposal-coach/ \
  /Users/jhachr/.trae-cn/skills/research-proposal-coach/
diff -qr --exclude '.DS_Store' \
  skills/research-proposal-coach \
  /Users/jhachr/.trae-cn/skills/research-proposal-coach
```

Expected: `diff -qr` prints no differences.

- [ ] **Step 5: Rebuild the distributable archive**

Run:

```bash
rm -f /tmp/research-proposal-coach.zip
(cd skills && zip -qr /tmp/research-proposal-coach.zip research-proposal-coach -x '*/.DS_Store')
cp /tmp/research-proposal-coach.zip skills/research-proposal-coach.zip
unzip -t skills/research-proposal-coach.zip
```

Expected: archive test reports no errors.

- [ ] **Step 6: Run final tests against the installed copy**

Run:

```bash
(cd /Users/jhachr/.trae-cn/skills/research-proposal-coach && node --test tests/*.test.mjs)
```

Expected: all installed-copy tests pass with 0 failures.

- [ ] **Step 7: Review the final diff and commit source changes**

Run:

```bash
git status --short
git diff --stat HEAD~2..HEAD
git diff -- skills/research-proposal-coach
```

Confirm that `.DS_Store` and the three user-generated Markdown artifacts remain untouched. Then commit only the rebuilt archive if it is not already included:

```bash
git add skills/research-proposal-coach.zip
git commit -m "build: package simplified research coaching skill"
```
