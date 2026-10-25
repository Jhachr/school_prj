import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { withResearchCoachHome } from './helpers/temp-home.mjs';

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = join(skillRoot, 'scripts', 'profile-store.mjs');

test('profile CLI supports the complete consent and control lifecycle', async () => {
  await withResearchCoachHome(async ({ root, env }) => {
    const firstStatus = await runCli(['status'], null, env);
    assert.equal(firstStatus.stdout.status, 'missing');

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
    const initialized = await runCli(
      ['init'],
      { session_mode: 'teacher', profile },
      env,
    );
    assert.equal(initialized.code, 0);

    const returningStatus = await runCli(['status'], null, env);
    assert.equal(returningStatus.stdout.status, 'ready');
    assert.equal(returningStatus.stdout.profile.display_name, '李老师');

    const committed = await runCli(
      ['commit'],
      {
        session_mode: 'teacher',
        confirmation: 'user_confirmed',
        profile_updates: [{ field: 'course_or_work_scene', value: '跨境电商课程' }],
        items: [
          {
            memory_id: 'R001',
            category: 'research_history',
            content: '主持过校级教改项目',
            artifact: '教改项目申报书',
          },
        ],
      },
      env,
    );
    assert.equal(committed.code, 0);
    assert.deepEqual(committed.stdout.updated_fields, ['course_or_work_scene']);
    const profileDocument = await readFile(join(root, 'teacher-profile.md'), 'utf8');
    assert.match(profileDocument, /跨境电商课程/);
    assert.match(profileDocument, /市场营销课程.*superseded（已被新信息替代）/);

    const rejectedTemporaryWrite = await runCli(
      ['commit'],
      {
        session_mode: 'temporary',
        confirmation: 'user_confirmed',
        items: [
          {
            memory_id: 'R002',
            category: 'research_history',
            content: '本次临时分享',
            artifact: '',
          },
        ],
      },
      env,
    );
    assert.notEqual(rejectedTemporaryWrite.code, 0);
    assert.match(rejectedTemporaryWrite.stderr, /temporary session cannot write durable memory/);

    const exportDir = join(root, 'profile-export');
    const exported = await runCli(['export', '--output', exportDir], null, env);
    assert.equal(exported.code, 0);
    await access(join(exportDir, 'teacher-profile.md'));
    await access(join(exportDir, 'memories', 'research-history.md'));

    const forgotten = await runCli(
      ['forget'],
      { session_mode: 'teacher', ids: ['R001'] },
      env,
    );
    assert.deepEqual(forgotten.stdout.removed_ids, ['R001']);
    assert.doesNotMatch(
      await readFile(join(root, 'memories', 'research-history.md'), 'utf8'),
      /R001/,
    );

    const purged = await runCli(['purge', '--confirm', 'local-teacher'], null, env);
    assert.equal(purged.code, 0);
    assert.equal(purged.stdout.status, 'purged');
    assert.equal((await runCli(['status'], null, env)).stdout.status, 'missing');
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
