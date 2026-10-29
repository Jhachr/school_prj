import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { access, chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const installer = join(projectRoot, 'scripts/install-research-proposal-coach.sh');

test('installer defaults to the public Gitee HTTPS repository', async () => {
  const source = await readFile(installer, 'utf8');
  assert.match(source, /https:\/\/gitee\.com\/jhachr\/school_prj\.git/);
  assert.match(source, /target="trae"/);
  assert.doesNotMatch(source, /github\.com/i);
  assert.doesNotMatch(source, /git@gitee\.com/);
});

async function fixtureRepository(root) {
  const repository = join(root, 'repo');
  for (const name of ['research-proposal-coach', 'session-to-feishu-doc']) {
    const skill = join(repository, 'skills', name);
    await mkdir(skill, { recursive: true });
    await writeFile(join(skill, 'SKILL.md'), `---\nname: ${name}\ndescription: Use when testing ${name}.\n---\n`, 'utf8');
  }
  execFileSync('git', ['init', '-b', 'main'], { cwd: repository, stdio: 'ignore' });
  execFileSync('git', ['add', '.'], { cwd: repository });
  execFileSync('git', [
    '-c', 'user.name=Installer Test',
    '-c', 'user.email=installer@example.invalid',
    'commit', '-m', 'fixture',
  ], { cwd: repository, stdio: 'ignore' });
  return repository;
}

test('default installation targets the TRAE CN global skill directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'trae-cn-default-install-'));
  try {
    const repository = await fixtureRepository(root);
    const result = spawnSync('sh', [
      installer,
      '--repo', repository,
      '--ref', 'main',
    ], {
      encoding: 'utf8',
      env: { ...process.env, HOME: root },
    });
    assert.equal(result.status, 0, result.stderr);
    await access(join(root, '.trae-cn', 'skills', 'research-proposal-coach', 'SKILL.md'));
    await access(join(root, '.trae-cn', 'skills', 'session-to-feishu-doc', 'SKILL.md'));
    await assert.rejects(access(join(root, '.codex', 'skills')));
    assert.match(result.stdout, /TRAE CN/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('one installer invocation installs both skills', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dual-skill-install-'));
  try {
    const repository = await fixtureRepository(root);
    const destination = join(root, 'installed');
    const result = spawnSync('sh', [
      installer,
      '--repo', repository,
      '--ref', 'main',
      '--dest', destination,
    ], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    await access(join(destination, 'research-proposal-coach', 'SKILL.md'));
    await access(join(destination, 'session-to-feishu-doc', 'SKILL.md'));
    assert.match(result.stdout, /Installed research-proposal-coach/);
    assert.match(result.stdout, /Installed session-to-feishu-doc/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('an existing destination rejects the whole install before copying', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dual-skill-install-'));
  try {
    const repository = await fixtureRepository(root);
    const destination = join(root, 'installed');
    const existing = join(destination, 'research-proposal-coach');
    await mkdir(existing, { recursive: true });
    await writeFile(join(existing, 'sentinel.txt'), 'keep', 'utf8');

    const result = spawnSync('sh', [
      installer,
      '--repo', repository,
      '--ref', 'main',
      '--dest', destination,
    ], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--upgrade/);
    assert.equal(await readFile(join(existing, 'sentinel.txt'), 'utf8'), 'keep');
    await assert.rejects(access(join(destination, 'session-to-feishu-doc')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('explicit upgrade replaces both valid installed skills without merging stale files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dual-skill-upgrade-'));
  try {
    const repository = await fixtureRepository(root);
    const destination = join(root, 'installed');
    for (const name of ['research-proposal-coach', 'session-to-feishu-doc']) {
      const installed = join(destination, name);
      await mkdir(installed, { recursive: true });
      await writeFile(
        join(installed, 'SKILL.md'),
        `---\nname: ${name}\ndescription: Old installed copy.\n---\n`,
        'utf8',
      );
      await writeFile(join(installed, 'stale.txt'), 'remove during upgrade', 'utf8');
    }

    const result = spawnSync('sh', [
      installer,
      '--repo', repository,
      '--ref', 'main',
      '--dest', destination,
      '--upgrade',
    ], { encoding: 'utf8' });

    assert.equal(result.status, 0, result.stderr);
    for (const name of ['research-proposal-coach', 'session-to-feishu-doc']) {
      const installed = join(destination, name);
      assert.match(await readFile(join(installed, 'SKILL.md'), 'utf8'), /Use when testing/);
      await assert.rejects(access(join(installed, 'stale.txt')));
      assert.match(result.stdout, new RegExp(`Updated ${name}`));
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('upgrade refuses an unrecognized destination before changing either skill', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dual-skill-upgrade-'));
  try {
    const repository = await fixtureRepository(root);
    const destination = join(root, 'installed');
    const valid = join(destination, 'research-proposal-coach');
    const unrecognized = join(destination, 'session-to-feishu-doc');
    await mkdir(valid, { recursive: true });
    await writeFile(
      join(valid, 'SKILL.md'),
      '---\nname: research-proposal-coach\ndescription: Keep this valid copy.\n---\n',
      'utf8',
    );
    await mkdir(unrecognized, { recursive: true });
    await writeFile(join(unrecognized, 'sentinel.txt'), 'keep', 'utf8');

    const result = spawnSync('sh', [
      installer,
      '--repo', repository,
      '--ref', 'main',
      '--dest', destination,
      '--upgrade',
    ], { encoding: 'utf8' });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unrecognized destination/);
    assert.match(await readFile(join(valid, 'SKILL.md'), 'utf8'), /Keep this valid copy/);
    assert.equal(await readFile(join(unrecognized, 'sentinel.txt'), 'utf8'), 'keep');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('upgrade refuses a skill directory whose declared name does not match its destination', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dual-skill-upgrade-'));
  try {
    const repository = await fixtureRepository(root);
    const destination = join(root, 'installed');
    for (const name of ['research-proposal-coach', 'session-to-feishu-doc']) {
      const installed = join(destination, name);
      await mkdir(installed, { recursive: true });
      await writeFile(
        join(installed, 'SKILL.md'),
        `---\nname: ${name}\ndescription: Keep this installed copy.\n---\n`,
        'utf8',
      );
    }
    await writeFile(
      join(destination, 'session-to-feishu-doc', 'SKILL.md'),
      '---\nname: another-skill\ndescription: Wrong directory.\n---\n',
      'utf8',
    );

    const result = spawnSync('sh', [
      installer,
      '--repo', repository,
      '--ref', 'main',
      '--dest', destination,
      '--upgrade',
    ], { encoding: 'utf8' });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unrecognized destination/);
    assert.match(
      await readFile(join(destination, 'research-proposal-coach', 'SKILL.md'), 'utf8'),
      /Keep this installed copy/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('an interrupted two-skill replacement restores both previous versions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dual-skill-rollback-'));
  try {
    const repository = await fixtureRepository(root);
    const destination = join(root, 'installed');
    for (const name of ['research-proposal-coach', 'session-to-feishu-doc']) {
      const installed = join(destination, name);
      await mkdir(installed, { recursive: true });
      await writeFile(
        join(installed, 'SKILL.md'),
        `---\nname: ${name}\ndescription: Previous ${name} copy.\n---\n`,
        'utf8',
      );
    }

    const commandDirectory = join(root, 'bin');
    const mvWrapper = join(commandDirectory, 'mv');
    await mkdir(commandDirectory, { recursive: true });
    await writeFile(
      mvWrapper,
      [
        '#!/bin/sh',
        'case "$1" in',
        '  */.research-skill-stage.*/session-to-feishu-doc) exit 73 ;;',
        'esac',
        'exec /bin/mv "$@"',
        '',
      ].join('\n'),
      'utf8',
    );
    await chmod(mvWrapper, 0o755);

    const result = spawnSync('sh', [
      installer,
      '--repo', repository,
      '--ref', 'main',
      '--dest', destination,
      '--upgrade',
    ], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${commandDirectory}:${process.env.PATH}` },
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /restoring the previous skill versions/);
    for (const name of ['research-proposal-coach', 'session-to-feishu-doc']) {
      assert.match(
        await readFile(join(destination, name, 'SKILL.md'), 'utf8'),
        new RegExp(`Previous ${name} copy`),
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
