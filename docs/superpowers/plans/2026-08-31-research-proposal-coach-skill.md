# Research Proposal Coach Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first repository-local `research-proposal-coach` Skill package for guiding vocational-college teachers through research proposal planning.

**Architecture:** The Skill entrypoint stays small and routes to maintained Markdown contracts. Stable rules live in `rules/`, per-stage coaching behavior lives in `modules/`, reusable output structures live in `templates/`, and evaluation/maintenance artifacts live in `examples/` and `maintenance/`.

**Tech Stack:** Codex Skill Markdown, YAML metadata, existing demo Node tests, skill-creator validation scripts.

---

### Task 1: Create Skill Package Skeleton

**Files:**
- Modify: `skills/research-proposal-coach/SKILL.md`
- Modify: `skills/research-proposal-coach/agents/openai.yaml`
- Create: `skills/research-proposal-coach/rules/stage-contract.md`
- Create: `skills/research-proposal-coach/rules/quality-rubric.md`
- Create: `skills/research-proposal-coach/rules/source-policy.md`
- Create: `skills/research-proposal-coach/rules/guidance-principles.md`
- Create: `skills/research-proposal-coach/rules/reviewer-standards.md`

- [x] **Step 1: Initialize with skill-creator**

Run:

```bash
python3 /Users/jhachr/.codex/skills/.system/skill-creator/scripts/init_skill.py research-proposal-coach --path /Users/jhachr/ai_project/school_prj/skills --resources references
```

Expected: `SKILL.md` and `agents/openai.yaml` are created.

- [x] **Step 2: Replace scaffold content**

Write a discriminating description and route to the rule/module/template files. Remove all scaffold placeholders.

- [x] **Step 3: Add stable rule contracts**

Create `stage-contract`, `quality-rubric`, `source-policy`, `guidance-principles`, and `reviewer-standards` from the approved technical plan and 0820 meeting summary.

### Task 2: Add Coaching Modules And Output Templates

**Files:**
- Create: `skills/research-proposal-coach/modules/teacher-profile.md`
- Create: `skills/research-proposal-coach/modules/topic-discovery.md`
- Create: `skills/research-proposal-coach/modules/literature-review.md`
- Create: `skills/research-proposal-coach/modules/research-question.md`
- Create: `skills/research-proposal-coach/modules/method-outcome-design.md`
- Create: `skills/research-proposal-coach/modules/innovation-design.md`
- Create: `skills/research-proposal-coach/modules/proposal-mapping.md`
- Create: `skills/research-proposal-coach/modules/learning-feedback.md`
- Create: `skills/research-proposal-coach/templates/topic-card.md`
- Create: `skills/research-proposal-coach/templates/literature-review-longform.md`
- Create: `skills/research-proposal-coach/templates/literature-review-proposal-section.md`
- Create: `skills/research-proposal-coach/templates/proposal-field-mapping.md`
- Create: `skills/research-proposal-coach/templates/missing-items.md`
- Create: `skills/research-proposal-coach/templates/quality-report.md`

- [x] **Step 1: Write module playbooks**

Each module must include purpose, required inputs, coaching loop, pass conditions, outputs, and fallback behavior.

- [x] **Step 2: Write output templates**

Each template must include source status, missing fields, and review notes so generated material remains traceable.

### Task 3: Add Evaluation And Maintenance Assets

**Files:**
- Create: `skills/research-proposal-coach/examples/live-commerce-b-grade.md`
- Create: `skills/research-proposal-coach/maintenance/material-ingestion-guide.md`
- Create: `skills/research-proposal-coach/maintenance/update-log.md`
- Create: `skills/research-proposal-coach/maintenance/eval-case-template.md`
- Modify: `README.md`

- [x] **Step 1: Add B-grade reference example**

Use the existing live-commerce demo as a compact regression case that demonstrates B-grade output and source labeling.

- [x] **Step 2: Add maintenance guidance**

Create files that let a non-technical owner update school materials, record rule changes, and add evaluation cases.

- [x] **Step 3: Update repository README**

Reflect that `skills/` now contains the first Skill package rather than an empty future directory.

### Task 4: Validate

**Files:**
- Validate: `skills/research-proposal-coach/`
- Validate: `demo/tests/*.test.mjs`

- [x] **Step 1: Run skill validator**

Run:

```bash
python3 /Users/jhachr/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/jhachr/ai_project/school_prj/skills/research-proposal-coach
```

Expected: no placeholder or frontmatter failures.

- [x] **Step 2: Run existing demo tests**

Run:

```bash
node --test demo/tests/*.test.mjs
```

Expected: existing 18 tests pass.
