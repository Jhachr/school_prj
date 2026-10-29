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
  assert.match(entry, /只问一个[^\n]*路由问题/);
  assert.match(entry, /先临时聊/);
  assert.match(entry, /一次性收集/);
});

test('returning startup is conversational and reaches useful coaching after one route choice', async () => {
  const [entry, profile, policy, scenarios] = await Promise.all([
    read('modules/session-entry.md'),
    read('modules/teacher-profile.md'),
    read('rules/profile-memory-policy.md'),
    read('maintenance/evals/coaching-interaction-scenarios.md'),
  ]);
  assert.match(entry, /identity route is a privacy boundary, not a system-status report/i);
  assert.match(entry, /use at most one relevant historical clue/i);
  assert.match(entry, /Do not list all profile fields/i);
  assert.match(entry, /Do not require a standalone profile-summary confirmation/i);
  assert.match(profile, /Do not turn profile review into a mandatory form/i);
  assert.match(policy, /Do not make the teacher approve a complete history summary/i);
  assert.match(scenarios, /Returning Teacher Gets A Conversational First Turn/);
  assert.match(scenarios, /Identity Choice Leads Directly To Useful Coaching/);
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

test('cards are working snapshots rather than consecutive approval checkpoints', async () => {
  const [skill, stage, guidance, method, template, health, scenarios] = await Promise.all([
    read('SKILL.md'),
    read('rules/stage-contract.md'),
    read('rules/guidance-principles.md'),
    read('modules/method-outcome-design.md'),
    read('templates/research-backbone-card.md'),
    read('rules/dialogue-health.md'),
    read('maintenance/evals/coaching-interaction-scenarios.md'),
  ]);
  assert.match(skill, /working snapshot[^\n]*not a teacher approval checkpoint/i);
  assert.match(stage, /工作快照[^\n]*不是[^\n]*审批/);
  assert.match(stage, /decision delta/i);
  assert.match(guidance, /Cards organize state[^\n]*do not create a new action/i);
  assert.match(method, /Do not ask the teacher to confirm the whole card/i);
  assert.doesNotMatch(method, /confirm the whole card once/i);
  assert.match(template, /不要求老师再确认整张卡/);
  assert.match(health, /card_confirmation_cascade/);
  assert.match(scenarios, /Direction Choice Does Not Trigger Card Approval/);
});

test('large artifacts require backbone completeness and full instruments require evidence and design', async () => {
  const [skill, method, template] = await Promise.all([
    read('SKILL.md'),
    read('modules/method-outcome-design.md'),
    read('templates/research-backbone-card.md'),
  ]);
  assert.match(skill, /研究骨架[^\n]*大型产物/);
  assert.match(method, /研究骨架/);
  assert.match(method, /validity-critical fields are teacher-owned/);
  assert.match(method, /Full Research Instrument Gate/);
  assert.match(method, /evidence_and_design/);
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

test('internal quality and source codes are translated for ordinary teacher replies', async () => {
  const [quality, source, report, memory] = await Promise.all([
    read('rules/quality-rubric.md'),
    read('rules/source-policy.md'),
    read('templates/quality-report.md'),
    read('rules/profile-memory-policy.md'),
  ]);
  for (const label of ['继续梳理', '可形成阶段材料', '可形成目标结构稿']) {
    assert.match(quality, new RegExp(label));
  }
  assert.match(source, /教师可见[^\n]*自然语言/);
  assert.match(report, /教师可见状态/);
  assert.match(memory, /普通辅导[^\n]*(不显示|隐藏)[^\n]*内部代码/);
});

test('guidance selects one lightweight coaching action from the current situation', async () => {
  const guidance = await read('rules/guidance-principles.md');
  for (const situation of [
    '表达抽象',
    '不理解术语',
    '不知道如何组织',
    '逻辑、证据或可行性漏洞',
    '卡住或无法选择',
    '已经选择、纠正、改写或说明理由',
    '确认疲劳或问题疲劳',
  ]) {
    assert.match(guidance, new RegExp(situation));
  }
  assert.match(guidance, /每轮[^\n]*一种[^\n]*动作/);
  assert.match(guidance, /优先[^\n]*(方向|方法|证据|成果)/);
});

test('the skill stops low-value questioning and may proceed without a new question', async () => {
  const [skill, guidance, health] = await Promise.all([
    read('SKILL.md'),
    read('rules/guidance-principles.md'),
    read('rules/dialogue-health.md'),
  ]);
  assert.match(skill, /停止条件[^\n]*不[^\n]*追加问题/);
  assert.match(guidance, /不会改变[^\n]*(方向|方法|证据|成果|结论边界)/);
  assert.match(guidance, /待补充清单/);
  assert.match(health, /低价值细节追问/);
  assert.match(health, /已足够但仍追问/);
  assert.match(health, /可以不包含新问题/);
});
