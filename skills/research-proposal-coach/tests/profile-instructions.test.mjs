import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return readFile(join(skillRoot, relativePath), 'utf8');
}

test('session entry defines first-use, returning, temporary, and malformed routes', async () => {
  const entry = await read('modules/session-entry.md');

  for (const required of [
    'profile missing',
    'profile ready',
    'profile malformed',
    '是否以 X 老师身份继续',
    'temporary（临时会话）',
    'memory_consent',
    '只读模式',
  ]) {
    assert.match(entry, new RegExp(escapeRegExp(required), 'i'));
  }
});

test('temporary route prohibits profile reads and durable writes after routing', async () => {
  const entry = await read('modules/session-entry.md');
  assert.match(entry, /选择临时会话后[^\n]*(不读取|不得读取)[^\n]*(不写入|不得写入)/);
  assert.match(entry, /会话结束[^\n]*归档[^\n]*明确同意/);
  assert.match(entry, /同意归档[^\n]*(重新进入|切换到)[^\n]*教师身份/);
  assert.match(entry, /temporary[^\n]*(不得|不能)[^\n]*commit/i);
});

test('memory policy requires candidates, explicit confirmation, and user controls', async () => {
  const policy = await read('rules/profile-memory-policy.md');

  for (const phase of ['记忆候选', '逐条确认', 'user_confirmed（本次已确认）', '查看', '修改', '导出', '删除一条', '删除全部']) {
    assert.match(policy, new RegExp(escapeRegExp(phase)));
  }
  assert.match(policy, /未经[^\n]*确认[^\n]*(不得|不能)[^\n]*写入/);
  assert.match(policy, /完整聊天记录[^\n]*(不得|不能)[^\n]*保存/);
});

test('memory policy defines history reuse and conflict supersession', async () => {
  const policy = await read('rules/profile-memory-policy.md');
  assert.match(policy, /suggested_from_history（根据历史推荐）/);
  assert.match(policy, /user_confirmed（本次已确认）/);
  assert.match(policy, /superseded（已被新信息替代）/);
  assert.match(policy, /当前[^\n]*明确[^\n]*优先/);
  assert.match(policy, /下游[^\n]*(过期|失效)/);
});

test('teacher profile treats history as a proposal until current confirmation', async () => {
  const module = await read('modules/teacher-profile.md');
  assert.match(module, /suggested_from_history（根据历史推荐）/);
  assert.match(module, /user_confirmed（本次已确认）/);
  assert.match(module, /历史[^\n]*(不等于|不是)[^\n]*本次确认/);
});

test('session state stores one machine identity without workspace routing', async () => {
  const stage = await read('rules/stage-contract.md');
  for (const field of ['active_identity', 'session_mode', 'memory_consent', 'history_reuse', 'memory_candidates']) {
    assert.match(stage, new RegExp(`"${field}"`));
  }
  assert.doesNotMatch(stage, /workspace_identity|project_identity|topic_identity/);
});

test('teacher-facing statuses include a Chinese explanation and practical consequence', async () => {
  const policy = await read('rules/profile-memory-policy.md');
  assert.match(policy, /英文状态[^\n]*中文/);
  assert.match(policy, /(影响|意味着)[^\n]*(当前|本次)/);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
