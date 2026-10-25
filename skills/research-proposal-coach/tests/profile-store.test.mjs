import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import test from 'node:test';

import {
  initializeStore,
  readProfile,
  resolveResearchCoachHome,
} from '../scripts/lib/profile-store.mjs';
import { withResearchCoachHome } from './helpers/temp-home.mjs';

const VALID_PROFILE = `---
profile_id: local-teacher
display_name: 李老师
created_at: 2026-10-25
updated_at: 2026-10-25
memory_consent: true
---

# 教师画像

| 字段 | 内容 | 来源状态 | 最后确认时间 | 历史 |
|---|---|---|---|---|
| 院系或专业领域 | 商学院 | user_confirmed（本次已确认） | 2026-10-25 |  |
`;

test('RESEARCH_COACH_HOME overrides the platform default', () => {
  assert.equal(
    resolveResearchCoachHome({ RESEARCH_COACH_HOME: '/tmp/example' }),
    resolve('/tmp/example'),
  );
});

test('default home is a hidden research coach directory', () => {
  assert.match(resolveResearchCoachHome({}), /\.research-proposal-coach$/);
});

test('initializeStore creates the durable layout without a profile', async () => {
  await withResearchCoachHome(async ({ root }) => {
    const result = await initializeStore({ root });

    assert.equal(result.initialized, true);
    assert.deepEqual((await readdir(root)).sort(), [
      'artifacts',
      'config',
      'literature',
      'memories',
      'sessions',
    ]);
    await assert.rejects(access(result.paths.profile));
  });
});

test('initializeStore creates the three durable memory files', async () => {
  await withResearchCoachHome(async ({ root }) => {
    const result = await initializeStore({ root });

    assert.deepEqual((await readdir(result.paths.memories)).sort(), [
      'learning-feedback.md',
      'preferences.md',
      'research-history.md',
    ]);
  });
});

test('initializeStore is idempotent and keeps existing memory content', async () => {
  await withResearchCoachHome(async ({ root }) => {
    const first = await initializeStore({ root });
    const historyPath = resolve(first.paths.memories, 'research-history.md');
    await writeFile(historyPath, '# 用户已有内容\n', 'utf8');

    const second = await initializeStore({ root });

    assert.equal(second.initialized, true);
    assert.equal(second.root, first.root);
    assert.equal(await readFile(historyPath, 'utf8'), '# 用户已有内容\n');
  });
});

test('all initialized paths remain descendants of the resolved root', async () => {
  await withResearchCoachHome(async ({ root }) => {
    const result = await initializeStore({ root });
    const rootPrefix = `${resolve(root)}${sep}`;

    for (const path of Object.values(result.paths)) {
      assert.ok(resolve(path).startsWith(rootPrefix), `${path} must remain inside ${root}`);
    }
  });
});

test('readProfile reports a missing profile without diagnostics', async () => {
  await withResearchCoachHome(async ({ root }) => {
    await initializeStore({ root });

    const result = await readProfile({ root });

    assert.equal(result.status, 'missing');
    assert.equal(result.profile, null);
    assert.deepEqual(result.diagnostics, []);
  });
});

test('readProfile parses the controlled frontmatter for a Chinese profile', async () => {
  await withResearchCoachHome(async ({ root }) => {
    const store = await initializeStore({ root });
    await writeFile(store.paths.profile, VALID_PROFILE, 'utf8');

    const result = await readProfile({ root });

    assert.equal(result.status, 'ready');
    assert.deepEqual(result.profile, {
      profile_id: 'local-teacher',
      display_name: '李老师',
      created_at: '2026-10-25',
      updated_at: '2026-10-25',
      memory_consent: true,
    });
  });
});

for (const [name, content, message] of [
  ['missing closing delimiter', VALID_PROFILE.replace('\n---\n\n# 教师画像', '\n# 教师画像'), 'closing delimiter'],
  ['duplicate key', VALID_PROFILE.replace('display_name: 李老师', 'display_name: 李老师\ndisplay_name: 王老师'), 'duplicate key'],
  ['unsupported key', VALID_PROFILE.replace('display_name: 李老师', 'display_name: 李老师\nworkspace: demo'), 'unsupported key'],
  ['invalid date', VALID_PROFILE.replace('updated_at: 2026-10-25', 'updated_at: yesterday'), 'updated_at'],
]) {
  test(`readProfile preserves malformed input: ${name}`, async () => {
    await withResearchCoachHome(async ({ root }) => {
      const store = await initializeStore({ root });
      await writeFile(store.paths.profile, content, 'utf8');

      const result = await readProfile({ root });

      assert.equal(result.status, 'malformed');
      assert.equal(result.profile, null);
      assert.match(result.diagnostics.join('\n'), new RegExp(message, 'i'));
      assert.equal(await readFile(store.paths.profile, 'utf8'), content);
    });
  });
}
