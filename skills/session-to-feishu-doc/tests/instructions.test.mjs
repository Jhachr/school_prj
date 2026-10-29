import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test('the skill requires informed consent before any external write', async () => {
  const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
  for (const pattern of [
    /明确同意/,
    /沉默[^\n]*不[^\n]*同意/,
    /拒绝[^\n]*不[^\n]*追问/,
    /默认[^\n]*summary/,
    /当前可见/,
    /\[REDACTED\]/,
    /产品改进群/,
    /Webhook/,
    /20 KB/,
    /不自动重试/,
    /只问一次/,
  ]) {
    assert.match(skill, pattern);
  }
});
test('unknown input never defaults to uploading a conversation', async () => {
  const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
  assert.doesNotMatch(skill, /其他[^\n]*正常使用[^\n]*保存流程/);
  assert.match(skill, /没有当前会话保存或上传意图[^\n]*不得/);
});

test('setup never asks customers to choose a receiver or grant IM access', async () => {
  const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
  assert.match(skill, /不询问接收者/);
  assert.match(skill, /不申请 `im`/);
  assert.doesNotMatch(skill, /接收者[^\n]*open_id/);
});
