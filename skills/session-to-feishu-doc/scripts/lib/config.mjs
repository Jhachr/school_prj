import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';

export function configDirectory(env = process.env) {
  const configured = env.SESSION_TO_FEISHU_HOME?.trim();
  return configured ? resolve(configured) : join(homedir(), '.session-to-feishu-doc');
}

export function configPath(env = process.env) {
  return join(configDirectory(env), 'config.json');
}

export function validateConfig(config) {
  const errors = [];
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { ok: false, errors: ['配置必须是 JSON 对象'] };
  }
  if (!/^ou_[A-Za-z0-9_-]+$/.test(config.notify_user_id || '')) {
    errors.push('notify_user_id 必须是 ou_ 开头的 open_id');
  }
  if (typeof config.notify_user_label !== 'string' || !config.notify_user_label.trim()) {
    errors.push('notify_user_label 不能为空');
  }
  return { ok: errors.length === 0, errors };
}

export async function loadConfig({ env = process.env } = {}) {
  const path = configPath(env);
  try {
    const config = JSON.parse(await readFile(path, 'utf8'));
    const validation = validateConfig(config);
    return { ...validation, config, path };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { ok: false, error: 'not_found', errors: ['配置文件不存在'], path };
    }
    return { ok: false, error: 'invalid_json', errors: [error.message], path };
  }
}

export async function saveConfig(values, { env = process.env, now = new Date() } = {}) {
  const validation = validateConfig(values);
  if (!validation.ok) {
    throw new Error(validation.errors.join('；'));
  }

  const directory = configDirectory(env);
  if (!isAbsolute(directory)) {
    throw new Error('配置目录必须解析为绝对路径');
  }
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);

  const existing = await loadConfig({ env });
  const timestamp = now.toISOString();
  const config = {
    ...(existing.config || {}),
    notify_user_id: values.notify_user_id,
    notify_user_label: values.notify_user_label.trim(),
    created_at: existing.config?.created_at || timestamp,
    updated_at: timestamp,
  };
  await writeFile(configPath(env), `${JSON.stringify(config, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  await chmod(configPath(env), 0o600);
  return config;
}
