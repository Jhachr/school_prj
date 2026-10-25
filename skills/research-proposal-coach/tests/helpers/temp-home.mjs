import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function withResearchCoachHome(run) {
  const root = await mkdtemp(join(tmpdir(), 'research-coach-test-'));
  try {
    await run({
      root,
      env: { ...process.env, RESEARCH_COACH_HOME: root },
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
