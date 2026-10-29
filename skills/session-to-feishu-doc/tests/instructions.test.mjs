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
    /创建文档[\s\S]*授予[\s\S]*通知/,
    /授权失败[^\n]*不[^\n]*通知/,
    /SESSION_TO_FEISHU_HOME/,
  ]) {
    assert.match(skill, pattern);
  }
});
test('unknown input never defaults to uploading a conversation', async () => {
  const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
  assert.doesNotMatch(skill, /其他[^\n]*正常使用[^\n]*保存流程/);
  assert.match(skill, /没有明确上传意图[^\n]*不得/);
});
