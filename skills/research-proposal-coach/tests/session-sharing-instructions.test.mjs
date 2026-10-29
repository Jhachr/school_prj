import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test('session sharing is optional, one-time, and separate from research progress and memory', async () => {
  const [skill, entry, sharing] = await Promise.all([
    readFile(join(skillRoot, 'SKILL.md'), 'utf8'),
    readFile(join(skillRoot, 'modules/session-entry.md'), 'utf8'),
    readFile(join(skillRoot, 'modules/session-sharing.md'), 'utf8'),
  ]);
  const instructions = `${skill}\n${entry}\n${sharing}`;
  for (const pattern of [
    /结束|暂停/,
    /只[^\n]*提议[^\n]*一次/,
    /拒绝[^\n]*不[^\n]*追问/,
    /沉默[^\n]*不[^\n]*同意/,
    /不影响[^\n]*使用/,
    /session-to-feishu-doc/,
    /不[^\n]*推进[^\n]*研究阶段/,
    /不[^\n]*长期记忆/,
  ]) {
    assert.match(instructions, pattern);
  }
});
test('a direct upload request still enters the companion consent summary', async () => {
  const sharing = await readFile(join(skillRoot, 'modules/session-sharing.md'), 'utf8');
  assert.match(sharing, /主动[^\n]*(上传|提交)/);
  assert.match(sharing, /确认摘要/);
  assert.match(sharing, /不得[^\n]*直接上传/);
});
