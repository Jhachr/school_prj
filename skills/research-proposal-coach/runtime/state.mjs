export const SOURCE_STATUSES = Object.freeze([
  "user_confirmed",
  "ai_suggestion",
  "material_verified",
  "retrieved_evidence",
  "demo_fixture",
  "missing",
]);

export const INTERNAL_STATES = Object.freeze([
  "teacher_profile",
  "intent_refinement",
  "problem_discovery",
  "topic_recommendation",
  "topic_confirmation",
  "research_question",
  "evidence_support",
  "method_and_outcomes",
  "proposal_mapping",
  "quality_checking",
]);

export const ALLOWED_OUTPUTS = Object.freeze({
  B: Object.freeze([
    "topic_card",
    "literature_review_draft",
    "problem_method_outcome_table",
    "proposal_mapping",
    "missing_items",
    "quality_report",
    "learning_feedback",
  ]),
  A: Object.freeze([
    "topic_card",
    "literature_review_draft",
    "problem_method_outcome_table",
    "proposal_mapping",
    "missing_items",
    "quality_report",
    "learning_feedback",
    "proposal_draft",
  ]),
});

const DEFAULT_CONFIRMATIONS = Object.freeze({
  teacherProfile: false,
  realProblem: false,
  topic: false,
  researchQuestion: false,
  methodExecutable: false,
  nonPaperOutcome: false,
});

const DEFAULT_SOURCE_STATUS = Object.freeze({
  guide: "missing",
  literature: "missing",
  template: "missing",
});

export function createSession({
  sessionId,
  currentState = "teacher_profile",
  collaborationMode = "explore",
  rawIntent = "",
  confirmations = {},
  sourceStatus = {},
} = {}) {
  const normalizedSessionId = sessionId ?? "session-local";

  return {
    session_id: normalizedSessionId,
    current_state: normalizeState(currentState),
    collaboration_mode: collaborationMode,
    raw_intent: rawIntent,
    confirmations: {
      ...DEFAULT_CONFIRMATIONS,
      ...confirmations,
    },
    source_status: {
      ...DEFAULT_SOURCE_STATUS,
      ...sourceStatus,
    },
    material_passport: createMaterialPassport({
      sessionId: normalizedSessionId,
      currentState,
      collaborationMode,
    }),
    dialogue_health: {
      status: "green",
      signals: [],
      last_intervention: "",
    },
  };
}

export function recordSource(session, source) {
  const nextSource = {
    source_id: source.sourceId,
    source_status: normalizeSourceStatus(source.sourceStatus),
    title: source.title ?? "",
    date: source.date ?? "",
    notes: source.notes ?? "",
  };

  return updatePassport(session, {
    source_ledger: upsertById(
      session.material_passport.source_ledger,
      "source_id",
      nextSource,
    ),
  });
}

export function recordClaim(session, claim) {
  const nextClaim = {
    claim_id: claim.claimId,
    claim: claim.claim ?? "",
    source_ids: claim.sourceIds ?? [],
    source_status: normalizeSourceStatus(claim.sourceStatus),
    risk: claim.risk ?? "medium",
  };

  return updatePassport(session, {
    claim_ledger: upsertById(
      session.material_passport.claim_ledger,
      "claim_id",
      nextClaim,
    ),
  });
}

export function recordDecision(session, decision) {
  const nextDecision = {
    decision_id: decision.decisionId,
    state: normalizeState(decision.state ?? session.current_state),
    decision: decision.decision ?? "",
    confirmed_by_user: Boolean(decision.confirmedByUser),
    notes: decision.notes ?? "",
  };

  const confirmedSourceIds = new Set(decision.confirmsSourceIds ?? []);
  const invalidatedClaimIds = new Set(decision.invalidatesClaimIds ?? []);
  const sourceLedger = session.material_passport.source_ledger.map((source) =>
    confirmedSourceIds.has(source.source_id) &&
    source.source_status === "ai_suggestion"
      ? { ...source, source_status: "user_confirmed" }
      : source,
  );
  const artifactLedger = session.material_passport.artifact_ledger.map((artifact) =>
    artifact.source_claim_ids.some((claimId) => invalidatedClaimIds.has(claimId))
      ? { ...artifact, status: "stale" }
      : artifact,
  );

  return updatePassport(session, {
    source_ledger: sourceLedger,
    artifact_ledger: artifactLedger,
    decision_ledger: upsertById(
      session.material_passport.decision_ledger,
      "decision_id",
      nextDecision,
    ),
  });
}

export function recordArtifact(session, artifact) {
  const nextArtifact = {
    artifact_id: artifact.artifactId,
    artifact_type: artifact.artifactType,
    version: artifact.version ?? "v1",
    source_claim_ids: artifact.sourceClaimIds ?? [],
    quality_grade: artifact.qualityGrade ?? session.quality_grade ?? "C",
    status: artifact.status ?? "current",
  };

  return updatePassport(session, {
    artifact_ledger: upsertById(
      session.material_passport.artifact_ledger,
      "artifact_id",
      nextArtifact,
    ),
  });
}

export function updateDialogueHealth(session, input = {}) {
  const signals = new Set(input.signals ?? []);

  if (input.teacherAcceptedWithoutEvidence) {
    signals.add("user_passivity");
  }
  if (input.prematureConvergence) {
    signals.add("premature_convergence");
  }
  if (input.questionFatigue) {
    signals.add("question_fatigue");
  }
  if (input.sourceSlippage) {
    signals.add("source_slippage");
  }
  if (input.overproduction) {
    signals.add("overproduction");
  }

  const nextSignals = [...signals];
  const status =
    input.status ??
    (nextSignals.includes("source_slippage") || nextSignals.includes("overproduction")
      ? "red"
      : nextSignals.length > 0
        ? "yellow"
        : "green");

  const dialogueHealth = {
    status,
    signals: nextSignals,
    last_intervention: input.intervention ?? defaultHealthIntervention(status),
  };

  const healthEntry = {
    state: session.current_state,
    status: dialogueHealth.status,
    signals: dialogueHealth.signals,
    intervention: dialogueHealth.last_intervention,
  };

  return updatePassport(
    {
      ...session,
      dialogue_health: dialogueHealth,
    },
    {
      health_ledger: [...session.material_passport.health_ledger, healthEntry],
    },
  );
}

export function evaluateQuality(session) {
  const cReasons = [];

  if (!session.confirmations.teacherProfile) {
    cReasons.push("教师画像尚未确认");
  }
  if (!session.confirmations.realProblem) {
    cReasons.push("真实工作问题尚未建立");
  }
  if (!session.confirmations.topic) {
    cReasons.push("课题方向尚未确认");
  }
  if (!session.confirmations.researchQuestion) {
    cReasons.push("研究对象、场景或研究问题尚未确认");
  }

  if (cReasons.length > 0) {
    return withQualityLedger(session, {
      grade: "C",
      allowed_outputs: [],
      reasons: cReasons,
      module_status: "blocked",
      next_action: "继续追问核心事实，不生成申报材料。",
    });
  }

  const bReasons = [];

  if (!session.confirmations.methodExecutable) {
    bReasons.push("方法路径或数据来源仍需细化");
  }
  if (!session.confirmations.nonPaperOutcome) {
    bReasons.push("非论文成果尚未确认");
  }
  if (session.source_status.guide !== "material_verified") {
    bReasons.push("真实申报指南尚未接入");
  }
  if (!["material_verified", "retrieved_evidence"].includes(session.source_status.literature)) {
    bReasons.push("真实文献检索结果尚未接入");
  }
  if (session.source_status.template !== "material_verified") {
    bReasons.push("真实申报模板尚未接入");
  }
  if (!passportHasRequiredLedgers(session)) {
    bReasons.push("Material Passport 尚未记录完整的来源、主张、决策、产物、质量和健康信息");
  }
  if (session.dialogue_health.status === "red") {
    bReasons.push("对话健康度为 red，需先修复来源、确认或过度生成问题");
  }

  if (bReasons.length > 0) {
    return withQualityLedger(session, {
      grade: "B",
      allowed_outputs: [...ALLOWED_OUTPUTS.B],
      reasons: bReasons,
      module_status: "needs_revision",
      next_action: "生成阶段性材料和缺口清单，不生成正式申报书草稿。",
    });
  }

  return withQualityLedger(session, {
    grade: "A",
    allowed_outputs: [...ALLOWED_OUTPUTS.A],
    reasons: ["核心字段、真实材料、护照记录和对话健康度均满足结构化内容草稿条件。"],
    module_status: "pass",
    next_action: "可生成申报书结构化内容草稿，仍需人工和专家审核。",
  });
}

function createMaterialPassport({ sessionId, currentState, collaborationMode }) {
  return {
    passport_id: `${sessionId}-passport`,
    session_id: sessionId,
    current_state: normalizeState(currentState),
    collaboration_mode: collaborationMode,
    source_ledger: [],
    claim_ledger: [],
    decision_ledger: [],
    artifact_ledger: [],
    quality_ledger: [],
    health_ledger: [],
  };
}

function updatePassport(session, passportPatch) {
  return {
    ...session,
    material_passport: {
      ...session.material_passport,
      current_state: session.current_state,
      collaboration_mode: session.collaboration_mode,
      ...passportPatch,
    },
  };
}

function withQualityLedger(session, quality) {
  const qualityEntry = {
    state: session.current_state,
    grade: quality.grade,
    module_status: quality.module_status,
    blockers: quality.reasons,
    next_actions: [quality.next_action],
  };

  return {
    ...quality,
    session: updatePassport(session, {
      quality_ledger: [...session.material_passport.quality_ledger, qualityEntry],
    }),
  };
}

function passportHasRequiredLedgers(session) {
  const passport = session.material_passport;

  return (
    passport.source_ledger.length > 0 &&
    passport.claim_ledger.length > 0 &&
    passport.decision_ledger.length > 0 &&
    passport.artifact_ledger.length > 0 &&
    passport.health_ledger.length > 0
  );
}

function upsertById(items, idKey, nextItem) {
  const existingIndex = items.findIndex((item) => item[idKey] === nextItem[idKey]);

  if (existingIndex === -1) {
    return [...items, nextItem];
  }

  return items.map((item, index) => (index === existingIndex ? nextItem : item));
}

function normalizeState(state) {
  return INTERNAL_STATES.includes(state) ? state : "teacher_profile";
}

function normalizeSourceStatus(status) {
  return SOURCE_STATUSES.includes(status) ? status : "missing";
}

function defaultHealthIntervention(status) {
  if (status === "red") {
    return "stop generation and repair the weakest upstream state";
  }
  if (status === "yellow") {
    return "ask one concrete confirmation question";
  }
  return "continue";
}
