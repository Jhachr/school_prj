import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const skillRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const readmePath = path.join(skillRoot, 'README.md');
const repositoryReadmePath = path.resolve(skillRoot, '../../README.md');

function parseTopLevelDirectoryHeadings(markdown) {
  const headings = [...markdown.matchAll(/^###[ \t]+`([^`/\r\n]+)\/`/gm)].map(
    (match) => match[1],
  );
  return [...new Set(headings)].sort();
}

test('directory headings ignore body mentions and nested directory headings', () => {
  const markdown = [
    '# Directory guide',
    '',
    '### `rules/`: top-level rules',
    '',
    'The implementation also uses `lib/` internally.',
    '',
    '#### `helpers/`: nested test helpers',
  ].join('\n');

  assert.deepEqual(parseTopLevelDirectoryHeadings(markdown), ['rules']);
});

test('README maps every top-level directory', async () => {
  const [entries, readme] = await Promise.all([
    readdir(skillRoot, { withFileTypes: true }),
    readFile(readmePath, 'utf8'),
  ]);
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.ok(directories.length > 0, 'expected at least one top-level directory');
  assert.deepEqual(parseTopLevelDirectoryHeadings(readme), directories);
});

test('README relative Markdown links resolve from the Skill root', async () => {
  const readme = await readFile(readmePath, 'utf8');
  const markdownLinks = [...readme.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map(
    (match) => match[1].trim().replace(/^<|>$/g, ''),
  );
  const localTargets = markdownLinks
    .filter(
      (target) =>
        !target.startsWith('#') && !/^[a-z][a-z0-9+.-]*:/i.test(target),
    )
    .map((target) => target.split('#', 1)[0])
    .filter(Boolean)
    .map(decodeURIComponent);

  assert.ok(localTargets.length > 0, 'README must contain at least one local link');
  for (const target of localTargets) {
    await assert.doesNotReject(
      access(path.resolve(skillRoot, target)),
      `README local link must resolve: ${target}`,
    );
  }
});

test('repository and skill guides describe the bundled opt-in upload skill', async () => {
  const [repositoryReadme, skillReadme] = await Promise.all([
    readFile(repositoryReadmePath, 'utf8'),
    readFile(readmePath, 'utf8'),
  ]);
  for (const text of [repositoryReadme, skillReadme]) {
    assert.match(text, /session-to-feishu-doc/);
    assert.match(text, /一起安装|同时安装/);
  }
  assert.match(repositoryReadme, /明确同意/);
  assert.match(repositoryReadme, /Webhook/);
  assert.match(repositoryReadme, /不需要选择接收者或提供 `open_id`/);
  assert.match(repositoryReadme, /https:\/\/gitee\.com\/jhachr\/school_prj\/raw\/main/);
  assert.match(repositoryReadme, /~\/\.trae-cn\/skills/);
  assert.match(repositoryReadme, /--target codex[^\n]*TRAE[^\n]*不会显示/);
  assert.match(
    repositoryReadme,
    /raw\/codex\/scripts\/install-research-proposal-coach\.sh'[\s\S]*--target trae --ref codex/,
  );
  assert.doesNotMatch(repositoryReadme, /api\.github\.com/i);
  assert.match(skillReadme, /session-sharing\.md/);
});
