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

  session = recordSource(session, {
    sourceId: "S1",
    sourceStatus: "user_confirmed",
    title: "Teacher facts",
  });
  session = recordClaim(session, {
    claimId: "C1",
    claim: "Confirmed problem.",
    sourceIds: ["S1"],
    sourceStatus: "user_confirmed",
  });
  session = recordDecision(session, {
    decisionId: "D1",
    state: "topic_confirmation",
    decision: "Confirmed topic.",
    confirmedByUser: true,
  });
  session = recordArtifact(session, {
    artifactId: "A1",
    artifactType: "proposal_mapping",
    sourceClaimIds: ["C1"],
    qualityGrade: "A",
  });
  session = updateDialogueHealth(session, {
    status: "green",
    signals: [],
    intervention: "continue",
  });
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
