#!/usr/bin/env node

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { commandError, parseJsonEnvelope, runCommand } from './lib/lark.mjs';

const desiredPermission = {
  external_access: true,
  link_share_entity: 'anyone_readable',
};

function validateToken(token) {
  if (!/^[A-Za-z0-9_-]+$/.test(token || '')) throw new Error('缺少有效的飞书文档 token');
  return token;
}

export function buildManagePublicAuthArgs({ token }) {
  return [
    'drive', 'permission.members', 'auth',
    '--token', validateToken(token),
    '--type', 'docx',
    '--action', 'manage_public',
    '--as', 'user',
    '--json',
  ];
}

export function buildGetPublicPermissionArgs({ token }) {
  return [
    'drive', 'permission.public', 'get',
    '--token', validateToken(token),
    '--type', 'docx',
    '--as', 'user',
    '--json',
  ];
}

export function buildSetPublicPermissionArgs({ token }) {
  return [
    'drive', 'permission.public', 'patch',
    '--token', validateToken(token),
    '--type', 'docx',
    '--data', JSON.stringify(desiredPermission),
    '--as', 'user',
    '--yes',
    '--json',
  ];
}

function permissionFrom(value) {
  return value?.data?.permission_public || value?.permission_public || null;
}

function apiCode(value) {
  return value?.error?.code || value?.code || null;
}

function publicPermissionError(result, value, fallback) {
  const code = apiCode(value);
  const guidance = {
    91009: '租户安全策略禁止对外分享，需要联系租户管理员调整组织级策略',
    91010: '当前文档未允许对外分享，需要在文档权限设置中先开启对外分享',
    91011: '文档密级策略禁止对外分享，需要在文档中申请密级豁免或降级',
    91012: '文档密级策略禁止修改该权限，需要在文档中申请密级豁免或降级',
  }[code];
  const error = new Error(guidance || commandError(result, fallback));
  error.code = code;
  return error;
}

async function readPermission(token, runner) {
  const result = await runner('lark-cli', buildGetPublicPermissionArgs({ token }));
  const { value } = parseJsonEnvelope(result);
  const permission = permissionFrom(value);
  if (result.code !== 0 || value?.ok !== true || !permission) {
    throw publicPermissionError(result, value, '无法读取文档公开权限');
  }
  return permission;
}

export async function setPublicAccess({ token, confirmed = false, runner = runCommand }) {
  if (!confirmed) throw new Error('必须先获得用户对“互联网获得链接的任何人可阅读”的明确确认');
  validateToken(token);

  const authResult = await runner('lark-cli', buildManagePublicAuthArgs({ token }));
  const { value: authValue } = parseJsonEnvelope(authResult);
  if (authResult.code !== 0 || authValue?.ok !== true) {
    throw publicPermissionError(authResult, authValue, '无法检查文档公开权限管理能力');
  }
  if (authValue.data?.auth_result !== true && authValue.auth_result !== true) {
    throw new Error('当前用户没有管理该文档公开权限的能力');
  }

  const before = await readPermission(token, runner);
  const alreadyPublic = before.external_access === true
    && before.link_share_entity === 'anyone_readable';
  if (!alreadyPublic) {
    const patchResult = await runner('lark-cli', buildSetPublicPermissionArgs({ token }));
    const { value: patchValue } = parseJsonEnvelope(patchResult);
    if (patchResult.code !== 0 || patchValue?.ok !== true) {
      throw publicPermissionError(patchResult, patchValue, '无法开启互联网链接只读权限');
    }
  }

  const after = await readPermission(token, runner);
  if (after.external_access !== true || after.link_share_entity !== 'anyone_readable') {
    throw new Error('权限命令已完成，但重新读取后未验证为互联网链接只读');
  }
  return {
    ok: true,
    changed: !alreadyPublic,
    before: {
      external_access: before.external_access,
      link_share_entity: before.link_share_entity,
    },
    after: desiredPermission,
    verified: true,
  };
}

function parseArgs(argv) {
  const args = { confirmed: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--token') args.token = argv[++index];
    else if (argv[index] === '--yes') args.confirmed = true;
  }
  return args;
}

async function main() {
  try {
    console.log(JSON.stringify(await setPublicAccess(parseArgs(process.argv.slice(2)))));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, code: error.code || null, error: error.message }));
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
