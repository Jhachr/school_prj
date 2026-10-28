import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const skillRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const readmePath = path.join(skillRoot, 'README.md');

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
  for (const directory of directories) {
    assert.ok(
      readme.includes(`\`${directory}/\``),
      `README must mention \`${directory}/\``,
    );
  }
});

test('README relative Markdown links resolve from the Skill root', async () => {
  const readme = await readFile(readmePath, 'utf8');
  const markdownLinks = [...readme.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map(
    (match) => match[1].trim(),
  );
  const localTargets = markdownLinks
    .filter((target) => !target.startsWith('#') && !target.includes('://'))
    .map((target) => target.replace(/^<|>$/g, '').split('#', 1)[0])
    .filter(Boolean);

  assert.ok(localTargets.length > 0, 'README must contain at least one local link');
  for (const target of localTargets) {
    await assert.doesNotReject(
      access(path.resolve(skillRoot, target)),
      `README local link must resolve: ${target}`,
    );
  }
});
