import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDirectory = dirname(fileURLToPath(import.meta.url));

export function skillConfigPath() {
  return resolve(moduleDirectory, '..', '..', 'config.json');
}

export function configDirectory(env = process.env) {
  const configured = env.SESSION_TO_FEISHU_HOME?.trim();
  return configured ? resolve(configured) : join(homedir(), '.session-to-feishu-doc');
}

export function configPath(env = process.env) {
  return join(configDirectory(env), 'config.json');
}

export function pendingAuthPath(env = process.env) {
  return join(configDirectory(env), 'pending-auth.json');
}

export function validateConfig(config) {
  const errors = [];
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { ok: false, errors: ['配置必须是 JSON 对象'] };
  }

  try {
    const url = new URL(config.webhook_url || '');
    if (
      url.protocol !== 'https:'
      || url.hostname !== 'open.feishu.cn'
      || !/^\/open-apis\/bot\/v2\/hook\/[A-Za-z0-9-]+$/.test(url.pathname)
      || url.search
      || url.hash
    ) {
      errors.push('webhook_url 必须是有效的飞书自定义机器人 HTTPS 地址');
    }
  } catch {
    errors.push('webhook_url 必须是有效的飞书自定义机器人 HTTPS 地址');
  }

  if (typeof config.receiver_label !== 'string' || !config.receiver_label.trim()) {
    errors.push('receiver_label 不能为空');
  }
  if (config.security_keyword !== undefined
    && (typeof config.security_keyword !== 'string' || !config.security_keyword.trim())) {
    errors.push('security_keyword 必须是非空字符串');
  }
  return { ok: errors.length === 0, errors };
}

async function readConfig(path) {
  try {
    return { found: true, config: JSON.parse(await readFile(path, 'utf8')) };
  } catch (error) {
    if (error?.code === 'ENOENT') return { found: false };
    return { found: true, error: error.message };
  }
}

export async function loadConfig({ env = process.env, bundledPath = skillConfigPath() } = {}) {
  const environmentUrl = env.SESSION_TO_FEISHU_WEBHOOK_URL?.trim();
  if (environmentUrl) {
    const config = {
      webhook_url: environmentUrl,
      receiver_label: env.SESSION_TO_FEISHU_RECEIVER_LABEL?.trim() || '科研教练产品改进群',
      security_keyword: env.SESSION_TO_FEISHU_SECURITY_KEYWORD?.trim() || '科研会话反馈',
    };
    const validation = validateConfig(config);
    return { ...validation, config, source: 'environment', path: null };
  }

  const userPath = configPath(env);
  const user = await readConfig(userPath);
  if (user.found) {
    if (user.error) {
      return { ok: false, error: 'invalid_json', errors: [user.error], path: userPath };
    }
    const legacyRecipientConfig = !user.config?.webhook_url && user.config?.notify_user_id;
    if (!legacyRecipientConfig) {
      const validation = validateConfig(user.config);
      return { ...validation, config: user.config, source: 'user', path: userPath };
    }
  }

  const bundled = await readConfig(bundledPath);
  if (!bundled.found) {
    return { ok: false, error: 'not_found', errors: ['Skill 未包含默认 Webhook 配置'], path: bundledPath };
  }
  if (bundled.error) {
    return { ok: false, error: 'invalid_json', errors: [bundled.error], path: bundledPath };
  }
  const validation = validateConfig(bundled.config);
  return {
    ...validation,
    config: bundled.config,
    source: 'bundled',
    path: bundledPath,
    ...(user.found ? { warning: '已忽略旧版 open_id 接收者配置' } : {}),
  };
}

export async function saveConfig(values, { env = process.env } = {}) {
  const validation = validateConfig(values);
  if (!validation.ok) throw new Error(validation.errors.join('；'));

  const directory = configDirectory(env);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  const config = {
    webhook_url: values.webhook_url,
    receiver_label: values.receiver_label.trim(),
    ...(values.security_keyword?.trim()
      ? { security_keyword: values.security_keyword.trim() }
      : {}),
  };
  await writeFile(configPath(env), `${JSON.stringify(config, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  await chmod(configPath(env), 0o600);
  return config;
}
