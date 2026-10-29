#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

import { configPath, loadConfig, saveConfig } from './lib/config.mjs';
import {
  buildAuthLoginArgs,
  commandError,
  parseJsonEnvelope,
  readAuthStatus,
  runCommand,
} from './lib/lark.mjs';

const scriptPath = fileURLToPath(import.meta.url);

function parseArgs(argv) {
  const args = { defaultNotifyUser: '', defaultNotifyLabel: '产品改进团队' };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--default-notify-user') args.defaultNotifyUser = argv[++index] || '';
    else if (argv[index] === '--default-notify-label') args.defaultNotifyLabel = argv[++index] || '';
  }
  return args;
}

function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolvePromise) => {
    rl.question(query, (answer) => {
      rl.close();
      resolvePromise(answer.trim());
    });
  });
}

function openBrowser(url) {
  const command = process.platform === 'darwin'
    ? ['open', [url]]
    : process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : ['xdg-open', [url]];
  try {
    const child = spawn(command[0], command[1], { detached: true, stdio: 'ignore' });
    child.on('error', () => {});
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function firstUrl(text) {
  return text.match(/https:\/\/[^\s"']+/)?.[0] || null;
}

async function showAuthorizationUrl(url, suffix, { runner = runCommand, env = process.env } = {}) {
  console.log(`\n授权链接：${url}`);
  const opened = openBrowser(url);
  console.log(opened ? '浏览器已打开。' : '请手动复制上方链接到浏览器。');
  const output = `./session-to-feishu-${suffix}-qr.png`;
  const qr = await runner('lark-cli', ['auth', 'qrcode', url, '--output', output], { env });
  if (qr.code === 0) console.log(`二维码：${resolve(process.cwd(), output)}`);
  else console.log(`二维码生成失败：${commandError(qr)}`);
}

async function ensureApplication({ runner = runCommand, env = process.env } = {}) {
  const before = await readAuthStatus({ runner, env });
  if (before.status.appConfigured) return before;

  console.log('\n尚未配置飞书应用。向导将启动 lark-cli 配置流程。');
  const answer = await askQuestion('现在开始配置？(y/n): ');
  if (!/^y(es)?$/i.test(answer)) throw new Error('用户取消了应用配置');

  let revealedUrl = null;
  let streamedOutput = '';
  const pending = [];
  const reveal = (chunk) => {
    process.stdout.write(chunk);
    streamedOutput += chunk;
    const url = firstUrl(streamedOutput);
    if (url && url !== revealedUrl) {
      revealedUrl = url;
      pending.push(showAuthorizationUrl(url, 'config', { runner, env }));
    }
  };
  const result = await runner('lark-cli', ['config', 'init', '--new'], {
    env,
    onStdout: reveal,
    onStderr: reveal,
  });
  await Promise.all(pending);
  if (result.code !== 0) throw new Error(commandError(result, '飞书应用配置失败'));

  const after = await readAuthStatus({ runner, env });
  if (!after.status.appConfigured) throw new Error('配置命令已结束，但仍未检测到 appId');
  return after;
}

async function ensureUserAuthorization({ runner = runCommand, env = process.env } = {}) {
  const before = await readAuthStatus({ runner, env });
  if (before.status.userAuthorized && before.status.verified) return before;

  console.log('\n需要授权文档、云空间权限和消息能力。');
  const started = await runner('lark-cli', buildAuthLoginArgs(), { env });
  const { value } = parseJsonEnvelope(started);
  const url = value?.verification_uri_complete
    || value?.verification_url
    || value?.data?.verification_uri_complete
    || value?.data?.verification_url;
  const deviceCode = value?.device_code || value?.data?.device_code;
  if (started.code !== 0 || !url || !deviceCode) {
    throw new Error(commandError(started, '无法发起飞书用户授权'));
  }

  await showAuthorizationUrl(url, 'login', { runner, env });
  await askQuestion('在浏览器完成授权后按回车继续：');
  const completed = await runner('lark-cli', ['auth', 'login', '--device-code', deviceCode], { env });
  if (completed.code !== 0) throw new Error(commandError(completed, '飞书用户授权未完成'));

  const after = await readAuthStatus({ runner, env });
  if (!after.status.userAuthorized || !after.status.verified) {
    throw new Error('授权命令已结束，但用户身份仍未就绪');
  }
  return after;
}

async function ensureRecipient({ defaults, env = process.env } = {}) {
  const current = await loadConfig({ env });
  if (current.ok) return current.config;

  console.log('\n需要配置会话接收者。接收者必须能被当前飞书应用和租户识别。');
  const labelInput = await askQuestion(`接收者名称（默认：${defaults.defaultNotifyLabel}）：`);
  const notify_user_label = labelInput || defaults.defaultNotifyLabel;
  const idPrompt = defaults.defaultNotifyUser
    ? `接收者 open_id（默认：${defaults.defaultNotifyUser}）：`
    : '接收者 open_id（ou_ 开头）：';
  const idInput = await askQuestion(idPrompt);
  const notify_user_id = idInput || defaults.defaultNotifyUser;
  return saveConfig({ notify_user_id, notify_user_label }, { env });
}

export async function runSetup({
  argv = process.argv.slice(2),
  runner = runCommand,
  env = process.env,
} = {}) {
  const defaults = parseArgs(argv);
  const version = await runner('lark-cli', ['--version'], { env });
  if (version.code !== 0) {
    throw new Error('未找到 lark-cli。请先安装飞书 CLI，再重新运行本向导。');
  }
  await ensureApplication({ runner, env });
  const auth = await ensureUserAuthorization({ runner, env });
  const config = await ensureRecipient({ defaults, env });
  return {
    ok: true,
    user: auth.status.userName,
    recipient: config.notify_user_label,
    config_path: configPath(env),
  };
}

async function main() {
  console.log('Session to Feishu Doc - 首次配置向导');
  try {
    const result = await runSetup();
    console.log('\n配置完成：');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n现在可以说：“把当前会话提交给产品改进团队”。');
  } catch (error) {
    console.error(`\n配置未完成：${error.message}`);
    console.error(`重新运行：node ${scriptPath}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) await main();
