import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import {
  commitMemories,
  createProfile,
  exportProfile,
  forgetMemories,
  initializeStore,
  purgeProfile,
  readProfile,
} from '../scripts/lib/profile-store.mjs';
import { withResearchCoachHome } from './helpers/temp-home.mjs';

const TODAY = '2026-10-25';
const NOW = '2026-10-25T08:00:00.000Z';

const CONFIRMED_PROFILE = {
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

test('createProfile requires teacher mode, consent, and every minimum field', async () => {
  await withResearchCoachHome(async ({ root }) => {
    await assert.rejects(
      createProfile({ root, sessionMode: 'temporary', profile: CONFIRMED_PROFILE, today: TODAY }),
      /temporary session cannot write durable memory/,
    );
    await assert.rejects(
      createProfile({
        root,
        sessionMode: 'teacher',
        profile: { ...CONFIRMED_PROFILE, memory_consent: false },
        today: TODAY,
      }),
      /memory consent/,
    );
    const incomplete = structuredClone(CONFIRMED_PROFILE);
    delete incomplete.fields.course_or_work_scene;
    await assert.rejects(
      createProfile({ root, sessionMode: 'teacher', profile: incomplete, today: TODAY }),
      /course_or_work_scene/,
    );
  });
});

test('createProfile writes a readable confirmed profile only after validation', async () => {
  await withResearchCoachHome(async ({ root }) => {
    const created = await createProfile({
      root,
      sessionMode: 'teacher',
      profile: CONFIRMED_PROFILE,
      today: TODAY,
    });

    assert.equal(created.status, 'created');
    const result = await readProfile({ root });
    assert.equal(result.status, 'ready');
    assert.equal(result.profile.display_name, '李老师');
    assert.match(await readFile(created.path, 'utf8'), /user_confirmed（本次已确认）/);
  });
});

test('commitMemories requires an explicit current-session confirmation', async () => {
  await withResearchCoachHome(async ({ root }) => {
    await createProfile({ root, sessionMode: 'teacher', profile: CONFIRMED_PROFILE, today: TODAY });
    const item = {
      memory_id: 'R001',
      category: 'research_history',
      content: '主持过校级教改项目',
      artifact: '校级教改项目申报书',
    };

    await assert.rejects(
      commitMemories({ root, sessionMode: 'teacher', confirmation: 'suggested_from_history', items: [item], now: NOW }),
      /user_confirmed/,
    );
    await assert.rejects(
      commitMemories({ root, sessionMode: 'temporary', confirmation: 'user_confirmed', items: [item], now: NOW }),
      /temporary session cannot write durable memory/,
    );

    const result = await commitMemories({
      root,
      sessionMode: 'teacher',
      confirmation: 'user_confirmed',
      items: [item],
      now: NOW,
    });
    assert.deepEqual(result.written_ids, ['R001']);
    assert.match(
      await readFile(join(root, 'memories', 'research-history.md'), 'utf8'),
      /R001.*主持过校级教改项目.*user_confirmed（本次已确认）/,
    );
  });
});

test('profile correction preserves the old value as superseded history', async () => {
  await withResearchCoachHome(async ({ root }) => {
    await createProfile({ root, sessionMode: 'teacher', profile: CONFIRMED_PROFILE, today: TODAY });

    await commitMemories({
      root,
      sessionMode: 'teacher',
      confirmation: 'user_confirmed',
      items: [],
      profile_updates: [{ field: 'course_or_work_scene', value: '跨境电商课程' }],
      now: NOW,
    });

    const document = await readFile(join(root, 'teacher-profile.md'), 'utf8');
    assert.match(document, /课程或工作场景 \| 跨境电商课程/);
    assert.match(document, /市场营销课程.*superseded（已被新信息替代）.*2026-10-25/);
  });
});

test('exportProfile copies durable profile and memories but excludes sessions', async () => {
  await withResearchCoachHome(async ({ root }) => {
    await createProfile({ root, sessionMode: 'teacher', profile: CONFIRMED_PROFILE, today: TODAY });
    await writeFile(join(root, 'sessions', 'private-working-note.md'), 'do not export', 'utf8');
    const output = join(root, 'outside-export-target');

    const result = await exportProfile({ root, outputDir: output, now: NOW });

    assert.equal(result.status, 'exported');
    assert.deepEqual((await readdir(output)).sort(), ['export-manifest.json', 'memories', 'teacher-profile.md']);
    await assert.rejects(access(join(output, 'sessions')));
    const manifest = JSON.parse(await readFile(join(output, 'export-manifest.json'), 'utf8'));
    assert.equal(manifest.schema_version, 1);
    assert.equal(manifest.exported_at, NOW);
  });
});

test('forgetMemories removes exact IDs, writes tombstones, and blocks stale re-adds', async () => {
  await withResearchCoachHome(async ({ root }) => {
    await createProfile({ root, sessionMode: 'teacher', profile: CONFIRMED_PROFILE, today: TODAY });
    const items = [
      { memory_id: 'R001', category: 'research_history', content: '旧项目', artifact: '' },
      { memory_id: 'R002', category: 'research_history', content: '保留项目', artifact: '' },
    ];
    await commitMemories({
      root,
      sessionMode: 'teacher',
      confirmation: 'user_confirmed',
      items,
      now: NOW,
    });

    const forgotten = await forgetMemories({
      root,
      sessionMode: 'teacher',
      ids: ['R001'],
      now: NOW,
    });

    assert.deepEqual(forgotten.removed_ids, ['R001']);
    const history = await readFile(join(root, 'memories', 'research-history.md'), 'utf8');
    assert.doesNotMatch(history, /R001/);
    assert.match(history, /R002/);
    assert.match(await readFile(join(root, 'config', 'memory-tombstones.jsonl'), 'utf8'), /R001/);
    await assert.rejects(
      commitMemories({
        root,
        sessionMode: 'teacher',
        confirmation: 'user_confirmed',
        items: [items[0]],
        now: NOW,
      }),
      /tombstoned memory id R001/,
    );
  });
});

test('purgeProfile requires the exact profile ID and removes personal data', async () => {
  await withResearchCoachHome(async ({ root }) => {
    await createProfile({ root, sessionMode: 'teacher', profile: CONFIRMED_PROFILE, today: TODAY });

    await assert.rejects(
      purgeProfile({ root, confirmationProfileId: 'wrong-teacher' }),
      /confirmation does not match/,
    );

    const result = await purgeProfile({ root, confirmationProfileId: 'local-teacher' });
    assert.equal(result.status, 'purged');
    assert.equal((await readProfile({ root })).status, 'missing');
    assert.deepEqual((await readdir(join(root, 'memories'))).sort(), [
      'learning-feedback.md',
      'preferences.md',
      'research-history.md',
    ]);
  });
});

test('mutations preserve a malformed profile and create a diagnostic backup', async () => {
  await withResearchCoachHome(async ({ root }) => {
    const store = await initializeStore({ root });
    const malformed = '---\nprofile_id: local-teacher\n# missing delimiter\n';
    await writeFile(store.paths.profile, malformed, 'utf8');

    await assert.rejects(
      commitMemories({
        root,
        sessionMode: 'teacher',
        confirmation: 'user_confirmed',
        items: [],
        profile_updates: [{ field: 'course_or_work_scene', value: '跨境电商课程' }],
        now: NOW,
      }),
      /read-only/,
    );

    assert.equal(await readFile(store.paths.profile, 'utf8'), malformed);
    const diagnostics = await readdir(join(root, 'config', 'diagnostics'));
    assert.equal(diagnostics.length, 1);
    assert.match(diagnostics[0], /teacher-profile\.md$/);
  });
});
