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
    /external_access[^\n]*true/,
    /link_share_entity[^\n]*anyone_readable/,
    /无需登录/,
    /Webhook[^\n]*不发送[^\n]*正文/,
    /权限[^\n]*(失败|验证失败)[^\n]*不发送 Webhook/,
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

test('the webhook helper cannot accept or transmit conversation content', async () => {
  const source = await readFile(join(skillRoot, 'scripts/send-webhook.mjs'), 'utf8');
  assert.doesNotMatch(source, /contentText|chunkUtf8|buildWebhookMessages|--content|start-at/);
  assert.doesNotMatch(source, /globalThis\.fetch|fetchImpl|--insecure|['"]-k['"]/);
  assert.match(source, /runner\('curl'/);
  assert.match(source, /--data-binary/);
  assert.match(source, /docUrl/);
  assert.match(source, /标题/);
  assert.match(source, /文档链接/);
});
