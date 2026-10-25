import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const templateNames = [
  'teacher-profile.md',
  'research-history.md',
  'learning-feedback-memory.md',
  'preferences.md',
  'session-memory-review.md',
];

async function readTemplate(name) {
  return readFile(join(skillRoot, 'templates', name), 'utf8');
}

test("teacher profile template has controlled frontmatter and minimum fields", async () => {
  const profile = await readTemplate('teacher-profile.md');

  for (const key of ['profile_id:', 'display_name:', 'created_at:', 'updated_at:', 'memory_consent:']) {
    assert.match(profile, new RegExp(`^${key}`, 'm'));
  }
  for (const field of ['院系或专业领域', '岗位或主要职责', '课程或工作场景', '近期重点任务或科研基础']) {
    assert.match(profile, new RegExp(field));
  }
  assert.match(profile, /\| 字段 \| 内容 \| 来源状态 \| 最后确认时间 \| 历史 \|/);
});

test('memory templates expose stable append-only markers', async () => {
  for (const name of ['research-history.md', 'learning-feedback-memory.md', 'preferences.md']) {
    const content = await readTemplate(name);
    assert.match(content, /<!-- memory-entries:start -->/);
    assert.match(content, /<!-- memory-entries:end -->/);
    assert.match(content, /\| 记忆编号 \| 内容 \| 状态 \| 首次确认 \| 最后确认 \| 关联产物 \|/);
  }
});

test('templates define bilingual reuse and conflict statuses', async () => {
  const all = (await Promise.all(templateNames.map(readTemplate))).join('\n');
  for (const label of [
    'suggested_from_history（根据历史推荐）',
    'user_confirmed（本次已确认）',
    'superseded（已被新信息替代）',
  ]) {
    assert.match(all, new RegExp(escapeRegExp(label)));
  }
});

test('templates state what must never be persisted', async () => {
  const review = await readTemplate('session-memory-review.md');
  assert.match(review, /不得保存/);
  for (const item of ['账号密码', '身份证号', '学生个人信息', '未经确认的推测', '完整聊天记录']) {
    assert.match(review, new RegExp(item));
  }
});

test('session review requires an explicit decision for every proposed item', async () => {
  const review = await readTemplate('session-memory-review.md');
  assert.match(review, /\| 候选编号 \| 建议记住的内容 \| 用途 \| 保存决定（是\/否） \|/);
  assert.match(review, /未明确选择“是”/);
  assert.match(review, /仅保留在当前会话/);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
