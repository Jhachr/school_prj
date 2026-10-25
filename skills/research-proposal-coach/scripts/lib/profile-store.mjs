import {
  copyFile,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
} from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const PROFILE_KEYS = Object.freeze([
  'profile_id',
  'display_name',
  'created_at',
  'updated_at',
  'memory_consent',
]);

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const packagedTemplates = join(skillRoot, 'templates');
const MEMORY_FILES = Object.freeze({
  research_history: 'research-history.md',
  learning_feedback: 'learning-feedback.md',
  preferences: 'preferences.md',
});
const PROFILE_FIELDS = Object.freeze({
  department_or_field: '院系或专业领域',
  role_or_responsibility: '岗位或主要职责',
  course_or_work_scene: '课程或工作场景',
  recent_focus_or_research_basis: '近期重点任务或科研基础',
});
const CONFIRMED_STATUS = 'user_confirmed（本次已确认）';
const SUPERSEDED_STATUS = 'superseded（已被新信息替代）';

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

export async function createProfile({
  root = resolveResearchCoachHome(),
  sessionMode,
  profile,
  today = new Date().toISOString().slice(0, 10),
} = {}) {
  assertTeacherSession(sessionMode);
  validateDate(today, 'today');
  validateNewProfile(profile);
  const store = await initializeStore({ root });
  const existing = await readProfile({ root: store.root });
  if (existing.status === 'ready') {
    throw new Error('teacher profile already exists');
  }
  if (existing.status === 'malformed') {
    await preserveMalformedProfile(store.paths, new Date().toISOString());
    throw new Error('teacher profile is malformed; store is read-only until repaired');
  }

  const document = renderProfileDocument({
    metadata: {
      profile_id: profile.profile_id,
      display_name: profile.display_name,
      created_at: today,
      updated_at: today,
      memory_consent: true,
    },
    fields: Object.fromEntries(
      Object.entries(PROFILE_FIELDS).map(([field]) => [
        field,
        { value: profile.fields[field], confirmedAt: today, history: '' },
      ]),
    ),
  });
  await atomicWriteFile(store.paths.profile, document);
  return { status: 'created', path: store.paths.profile, profile_id: profile.profile_id };
}

export async function commitMemories({
  root = resolveResearchCoachHome(),
  sessionMode,
  confirmation,
  items = [],
  profile_updates: profileUpdates = [],
  now = new Date().toISOString(),
} = {}) {
  assertTeacherSession(sessionMode);
  if (confirmation !== 'user_confirmed') {
    throw new Error('durable writes require confirmation: user_confirmed');
  }
  const confirmedAt = normalizeTimestamp(now);
  const paths = getStorePaths(root);
  await assertWritableProfile(paths, now);
  const tombstones = await readTombstones(paths);
  const pendingDocuments = new Map();
  const seenIds = new Set();

  for (const item of items) {
    validateMemoryItem(item);
    if (seenIds.has(item.memory_id)) {
      throw new Error(`duplicate memory id in batch: ${item.memory_id}`);
    }
    seenIds.add(item.memory_id);
    if (tombstones.has(item.memory_id)) {
      throw new Error(`tombstoned memory id ${item.memory_id} cannot be re-added without a new ID`);
    }
    const filename = MEMORY_FILES[item.category];
    const path = join(paths.memories, filename);
    const current = pendingDocuments.get(path) ?? await readFile(path, 'utf8');
    if (hasMemoryId(current, item.memory_id)) {
      throw new Error(`memory id already exists: ${item.memory_id}`);
    }
    pendingDocuments.set(path, insertMemoryRow(current, item, confirmedAt));
  }

  for (const [path, document] of pendingDocuments) {
    await atomicWriteFile(path, document);
  }

  const updatedFields = profileUpdates.length
    ? await updateProfileFields(paths, profileUpdates, confirmedAt, now)
    : [];

  return {
    status: 'committed',
    written_ids: [...seenIds],
    updated_fields: updatedFields,
  };
}

export async function exportProfile({
  root = resolveResearchCoachHome(),
  outputDir,
  now = new Date().toISOString(),
} = {}) {
  if (!outputDir) throw new Error('export requires an output directory');
  normalizeTimestamp(now);
  const paths = getStorePaths(root);
  const profile = await readProfile({ root });
  if (profile.status !== 'ready') {
    throw new Error(`cannot export profile with status: ${profile.status}`);
  }
  await assertNoSymlinks([resolve(root), paths.profile, paths.memories]);
  const destination = resolve(outputDir);
  await mkdir(join(destination, 'memories'), { recursive: true });
  await copyFile(paths.profile, join(destination, 'teacher-profile.md'));
  for (const filename of Object.values(MEMORY_FILES)) {
    const source = join(paths.memories, filename);
    await assertNoSymlinks([source]);
    await copyFile(source, join(destination, 'memories', filename));
  }
  const manifest = {
    schema_version: 1,
    exported_at: now,
    profile_id: profile.profile.profile_id,
    included: ['teacher-profile.md', 'memories/'],
    excluded: ['sessions/', 'config/'],
  };
  await atomicWriteFile(
    join(destination, 'export-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return { status: 'exported', output: destination, manifest };
}

export async function forgetMemories({
  root = resolveResearchCoachHome(),
  sessionMode,
  ids,
  now = new Date().toISOString(),
} = {}) {
  assertTeacherSession(sessionMode);
  normalizeTimestamp(now);
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('forget requires at least one exact memory ID');
  }
  const uniqueIds = [...new Set(ids)];
  for (const id of uniqueIds) validateMemoryId(id);
  const paths = getStorePaths(root);
  await assertWritableProfile(paths, now);
  await assertNoSymlinks([resolve(root), paths.memories]);

  const changed = new Map();
  const found = new Set();
  for (const filename of Object.values(MEMORY_FILES)) {
    const path = join(paths.memories, filename);
    await assertNoSymlinks([path]);
    let document = await readFile(path, 'utf8');
    for (const id of uniqueIds) {
      const result = removeMemoryRow(document, id);
      document = result.document;
      if (result.removed) found.add(id);
    }
    changed.set(path, document);
  }
  const missing = uniqueIds.filter((id) => !found.has(id));
  if (missing.length) {
    throw new Error(`memory IDs not found: ${missing.join(', ')}`);
  }
  for (const [path, document] of changed) {
    await atomicWriteFile(path, document);
  }
  const tombstonePath = join(paths.config, 'memory-tombstones.jsonl');
  let existing = '';
  try {
    existing = await readFile(tombstonePath, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  const appended = uniqueIds
    .map((memoryId) => JSON.stringify({ memory_id: memoryId, deleted_at: now }))
    .join('\n');
  await atomicWriteFile(tombstonePath, `${existing}${appended}\n`);
  return { status: 'forgotten', removed_ids: uniqueIds };
}

export async function purgeProfile({
  root = resolveResearchCoachHome(),
  confirmationProfileId,
} = {}) {
  const resolvedRoot = resolve(root);
  const paths = getStorePaths(resolvedRoot);
  const current = await readProfile({ root: resolvedRoot });
  if (current.status !== 'ready') {
    throw new Error(`cannot purge profile with status: ${current.status}`);
  }
  if (confirmationProfileId !== current.profile.profile_id) {
    throw new Error('purge confirmation does not match the current profile_id');
  }
  await assertNoSymlinks([
    resolvedRoot,
    paths.profile,
    paths.memories,
    paths.sessions,
    paths.literature,
    paths.artifacts,
    paths.config,
  ]);
  const removed = [
    paths.profile,
    paths.memories,
    paths.sessions,
    paths.literature,
    paths.artifacts,
    paths.config,
  ];
  for (const path of removed) {
    await rm(path, { recursive: true, force: true });
  }
  await initializeStore({ root: resolvedRoot });
  return { status: 'purged', profile_id: confirmationProfileId, removed };
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
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error('invalid quoted frontmatter value');
    }
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
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

function validateNewProfile(profile) {
  if (!profile || typeof profile !== 'object') throw new Error('profile input is required');
  if (profile.memory_consent !== true) throw new Error('memory consent must be true');
  for (const key of ['profile_id', 'display_name']) {
    if (typeof profile[key] !== 'string' || !profile[key].trim()) {
      throw new Error(`${key} is required`);
    }
  }
  if (!profile.fields || typeof profile.fields !== 'object') {
    throw new Error('profile fields are required');
  }
  for (const field of Object.keys(PROFILE_FIELDS)) {
    if (typeof profile.fields[field] !== 'string' || !profile.fields[field].trim()) {
      throw new Error(`${field} is required`);
    }
  }
}

function assertTeacherSession(sessionMode) {
  if (sessionMode === 'temporary') {
    throw new Error('temporary session cannot write durable memory');
  }
  if (sessionMode !== 'teacher') {
    throw new Error('session_mode must be teacher for durable writes');
  }
}

function renderProfileDocument({ metadata, fields }) {
  const frontmatter = PROFILE_KEYS
    .map((key) => `${key}: ${typeof metadata[key] === 'boolean' ? metadata[key] : JSON.stringify(metadata[key])}`)
    .join('\n');
  const rows = Object.entries(PROFILE_FIELDS)
    .map(([field, label]) => {
      const value = fields[field];
      return `| ${label} | ${escapeCell(value.value)} | ${CONFIRMED_STATUS} | ${value.confirmedAt} | ${escapeCell(value.history || '')} |`;
    })
    .join('\n');
  return `---\n${frontmatter}\n---\n\n# 教师画像\n\n这份档案只保存老师已经确认、且对后续科研辅导有持续价值的信息。\n\n| 字段 | 内容 | 来源状态 | 最后确认时间 | 历史 |\n|---|---|---|---|---|\n${rows}\n\n## 状态说明\n\n- \`suggested_from_history（根据历史推荐）\`：来自既往档案，本次还没有重新确认。\n- \`user_confirmed（本次已确认）\`：老师在当前会话中已经确认，可以用于本次判断。\n- \`superseded（已被新信息替代）\`：旧值仍留在历史中，但不得继续作为当前事实。\n`;
}

function parseProfileFields(document) {
  const result = {};
  for (const [field, label] of Object.entries(PROFILE_FIELDS)) {
    const line = document.split('\n').find((candidate) => candidate.startsWith(`| ${label} |`));
    if (!line) throw new Error(`profile table is missing field: ${label}`);
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    result[field] = {
      value: unescapeCell(cells[1] || ''),
      confirmedAt: cells[3] || '',
      history: unescapeCell(cells.slice(4).join('|').trim()),
    };
  }
  return result;
}

async function updateProfileFields(paths, updates, confirmedAt, now) {
  const document = await readFile(paths.profile, 'utf8');
  const metadata = parseProfileFrontmatter(document);
  const fields = parseProfileFields(document);
  const seen = new Set();
  for (const update of updates) {
    if (!update || !Object.hasOwn(PROFILE_FIELDS, update.field)) {
      throw new Error(`unsupported profile field: ${update?.field}`);
    }
    if (seen.has(update.field)) throw new Error(`duplicate profile update: ${update.field}`);
    seen.add(update.field);
    if (typeof update.value !== 'string' || !update.value.trim()) {
      throw new Error(`profile update ${update.field} requires a value`);
    }
    const current = fields[update.field];
    if (current.value !== update.value.trim()) {
      const historyEntry = `${current.value}（${SUPERSEDED_STATUS}，${confirmedAt}）`;
      current.history = current.history ? `${current.history}；${historyEntry}` : historyEntry;
      current.value = update.value.trim();
    }
    current.confirmedAt = confirmedAt;
  }
  metadata.updated_at = confirmedAt;
  await atomicWriteFile(paths.profile, renderProfileDocument({ metadata, fields }));
  return [...seen];
}

function validateMemoryItem(item) {
  if (!item || typeof item !== 'object') throw new Error('memory item must be an object');
  validateMemoryId(item.memory_id);
  if (!Object.hasOwn(MEMORY_FILES, item.category)) {
    throw new Error(`unsupported memory category: ${item.category}`);
  }
  if (typeof item.content !== 'string' || !item.content.trim()) {
    throw new Error(`memory ${item.memory_id} requires content`);
  }
  if (item.artifact !== undefined && typeof item.artifact !== 'string') {
    throw new Error(`memory ${item.memory_id} artifact must be a string`);
  }
}

function validateMemoryId(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(id)) {
    throw new Error(`invalid memory ID: ${id}`);
  }
}

function insertMemoryRow(document, item, confirmedAt) {
  const marker = '<!-- memory-entries:end -->';
  const index = document.indexOf(marker);
  if (index === -1) throw new Error('memory template end marker is missing');
  const row = `| ${item.memory_id} | ${escapeCell(item.content.trim())} | ${CONFIRMED_STATUS} | ${confirmedAt} | ${confirmedAt} | ${escapeCell((item.artifact || '').trim())} |\n`;
  return `${document.slice(0, index)}${row}${document.slice(index)}`;
}

function hasMemoryId(document, id) {
  return document.split('\n').some((line) => line.startsWith(`| ${id} |`));
}

function removeMemoryRow(document, id) {
  let removed = false;
  const lines = document.split('\n').filter((line) => {
    if (line.startsWith(`| ${id} |`)) {
      removed = true;
      return false;
    }
    return true;
  });
  return { document: lines.join('\n'), removed };
}

async function assertWritableProfile(paths, now) {
  const result = await readProfile({ root: dirname(paths.profile) });
  if (result.status === 'malformed') {
    await preserveMalformedProfile(paths, now);
    throw new Error('teacher profile is malformed; store is read-only until repaired');
  }
  if (result.status !== 'ready') {
    throw new Error('confirmed teacher profile is required before durable memory writes');
  }
  await assertNoSymlinks([dirname(paths.profile), paths.profile, paths.memories]);
  return result;
}

async function preserveMalformedProfile(paths, now) {
  const diagnostics = join(paths.config, 'diagnostics');
  await mkdir(diagnostics, { recursive: true });
  const timestamp = String(now).replace(/[:.]/g, '-');
  await copyFile(paths.profile, join(diagnostics, `${timestamp}-teacher-profile.md`));
}

async function readTombstones(paths) {
  const file = join(paths.config, 'memory-tombstones.jsonl');
  try {
    const content = await readFile(file, 'utf8');
    return new Set(
      content
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line).memory_id),
    );
  } catch (error) {
    if (error?.code === 'ENOENT') return new Set();
    throw error;
  }
}

async function assertNoSymlinks(paths) {
  for (const path of paths) {
    try {
      const info = await lstat(path);
      if (info.isSymbolicLink()) throw new Error(`refusing to follow symbolic link: ${path}`);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
}

async function atomicWriteFile(path, content) {
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  const handle = await open(temporary, 'wx', 0o600);
  try {
    await handle.writeFile(content, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename(temporary, path);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

function normalizeTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error('now must be an ISO timestamp');
  return date.toISOString().slice(0, 10);
}

function escapeCell(value) {
  return String(value).replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim();
}

function unescapeCell(value) {
  return String(value).replace(/\\\|/g, '|');
}
