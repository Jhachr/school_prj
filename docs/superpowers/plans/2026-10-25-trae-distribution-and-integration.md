# Trae Distribution And End-To-End Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the complete research coach as a globally installed Trae CN Skill with one CLI command, first-use local-data initialization, upgrade-safe user data, diagnostics, and end-to-end acceptance coverage.

**Architecture:** Use the standard `skills` CLI to install the complete Skill directory into Trae CN's global Skill location. Do not execute arbitrary post-install hooks or build a separate installer. On the first actual Skill invocation, a bundled dependency-free doctor initializes `RESEARCH_COACH_HOME` and checks local prerequisites; network checks are explicit and non-destructive. Skill upgrades replace only packaged files, while teacher data remains outside the installation directory.

**Tech Stack:** Trae CN Skill format, `npx skills`, Node.js 22.20+, Markdown, Node.js standard library, `node:test`

---

**Required implementation skills:** Use `superpowers:test-driven-development`, `superpowers:writing-skills`, and `skill-creator` while implementing and validating the packaged Skill. Do not rely on static wording checks alone; complete independent forward testing before release.

## Preconditions And Fixed Contracts

- Complete the profile/memory, literature, and readiness migration plans first.
- The first supported target is Trae CN, agent ID `trae-cn`, with global Skill path `~/.trae-cn/skills/` on macOS/Linux and `%USERPROFILE%/.trae-cn/skills/` on Windows.
- The repository remote is `Jhachr/school_prj`; after the implementation is merged to its default branch, the exact customer install command is:

```bash
npx skills add Jhachr/school_prj --skill research-proposal-coach -g -a trae-cn -y
```

- The `skills` CLI currently requires Node.js 22.20 or later. The install guide must check this before troubleshooting the Skill itself.
- Installation copies/links the Skill package; it does not initialize personal data. First Skill use initializes the data root. This avoids an extra installer and avoids hidden post-install execution.
- User data never lives inside `~/.trae-cn/skills/research-proposal-coach` and must survive updates/removal of the Skill.
- Public-source network diagnostics are opt-in. A blocked network does not invalidate local installation; it limits retrieval and must be explained as such.

## Task 1: Add A Dependency-Free First-Use Doctor

**Files:**

- Create: `skills/research-proposal-coach/scripts/doctor.mjs`
- Create: `skills/research-proposal-coach/scripts/lib/doctor.mjs`
- Create: `skills/research-proposal-coach/tests/doctor.test.mjs`

- [ ] Write failing tests for runtime version, Skill package files, data-root writability, initialization, and optional public-source checks.

The result contract is:

```json
{
  "ok": true,
  "checks": [
    { "id": "node_version", "status": "pass", "message": "Node.js 22.20+" },
    { "id": "skill_package", "status": "pass", "message": "Required files found" },
    { "id": "data_root", "status": "pass", "message": "Writable and initialized" },
    { "id": "openalex", "status": "skipped", "message": "Use --check-network to test" },
    { "id": "crossref", "status": "skipped", "message": "Use --check-network to test" }
  ]
}
```

- [ ] Confirm the tests fail before implementation.

Run: `node --test skills/research-proposal-coach/tests/doctor.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] Implement `doctor --init --json` with injected filesystem, environment, and fetch dependencies for tests. Reuse `initializeStore()` from the profile plan.

- [ ] Make local checks distinguish:

  - runtime too old;
  - package incomplete;
  - data root not writable;
  - profile missing, ready, or malformed;
  - network skipped, available, partially available, or unavailable.

- [ ] Make `--check-network` call the bounded smoke functions from the literature plan. Network failures produce actionable warnings and a non-zero exit only when the user explicitly requested a network-only readiness assertion.

- [ ] Verify `--init` creates directories and blank memory templates but never creates a teacher profile or consent.

- [ ] Run the tests.

Run: `node --test skills/research-proposal-coach/tests/doctor.test.mjs`

Expected: PASS.

- [ ] Commit the doctor.

```bash
git add skills/research-proposal-coach/scripts/doctor.mjs skills/research-proposal-coach/scripts/lib/doctor.mjs skills/research-proposal-coach/tests/doctor.test.mjs
git commit -m "feat: add first-use environment doctor"
```

## Task 2: Validate The Installable Skill Package

**Files:**

- Create: `skills/research-proposal-coach/scripts/validate-package.mjs`
- Create: `skills/research-proposal-coach/tests/package-integrity.test.mjs`
- Modify: `skills/research-proposal-coach/SKILL.md`

- [ ] Write failing tests requiring:

  - valid frontmatter containing only supported core keys;
  - every relative Markdown/script/template reference in `SKILL.md` to exist;
  - every declared CLI script to parse under Node;
  - no absolute developer paths, secrets, teacher data, `node_modules`, or generated literature runs in the package;
  - all required bilingual status labels to appear in the referenced rule set;
  - the two formal content artifacts, and no unconditional third proposal-review artifact.

- [ ] Confirm the tests fail until the validator exists and all prior plan wiring is complete.

Run: `node --test skills/research-proposal-coach/tests/package-integrity.test.mjs`

Expected: FAIL before implementation, PASS after implementation.

- [ ] Implement the validator with the Node standard library. It must be runnable from any working directory by resolving the Skill root from `import.meta.url`.

- [ ] Update `SKILL.md` startup instructions to invoke the installed relative script path rather than assuming the repository root:

```text
1. Resolve this Skill's own directory.
2. Run `node <skill-root>/scripts/doctor.mjs --init --json`.
3. If local checks pass, perform identity routing.
4. Run network diagnostics only when retrieval is needed or the user asks for diagnostics.
```

- [ ] Refactor the entrypoint for progressive disclosure: the frontmatter description starts with `Use when...` and contains triggering conditions rather than workflow; `SKILL.md` keeps only shared routing and hard boundaries; profile, literature, and proposal references are loaded only when their mode is active. Do not require every rule/module on every invocation.

- [ ] Ensure no instruction claims persistence or retrieval succeeded without reading the command result.

- [ ] Run the validator and tests.

Run: `node skills/research-proposal-coach/scripts/validate-package.mjs`

Expected: JSON result with `ok: true` and no missing references.

Run: `node --test skills/research-proposal-coach/tests/package-integrity.test.mjs`

Expected: PASS.

- [ ] Commit package validation.

```bash
git add skills/research-proposal-coach/SKILL.md skills/research-proposal-coach/scripts/validate-package.mjs skills/research-proposal-coach/tests/package-integrity.test.mjs
git commit -m "test: validate distributable Trae skill package"
```

## Task 3: Add Trae CN Installation And Lifecycle Documentation

**Files:**

- Create: `skills/research-proposal-coach/README.md`
- Create: `docs/installation/trae-cn.md`
- Modify: `README.md`
- Create: `skills/research-proposal-coach/tests/trae-install-contract.test.mjs`

- [ ] Write a failing documentation contract test requiring the exact install, update, verify, remove, and personal-data deletion flows.

Required commands:

```bash
npx skills add Jhachr/school_prj --skill research-proposal-coach -g -a trae-cn -y
npx skills update research-proposal-coach -g -y
npx skills list -g -a trae-cn
npx skills remove research-proposal-coach -g -a trae-cn -y
```

- [ ] Document prerequisites and behavior:

  - Node.js 22.20+;
  - GitHub access to `Jhachr/school_prj` (public access or the customer's existing Git credentials if private);
  - install destination;
  - first-use initialization of `~/.research-proposal-coach`;
  - identity-choice prompt;
  - network access needed for OpenAlex/Crossref retrieval;
  - upgrade and uninstall do not remove personal data;
  - personal data is deleted only by a separate explicit profile-store purge flow.

- [ ] Explain the two fallback install paths Trae itself supports: import a local `SKILL.md` or upload a ZIP containing the Skill. Keep them as recovery options, not the primary installation route.

- [ ] Add a troubleshooting table for old Node, private-repository authentication, unwritable data root, incomplete Skill package, OpenAlex/Crossref blockage, and malformed profile fallback.

- [ ] Link the installation guide from the repository README.

- [ ] Run the documentation contract test.

Run: `node --test skills/research-proposal-coach/tests/trae-install-contract.test.mjs`

Expected: PASS.

- [ ] Commit documentation.

```bash
git add README.md docs/installation/trae-cn.md skills/research-proposal-coach/README.md skills/research-proposal-coach/tests/trae-install-contract.test.mjs
git commit -m "docs: add one-command Trae CN installation"
```

## Task 4: Test The Standard Skills CLI Layout Locally

**Files:**

- Create: `skills/research-proposal-coach/tests/trae-package-smoke.test.mjs`
- Create: `scripts/test-trae-project-install.mjs`

- [ ] Write a smoke harness that creates a temporary working directory, invokes the standard `skills` CLI against the local repository in project scope, and validates `.trae/skills/research-proposal-coach/` without touching the real global Trae directory.

The harness must execute the equivalent of:

```text
npx skills add <local-repository-path> --skill research-proposal-coach -a trae-cn -y --copy
```

- [ ] Make the harness skip with a clear reason if `npx skills` is unavailable and network installation is not authorized. Keep package-integrity tests authoritative in offline CI.

- [ ] Assert the installed project copy includes `SKILL.md`, `modules/`, `rules/`, `templates/`, and `scripts/`, then execute its `validate-package.mjs` and `doctor.mjs` against a test-owned `RESEARCH_COACH_HOME`.

- [ ] Confirm the source repository and real user data directories remain unchanged.

- [ ] Run offline package tests.

Run: `node --test skills/research-proposal-coach/tests/package-integrity.test.mjs skills/research-proposal-coach/tests/trae-package-smoke.test.mjs`

Expected: PASS, or the CLI-specific test is explicitly skipped when the external CLI is unavailable.

- [ ] In a network-enabled development environment, run the project-scope install smoke harness.

Run: `node scripts/test-trae-project-install.mjs`

Expected: temporary `.trae/skills/research-proposal-coach` is complete and validates successfully; temporary data is cleaned afterward.

- [ ] Commit the smoke harness.

```bash
git add scripts/test-trae-project-install.mjs skills/research-proposal-coach/tests/trae-package-smoke.test.mjs
git commit -m "test: verify Trae skill installation layout"
```

## Task 5: Add End-To-End Workflow Acceptance Tests

**Files:**

- Create: `skills/research-proposal-coach/tests/end-to-end-workflow.test.mjs`
- Create: `skills/research-proposal-coach/tests/fixtures/e2e/teacher-profile.json`
- Create: `skills/research-proposal-coach/tests/fixtures/e2e/search-plan.json`
- Create: `skills/research-proposal-coach/tests/fixtures/e2e/claim-ledger.jsonl`
- Modify: `skills/research-proposal-coach/maintenance/eval-case-template.md`
- Create: `skills/research-proposal-coach/maintenance/evals/end-to-end-trae-scenarios.md`

- [ ] Write one offline end-to-end scenario that performs:

  1. doctor initialization in a temporary data root;
  2. confirmed teacher profile creation;
  3. returning-session identity status and historical suggestion;
  4. fixture-backed exploratory retrieval;
  5. normalized/deduplicated corpus with bilingual statuses;
  6. topic scan work files;
  7. teacher-confirmed topic fixture;
  8. focused retrieval and verification;
  9. evidence matrix and claim-ledger validation;
  10. long-form review contract validation;
  11. proposal mapping blocked because no verified school template exists.

- [ ] Assert the final readiness state has literature review `ready（已就绪）`, proposal mapping `blocked（暂时阻断）`, and output permission `stage_artifact_ready（可生成阶段产物）`.

- [ ] Add negative paths for temporary session isolation, one public source failing, unresolved Chinese literature retention, and a claim that exceeds abstract evidence.

- [ ] Run the end-to-end test.

Run: `node --test skills/research-proposal-coach/tests/end-to-end-workflow.test.mjs`

Expected: PASS without external network access.

- [ ] Give an independent evaluator only the installed Skill copy, temporary local data, and realistic teacher prompts for first use, returning use, temporary use, low-coverage literature search, and proposal compression without a verified template. Do not provide expected answers. Record the produced artifacts and any failure/rationalization, refine the minimum necessary instructions, and repeat until behavior and artifacts satisfy the acceptance contracts.

- [ ] Commit the acceptance flow.

```bash
git add skills/research-proposal-coach/tests skills/research-proposal-coach/maintenance/eval-case-template.md
git commit -m "test: cover research coach end-to-end workflow"
```

## Task 6: Run Full Verification And Prepare The Release Commit

**Files:**

- Modify: `skills/research-proposal-coach/maintenance/update-log.md`
- Modify: `docs/superpowers/specs/2026-10-25-profile-memory-literature-review-design.md`

- [ ] Update the design's installation section to record the final decision: standard Trae/skills CLI install plus first-use local initialization, with no custom installer and no post-install code execution.

- [ ] Record implemented schemas, adapter versions, migration behavior, and known public-source limitations in the update log.

- [ ] Run the package validator.

Run: `node skills/research-proposal-coach/scripts/validate-package.mjs`

Expected: PASS.

- [ ] Run all Skill and demo tests.

Run: `node --test skills/research-proposal-coach/tests/*.test.mjs demo/tests/*.test.mjs`

Expected: PASS.

- [ ] Run the existing baseline suite explicitly.

Run: `node --test demo/tests/*.test.mjs`

Expected: all migrated demo tests pass.

- [ ] Run whitespace and repository checks.

Run: `git diff --check`

Expected: no output.

Run: `git status --short`

Expected: only intended project files; no user profile, API response, test temporary directory, credentials, or unrelated main-worktree changes.

- [ ] Run the opt-in live public-source smoke test when network access is available.

Run: `node skills/research-proposal-coach/scripts/smoke-public-sources.mjs`

Expected: separate current reachability results for OpenAlex and Crossref. A partial failure is recorded as a warning, not hidden.

- [ ] Commit final integration documentation.

```bash
git add docs/superpowers/specs/2026-10-25-profile-memory-literature-review-design.md skills/research-proposal-coach/maintenance/update-log.md
git commit -m "docs: finalize Trae delivery architecture"
```

## Task 7: Manual Trae CN Release Acceptance

**Files:** None expected; record discovered fixes in the appropriate prior task.

- [ ] Merge/publish the implementation to the default branch of `Jhachr/school_prj` before testing the customer command. Confirm intended customers can authenticate if the repository is private.

- [ ] On a clean Trae CN test profile with Node.js 22.20+, run exactly:

```bash
npx skills add Jhachr/school_prj --skill research-proposal-coach -g -a trae-cn -y
```

Expected: the Skill appears at the Trae CN global Skill path with scripts, rules, modules, and templates intact.

- [ ] Start a new Trae conversation and request research topic help.

Expected: first-use doctor initializes local directories, explains storage, requests consent, and does not create a teacher profile before confirmation.

- [ ] Start a second conversation after confirming a test teacher profile.

Expected: Trae asks whether to continue as that teacher, summarizes proposed historical reuse, and offers a temporary session.

- [ ] Exercise a fixture or low-volume real public search.

Expected: saved run directory, raw source records, normalized corpus, bilingual statuses, coverage statement, and no fabricated references.

- [ ] Update the Skill with:

```bash
npx skills update research-proposal-coach -g -y
```

Expected: packaged files update; the test teacher profile and literature artifacts remain unchanged.

- [ ] Remove the Skill with:

```bash
npx skills remove research-proposal-coach -g -a trae-cn -y
```

Expected: the Skill is removed; personal data remains and the guide explains how to delete it separately.

## Completion Criteria

- A teacher installs the whole capability in Trae CN with one standard CLI command.
- First use initializes data safely and asks for consent before creating a profile.
- No custom service, database, MCP server, package manager dependency inside the Skill, or hidden post-install hook is required.
- Update and uninstall operations do not overwrite or silently delete teacher data.
- Offline tests cover the full workflow; a separate live smoke test covers current public-source connectivity.
- Documentation clearly distinguishes installation success, local-data readiness, and external-source availability.
