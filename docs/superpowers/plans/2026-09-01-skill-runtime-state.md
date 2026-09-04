# Skill Runtime State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight runtime inside `skills/research-proposal-coach/` for session state, Material Passport, checkpoints, dialogue health, and A/B/C output gating.

**Architecture:** The runtime is a small JavaScript module that mirrors the Markdown contracts in `rules/`. It has no database, no UI dependency, no literature retrieval dependency, and no dependency on the historical `demo/` directory. Tests live beside the Skill runtime so the package can be validated independently.

**Tech Stack:** Node.js ESM, built-in `node:test`, built-in `node:assert/strict`.

---

### Task 1: Runtime Contract Tests

**Files:**
- Create: `skills/research-proposal-coach/runtime/tests/runtime-state.test.mjs`

- [ ] **Step 1: Write failing tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  createSession,
  evaluateQuality,
  recordArtifact,
  recordClaim,
  recordDecision,
  recordSource,
  updateDialogueHealth,
} from "../state.mjs";

test("creates a session with empty passport ledgers and teacher-owned collaboration mode", () => {
  const session = createSession({ sessionId: "s1" });
  assert.equal(session.session_id, "s1");
  assert.equal(session.current_state, "teacher_profile");
  assert.equal(session.collaboration_mode, "explore");
  assert.deepEqual(session.material_passport.source_ledger, []);
  assert.equal(session.dialogue_health.status, "green");
});

test("records source, claim, decision, and artifact entries in the material passport", () => {
  let session = createSession({ sessionId: "s2" });
  session = recordSource(session, {
    sourceId: "S1",
    sourceStatus: "ai_suggestion",
    title: "AI-assisted topic direction",
  });
  session = recordClaim(session, {
    claimId: "C1",
    claim: "AI can support livestream data review teaching.",
    sourceIds: ["S1"],
    sourceStatus: "ai_suggestion",
  });
  session = recordDecision(session, {
    decisionId: "D1",
    state: "topic_confirmation",
    decision: "Use livestream data review as the topic direction.",
    confirmedByUser: false,
  });
  session = recordArtifact(session, {
    artifactId: "A1",
    artifactType: "topic_card",
    sourceClaimIds: ["C1"],
    qualityGrade: "B",
  });
  assert.equal(session.material_passport.source_ledger.length, 1);
  assert.equal(session.material_passport.claim_ledger[0].source_status, "ai_suggestion");
  assert.equal(session.material_passport.decision_ledger[0].confirmed_by_user, false);
  assert.equal(session.material_passport.artifact_ledger[0].status, "current");
});

test("converts an accepted AI suggestion source into user_confirmed", () => {
  let session = createSession({ sessionId: "s3" });
  session = recordSource(session, {
    sourceId: "S1",
    sourceStatus: "ai_suggestion",
    title: "Selected topic direction",
  });
  session = recordDecision(session, {
    decisionId: "D1",
    state: "topic_confirmation",
    decision: "Teacher accepts the topic direction.",
    confirmedByUser: true,
    confirmsSourceIds: ["S1"],
  });
  assert.equal(session.material_passport.source_ledger[0].source_status, "user_confirmed");
});

test("marks dependent artifacts stale when an upstream decision changes", () => {
  let session = createSession({ sessionId: "s4" });
  session = recordClaim(session, {
    claimId: "C1",
    claim: "Original topic claim.",
    sourceIds: [],
    sourceStatus: "ai_suggestion",
  });
  session = recordArtifact(session, {
    artifactId: "A1",
    artifactType: "topic_card",
    sourceClaimIds: ["C1"],
    qualityGrade: "B",
  });
  session = recordDecision(session, {
    decisionId: "D2",
    state: "topic_confirmation",
    decision: "Teacher changes the topic.",
    confirmedByUser: true,
    invalidatesClaimIds: ["C1"],
  });
  assert.equal(session.material_passport.artifact_ledger[0].status, "stale");
});

test("keeps vague sessions at grade C with no proposal outputs", () => {
  const session = createSession({ sessionId: "s5", rawIntent: "AI+教育" });
  const result = evaluateQuality(session);
  assert.equal(result.grade, "C");
  assert.deepEqual(result.allowed_outputs, []);
  assert.ok(result.reasons.includes("教师画像尚未确认"));
});

test("blocks grade A when literature evidence is missing", () => {
  const result = evaluateQuality(
    createSession({
      sessionId: "s6",
      confirmations: {
        teacherProfile: true,
        realProblem: true,
        topic: true,
        researchQuestion: true,
        methodExecutable: true,
        nonPaperOutcome: true,
      },
      sourceStatus: {
        guide: "material_verified",
        literature: "missing",
        template: "material_verified",
      },
    }),
  );
  assert.equal(result.grade, "B");
  assert.ok(result.reasons.includes("真实文献检索结果尚未接入"));
});

test("allows grade A only with complete confirmations, verified materials, passport records, and non-red health", () => {
  let session = createSession({
    sessionId: "s7",
    confirmations: {
      teacherProfile: true,
      realProblem: true,
      topic: true,
      researchQuestion: true,
      methodExecutable: true,
      nonPaperOutcome: true,
    },
    sourceStatus: {
      guide: "material_verified",
      literature: "retrieved_evidence",
      template: "material_verified",
    },
  });
  session = recordSource(session, { sourceId: "S1", sourceStatus: "user_confirmed", title: "Teacher facts" });
  session = recordClaim(session, { claimId: "C1", claim: "Confirmed problem.", sourceIds: ["S1"], sourceStatus: "user_confirmed" });
  session = recordDecision(session, { decisionId: "D1", state: "topic_confirmation", decision: "Confirmed topic.", confirmedByUser: true });
  session = recordArtifact(session, { artifactId: "A1", artifactType: "proposal_mapping", sourceClaimIds: ["C1"], qualityGrade: "A" });
  session = updateDialogueHealth(session, { status: "green", signals: [], intervention: "continue" });
  const result = evaluateQuality(session);
  assert.equal(result.grade, "A");
  assert.ok(result.allowed_outputs.includes("proposal_draft"));
});

test("turns dialogue health yellow when the teacher passively accepts suggestions", () => {
  const session = updateDialogueHealth(createSession({ sessionId: "s8" }), {
    teacherAcceptedWithoutEvidence: true,
  });
  assert.equal(session.dialogue_health.status, "yellow");
  assert.ok(session.dialogue_health.signals.includes("user_passivity"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test skills/research-proposal-coach/runtime/tests/*.test.mjs`

Expected: failure because `skills/research-proposal-coach/runtime/state.mjs` does not exist yet.

### Task 2: Minimal Runtime State Module

**Files:**
- Create: `skills/research-proposal-coach/runtime/state.mjs`

- [ ] **Step 1: Implement runtime functions**

Create functions and constants required by Task 1. Keep implementation pure and immutable: each update returns a new session object.

- [ ] **Step 2: Run runtime tests**

Run: `node --test skills/research-proposal-coach/runtime/tests/*.test.mjs`

Expected: all runtime tests pass.

### Task 3: Skill Documentation Sync

**Files:**
- Modify: `skills/research-proposal-coach/SKILL.md`
- Modify: `skills/research-proposal-coach/maintenance/update-log.md`

- [ ] **Step 1: Mention runtime contract**

Add `runtime/state.mjs` as the lightweight executable companion for `rules/stage-contract.md`, `rules/material-passport.md`, `rules/dialogue-health.md`, and `rules/quality-rubric.md`.

- [ ] **Step 2: Add update-log row**

Record the P1.5 runtime addition and note that it has no demo dependency.

### Task 4: Verification

**Files:**
- Read only.

- [ ] **Step 1: Validate Skill**

Run: `PYTHONPATH=/Users/jhachr/Library/Python/3.9/lib/python/site-packages python3 /Users/jhachr/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/jhachr/ai_project/school_prj/skills/research-proposal-coach`

Expected: `Skill is valid!`

- [ ] **Step 2: Run runtime tests**

Run: `node --test skills/research-proposal-coach/runtime/tests/*.test.mjs`

Expected: runtime tests pass.

- [ ] **Step 3: Run repository diff check**

Run: `git diff --check`

Expected: no output and exit code 0.
