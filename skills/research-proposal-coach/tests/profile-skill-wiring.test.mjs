import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test('Skill performs identity routing before ordinary coaching modules', async () => {
  const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
  const sessionEntry = skill.indexOf('modules/session-entry.md');
  const memoryPolicy = skill.indexOf('rules/profile-memory-policy.md');
  const teacherProfile = skill.indexOf('modules/teacher-profile.md');

  assert.ok(sessionEntry >= 0, 'session entry module must be referenced');
  assert.ok(memoryPolicy >= 0, 'profile memory policy must be referenced');
  assert.ok(teacherProfile >= 0, 'teacher profile module must remain referenced');
  assert.ok(sessionEntry < teacherProfile, 'identity route must precede ordinary coaching');
  assert.ok(memoryPolicy < teacherProfile, 'memory boundaries must precede ordinary coaching');
});

test('Skill startup uses status, routes identity, and defers durable writes', async () => {
  const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
  for (const step of [
    'profile-store.mjs status',
    'identity',
    'memory candidates',
    'profile-store.mjs commit',
  ]) {
    assert.match(skill, new RegExp(escapeRegExp(step), 'i'));
  }
  assert.match(skill, /temporary[^\n]*(do not|never)[^\n]*(read|write)/i);
  assert.match(skill, /full chat[^\n]*(not|never)[^\n]*memory/i);
  assert.match(skill, /CLI[^\n]*success[^\n]*(only|before)/i);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
