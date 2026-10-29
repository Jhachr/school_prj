#!/usr/bin/env node

import { chmod, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkSetup } from './check-setup.mjs';
import { configDirectory, pendingAuthPath } from './lib/config.mjs';
import {
  buildAuthLoginArgs,
  commandError,
  parseJsonEnvelope,
  runCommand,
} from './lib/lark.mjs';

function parseArgs(argv) {
  return {
    startAuth: argv.includes('--start-auth'),
    finishAuth: argv.includes('--finish-auth'),
  };
}

function authorizationFields(value = {}) {
  return {
    verificationUrl: value.verification_uri_complete
      || value.verification_url
      || value.data?.verification_uri_complete
      || value.data?.verification_url,
    deviceCode: value.device_code || value.data?.device_code,
  };
}

async function savePendingAuth(deviceCode, { env = process.env } = {}) {
  const directory = configDirectory(env);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  await writeFile(pendingAuthPath(env), JSON.stringify({ device_code: deviceCode }), {
    encoding: 'utf8',
    mode: 0o600,
  });
  await chmod(pendingAuthPath(env), 0o600);
}

export async function startAuthorization({ runner = runCommand, env = process.env, cwd = process.cwd() } = {}) {
  const setup = await checkSetup({ runner, env });
  if (!setup.checks.larkCliInstalled) throw new Error('未找到 lark-cli');
  if (!setup.checks.appConfigured) {
    throw new Error('尚未配置飞书应用，请先运行 lark-cli config init --new');
  }
  if (setup.checks.userAuthorized) return { ok: true, already_authorized: true };

  const started = await runner('lark-cli', buildAuthLoginArgs(), { env, cwd });
  const { value } = parseJsonEnvelope(started);
  const { verificationUrl, deviceCode } = authorizationFields(value);
  if (started.code !== 0 || !verificationUrl || !deviceCode) {
    throw new Error(commandError(started, '无法发起飞书用户授权'));
  }
  await savePendingAuth(deviceCode, { env });

  const qrPath = resolve(cwd, 'session-to-feishu-login-qr.png');
  const qr = await runner('lark-cli', ['auth', 'qrcode', verificationUrl, '--output', qrPath], { env, cwd });
  return {
    ok: true,
    verification_url: verificationUrl,
    qr_path: qr.code === 0 ? qrPath : null,
    next_action: '用户完成授权后运行 setup-wizard.mjs --finish-auth',
  };
}

export async function finishAuthorization({ runner = runCommand, env = process.env } = {}) {
  let pending;
  try {
    pending = JSON.parse(await readFile(pendingAuthPath(env), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') throw new Error('没有待完成的授权，请先运行 --start-auth');
    throw new Error(`待授权状态不可用：${error.message}`);
  }
  const completed = await runner(
    'lark-cli',
    ['auth', 'login', '--device-code', pending.device_code],
    { env },
  );
  if (completed.code !== 0) throw new Error(commandError(completed, '飞书用户授权未完成'));
  await unlink(pendingAuthPath(env));
  const setup = await checkSetup({ runner, env });
  if (!setup.checks.userAuthorized) throw new Error('授权命令结束，但用户身份仍未就绪');
  return { ok: true, user_authorized: true, setup };
}

export async function runSetup({ argv = process.argv.slice(2), runner = runCommand, env = process.env } = {}) {
  const args = parseArgs(argv);
  if (args.startAuth && args.finishAuth) throw new Error('--start-auth 与 --finish-auth 不能同时使用');
  if (args.startAuth) return startAuthorization({ runner, env });
  if (args.finishAuth) return finishAuthorization({ runner, env });

  const setup = await checkSetup({ runner, env });
  const commands = {
    install_lark_cli: 'npm install -g @larksuite/cli',
    configure_app: 'lark-cli config init --new',
    authorize_user: `node ${fileURLToPath(import.meta.url)} --start-auth`,
  };
  return { ...setup, command: commands[setup.next_action] || null };
}

async function main() {
  try {
    const result = await runSetup();
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }));
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
