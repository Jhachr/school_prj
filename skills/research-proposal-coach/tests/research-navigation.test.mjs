import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return readFile(join(skillRoot, relativePath), 'utf8');
}

function tableBelow(markdown, heading) {
  const lines = markdown.split('\n');
  const start = lines.indexOf(heading);
  assert.notEqual(start, -1, 'missing heading: ' + heading);
  const table = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line.startsWith('## ')) break;
    if (!line.startsWith('|')) continue;
    const cells = line.slice(1, -1).split('|').map((cell) => cell.trim());
    if (cells.every((cell) => /^-+$/.test(cell))) continue;
    table.push(cells);
  }
  return table;
}

test('one canonical research flow has five ordered phases with explicit exit criteria', async () => {
  const stage = await read('rules/stage-contract.md');
  const rows = tableBelow(stage, '## Canonical Main Flow');
  assert.deepEqual(rows[0], ['Phase ID', 'Teacher-Facing Phase', 'Decision To Complete', 'Exit Criteria', 'Normal Output']);
  const phases = rows.slice(1);
  assert.deepEqual(
    phases.map(([id]) => id.replaceAll('`', '')),
    ['real_problem', 'research_focus', 'evidence_and_design', 'prototype_and_validation', 'delivery_and_action'],
  );
  assert.equal(new Set(phases.map(([id]) => id)).size, 5);
  for (const row of phases) {
    assert.equal(row.length, 5);
    assert.ok(row[2].length > 10, row[0] + ' needs a substantive decision');
    assert.ok(row[3].length > 10, row[0] + ' needs an explicit exit criterion');
  }
});

test('navigation state preserves a resume point and separates support systems from phases', async () => {
  const stage = await read('rules/stage-contract.md');
  const match = stage.match(/## Navigation State[\s\S]*?```json\n([\s\S]*?)\n```/);
  assert.ok(match, 'navigation state JSON is missing');
  const navigation = JSON.parse(match[1]);
  assert.deepEqual(Object.keys(navigation), [
    'current_phase',
    'current_goal',
    'phase_objective',
    'completed_decisions',
    'open_blocker',
    'next_action',
    'resume_phase',
    'side_threads',
  ]);
  assert.equal(navigation.current_phase, 'real_problem');
  assert.equal(navigation.resume_phase, null);

  const supportRows = tableBelow(stage, '## Support Systems Outside Main Flow').slice(1);
  const supportNames = supportRows.map(([name]) => name.replaceAll('`', ''));
  for (const expected of ['identity_and_memory', 'literature_retrieval', 'artifact_io', 'quality_and_health']) {
    assert.ok(supportNames.includes(expected));
  }
});

test('prototype validation is conditional instead of mandatory ceremony', async () => {
  const stage = await read('rules/stage-contract.md');
  assert.match(stage, /`prototype_and_validation` is conditional/);
  assert.match(stage, /existing data or materials[\s\S]*`not_applicable`/);
  assert.match(stage, /Do not manufacture a prototype/);
});

test('goal-specific controls do not make every study an application project', async () => {
  const [collaboration, missing, report] = await Promise.all([
    read('rules/human-ai-collaboration.md'),
    read('templates/missing-items.md'),
    read('templates/quality-report.md'),
  ]);
  assert.match(collaboration, /teaching, paper, or application structure/);
  assert.match(missing, /Add goal-specific items only when that goal is active/);
  assert.match(report, /Mark them `not_applicable` for other goals/);
});

test('side questions do not silently replace the main phase', async () => {
  const stage = await read('rules/stage-contract.md');
  assert.match(stage, /旁支问题[\s\S]*resume_phase/);
  assert.match(stage, /不得[^\n]*改变 `current_phase`/);
  assert.match(stage, /回答[^\n]*旁支[\s\S]*恢复主线/);
});

test('ambiguous continuation cannot satisfy an unresolved critical fact', async () => {
  const [stage, guidance] = await Promise.all([
    read('rules/stage-contract.md'),
    read('rules/guidance-principles.md'),
  ]);
  assert.match(stage, /“按这个方案来”[^\n]*(不能|不得)[^\n]*(缺失|未回答|关键事实)/);
  assert.match(guidance, /指代清晰|目标明确/);
});

test('a full research instrument has a stronger gate than a discussion sample', async () => {
  const method = await read('modules/method-outcome-design.md');
  for (const requirement of ['核心研究问题', '主要评价指标', '比较或实施方式', '数据或资源条件']) {
    assert.match(method, new RegExp(requirement));
  }
  assert.match(method, /小样[^\n]*(完整|正式)/);
});

test('temporary mode distinguishes durable memory from working artifacts', async () => {
  const entry = await read('modules/session-entry.md');
  assert.match(entry, /临时会话[\s\S]*长期记忆/);
  assert.match(entry, /工作产物|检索记录/);
  assert.match(entry, /写入[^\n]*(项目|工作目录)/);
});
