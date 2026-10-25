import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROFILE_KEYS = Object.freeze([
  'profile_id',
  'display_name',
  'created_at',
  'updated_at',
  'memory_consent',
]);

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const packagedTemplates = join(skillRoot, 'templates');

export function resolveResearchCoachHome(env = process.env) {
  return resolve(env.RESEARCH_COACH_HOME || join(homedir(), '.research-proposal-coach'));
}

export function getStorePaths(root = resolveResearchCoachHome()) {
  const resolvedRoot = resolve(root);
  const paths = {
    profile: join(resolvedRoot, 'teacher-profile.md'),
    memories: join(resolvedRoot, 'memories'),
    sessions: join(resolvedRoot, 'sessions'),
    literature: join(resolvedRoot, 'literature'),
    literatureRuns: join(resolvedRoot, 'literature', 'runs'),
    artifacts: join(resolvedRoot, 'artifacts'),
    config: join(resolvedRoot, 'config'),
  };
  const prefix = `${resolvedRoot}${sep}`;
  for (const path of Object.values(paths)) {
    if (!resolve(path).startsWith(prefix)) {
      throw new Error(`store path escapes RESEARCH_COACH_HOME: ${path}`);
    }
  }
  return paths;
}

export async function initializeStore({ root = resolveResearchCoachHome() } = {}) {
  const resolvedRoot = resolve(root);
  const paths = getStorePaths(resolvedRoot);

  for (const directory of [
    paths.memories,
    paths.sessions,
    paths.literatureRuns,
    paths.artifacts,
    paths.config,
  ]) {
    await mkdir(directory, { recursive: true });
  }

  await Promise.all([
    copyIfMissing(join(packagedTemplates, 'research-history.md'), join(paths.memories, 'research-history.md')),
    copyIfMissing(join(packagedTemplates, 'learning-feedback-memory.md'), join(paths.memories, 'learning-feedback.md')),
    copyIfMissing(join(packagedTemplates, 'preferences.md'), join(paths.memories, 'preferences.md')),
  ]);

  return { root: resolvedRoot, initialized: true, paths };
}

export async function readProfile({ root = resolveResearchCoachHome() } = {}) {
  const paths = getStorePaths(root);
  let document;
  try {
    document = await readFile(paths.profile, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        status: 'missing',
        profile: null,
        path: paths.profile,
        diagnostics: [],
      };
    }
    throw error;
  }

  try {
    return {
      status: 'ready',
      profile: parseProfileFrontmatter(document),
      path: paths.profile,
      diagnostics: [],
    };
  } catch (error) {
    return {
      status: 'malformed',
      profile: null,
      path: paths.profile,
      diagnostics: [error.message],
    };
  }
}

export function parseProfileFrontmatter(document) {
  if (!document.startsWith('---\n')) {
    throw new Error('profile frontmatter opening delimiter is missing');
  }
  const closingIndex = document.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    throw new Error('profile frontmatter closing delimiter is missing');
  }

  const values = {};
  const lines = document.slice(4, closingIndex).split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const separator = line.indexOf(':');
    if (separator === -1) {
      throw new Error(`invalid frontmatter line: ${line}`);
    }
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    if (!PROFILE_KEYS.includes(key)) {
      throw new Error(`unsupported key: ${key}`);
    }
    if (Object.hasOwn(values, key)) {
      throw new Error(`duplicate key: ${key}`);
    }
    values[key] = parseScalar(rawValue);
  }

  for (const key of PROFILE_KEYS) {
    if (!Object.hasOwn(values, key)) {
      throw new Error(`missing required key: ${key}`);
    }
  }
  if (typeof values.profile_id !== 'string' || !values.profile_id.trim()) {
    throw new Error('profile_id must be a non-empty string');
  }
  if (typeof values.display_name !== 'string' || !values.display_name.trim()) {
    throw new Error('display_name must be a non-empty string');
  }
  validateDate(values.created_at, 'created_at');
  validateDate(values.updated_at, 'updated_at');
  if (typeof values.memory_consent !== 'boolean') {
    throw new Error('memory_consent must be true or false');
  }

  return values;
}

async function copyIfMissing(source, destination) {
  try {
    await copyFile(source, destination, constants.COPYFILE_EXCL);
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error;
  }
}

function parseScalar(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function validateDate(value, key) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${key} must use YYYY-MM-DD`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${key} is not a valid calendar date`);
  }
}
