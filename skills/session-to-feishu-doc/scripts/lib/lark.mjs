import { spawn } from 'node:child_process';

export function larkEnvironment(env = process.env) {
  return {
    ...env,
    LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1',
    LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1',
  };
}
export function buildAuthLoginArgs() {
  return [
    'auth', 'login',
    '--domain', 'docs',
    '--domain', 'drive',
    '--no-wait',
    '--json',
  ];
}

export function normalizeAuthStatus(data = {}) {
  const user = data.identities?.user || {};
  return {
    appConfigured: Boolean(data.appId),
    identity: data.identity || null,
    verified: data.verified === true,
    userAuthorized: user.status === 'ready',
    userName: user.userName || null,
  };
}

export function parseJsonEnvelope(result) {
  const raw = result.stdout?.trim() || result.stderr?.trim() || '';
  try {
    return { raw, value: JSON.parse(raw) };
  } catch {
    return { raw, value: null };
  }
}

export function commandError(result, fallback) {
  const { raw, value } = parseJsonEnvelope(result);
  return value?.error?.message
    || value?.error
    || result.stderr?.trim()
    || raw
    || fallback
    || `命令退出码 ${result.code}`;
}

export function runCommand(command, args, {
  cwd = process.cwd(),
  env = process.env,
  input = null,
  onStdout = null,
  onStderr = null,
} = {}) {
  return new Promise((resolvePromise) => {
    const proc = spawn(command, args, {
      cwd,
      env: larkEnvironment(env),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let settled = false;

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      onStdout?.(text);
    });
    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      onStderr?.(text);
    });
    proc.on('error', (error) => {
      if (settled) return;
      settled = true;
      resolvePromise({ code: 127, stdout, stderr: stderr || error.message });
    });
    proc.on('close', (code) => {
      if (settled) return;
      settled = true;
      resolvePromise({ code: code ?? 1, stdout, stderr });
    });

    if (input !== null) proc.stdin.end(input);
    else proc.stdin.end();
  });
}

export async function readAuthStatus({ runner = runCommand, env = process.env } = {}) {
  const result = await runner('lark-cli', ['auth', 'status', '--json', '--verify'], { env });
  const { value } = parseJsonEnvelope(result);
  if (result.code !== 0 || !value) {
    return {
      ok: false,
      status: normalizeAuthStatus(),
      error: commandError(result, '无法读取 lark-cli 认证状态'),
    };
  }
  return { ok: true, status: normalizeAuthStatus(value), raw: value };
}
