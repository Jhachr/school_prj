import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { withResearchCoachHome } from './helpers/temp-home.mjs';

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = join(skillRoot, 'scripts', 'profile-store.mjs');
const profile = {
  profile_id: 'local-teacher',
  display_name: '李老师',
  memory_consent: true,
  fields: {
    department_or_field: '商学院',
    role_or_responsibility: '专任教师',
    course_or_work_scene: '市场营销课程',
    recent_focus_or_research_basis: '校级教改项目',
  },
};

test('status reports a missing profile as JSON', async () => {
  await withResearchCoachHome(async ({ env }) => {
    const result = await runCli(['status'], null, env);
    assert.equal(result.code, 0);
    assert.equal(result.stdout.status, 'missing');
    assert.equal(result.stderr, '');
  });
});

test('init creates a confirmed profile from stdin JSON', async () => {
  await withResearchCoachHome(async ({ root, env }) => {
    const result = await runCli(['init'], { session_mode: 'teacher', profile }, env);
    assert.equal(result.code, 0);
    assert.equal(result.stdout.status, 'created');
    assert.match(await readFile(join(root, 'teacher-profile.md'), 'utf8'), /李老师/);
  });
});

test('commit and forget mutate only explicitly confirmed memory IDs', async () => {
  await withResearchCoachHome(async ({ root, env }) => {
    await runCli(['init'], { session_mode: 'teacher', profile }, env);
    const committed = await runCli(
      ['commit'],
      {
        session_mode: 'teacher',
        confirmation: 'user_confirmed',
        items: [{ memory_id: 'R001', category: 'research_history', content: '主持教改项目', artifact: '' }],
      },
      env,
    );
    assert.equal(committed.code, 0);
    assert.deepEqual(committed.stdout.written_ids, ['R001']);

    const forgotten = await runCli(
      ['forget'],
      { session_mode: 'teacher', ids: ['R001'] },
      env,
    );
    assert.equal(forgotten.code, 0);
    assert.deepEqual(forgotten.stdout.removed_ids, ['R001']);
    assert.doesNotMatch(await readFile(join(root, 'memories', 'research-history.md'), 'utf8'), /R001/);
  });
});

test('export writes durable data to the requested directory', async () => {
  await withResearchCoachHome(async ({ root, env }) => {
    await runCli(['init'], { session_mode: 'teacher', profile }, env);
    const target = join(root, 'exported-profile');

    const result = await runCli(['export', '--output', target], null, env);

    assert.equal(result.code, 0);
    assert.equal(result.stdout.status, 'exported');
    await access(join(target, 'export-manifest.json'));
  });
});

test('purge rejects the wrong confirmation and accepts the exact profile ID', async () => {
  await withResearchCoachHome(async ({ env }) => {
    await runCli(['init'], { session_mode: 'teacher', profile }, env);

    const rejected = await runCli(['purge', '--confirm', 'wrong-teacher'], null, env);
    assert.notEqual(rejected.code, 0);
    assert.match(rejected.stderr, /confirmation does not match/);

    const purged = await runCli(['purge', '--confirm', 'local-teacher'], null, env);
    assert.equal(purged.code, 0);
    assert.equal(purged.stdout.status, 'purged');
  });
});

test('temporary session mutations fail without claiming success', async () => {
  await withResearchCoachHome(async ({ env }) => {
    const result = await runCli(
      ['init'],
      { session_mode: 'temporary', profile },
      env,
    );
    assert.notEqual(result.code, 0);
    assert.equal(result.stdout, null);
    assert.match(result.stderr, /temporary session cannot write durable memory/);
  });
});

function runCli(args, input, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({
        code,
        stdout: stdout.trim() ? JSON.parse(stdout) : null,
        stderr: stderr.trim(),
      });
    });
    child.stdin.end(input === null ? '' : JSON.stringify(input));
  });
}
