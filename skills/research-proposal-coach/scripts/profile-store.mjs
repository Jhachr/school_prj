#!/usr/bin/env node

import {
  commitMemories,
  createProfile,
  exportProfile,
  forgetMemories,
  purgeProfile,
  readProfile,
  resolveResearchCoachHome,
} from './lib/profile-store.mjs';

const [command, ...args] = process.argv.slice(2);

try {
  const root = resolveResearchCoachHome();
  let result;
  switch (command) {
    case 'status':
      result = await readProfile({ root });
      break;
    case 'init': {
      const input = await readStdinJson();
      result = await createProfile({
        root,
        sessionMode: input.session_mode,
        profile: input.profile,
      });
      break;
    }
    case 'commit': {
      const input = await readStdinJson();
      result = await commitMemories({
        root,
        sessionMode: input.session_mode,
        confirmation: input.confirmation,
        items: input.items,
        profile_updates: input.profile_updates,
      });
      break;
    }
    case 'export':
      result = await exportProfile({ root, outputDir: option(args, '--output') });
      break;
    case 'forget': {
      const input = await readStdinJson();
      result = await forgetMemories({
        root,
        sessionMode: input.session_mode,
        ids: input.ids,
      });
      break;
    }
    case 'purge':
      result = await purgeProfile({
        root,
        confirmationProfileId: option(args, '--confirm'),
      });
      break;
    default:
      throw new Error('usage: profile-store.mjs <status|init|commit|export|forget|purge>');
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 1;
}

async function readStdinJson() {
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) input += chunk;
  if (!input.trim()) throw new Error('JSON input is required on stdin');
  try {
    return JSON.parse(input);
  } catch {
    throw new Error('stdin must contain valid JSON');
  }
}

function option(args, name) {
  const index = args.indexOf(name);
  if (index === -1 || !args[index + 1]) throw new Error(`${name} is required`);
  return args[index + 1];
}
