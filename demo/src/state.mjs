export const SOURCE_TYPES = Object.freeze([
  "user_confirmed",
  "ai_suggestion",
  "material_verified",
  "demo_fixture",
  "missing",
]);

export const CUSTOMER_STAGES = Object.freeze([
  "教师画像采集",
  "空泛意图纠偏",
  "工作问题挖掘",
  "课题方向推荐与确认",
  "研究问题澄清",
  "文献与政策支撑",
  "方法与成果设计",
  "申报材料生成与质检",
]);

export const INTERNAL_STATES = Object.freeze([
  { id: "teacher_profile", stage: "教师画像采集" },
  { id: "intent_refinement", stage: "空泛意图纠偏" },
  { id: "problem_discovery", stage: "工作问题挖掘" },
  { id: "topic_recommendation", stage: "课题方向推荐与确认" },
  { id: "topic_confirmation", stage: "课题方向推荐与确认" },
  { id: "research_question", stage: "研究问题澄清" },
  { id: "evidence_support", stage: "文献与政策支撑" },
  { id: "method_and_outcomes", stage: "方法与成果设计" },
  { id: "proposal_mapping", stage: "申报材料生成与质检" },
  { id: "quality_checking", stage: "申报材料生成与质检" },
]);

export const ALLOWED_OUTPUTS = Object.freeze({
  B: [
    "topic_card",
    "literature_review_draft",
    "proposal_mapping",
    "missing_items",
    "quality_report",
  ],
  A: [
    "topic_card",
    "literature_review_draft",
    "proposal_mapping",
    "missing_items",
    "quality_report",
    "proposal_draft",
  ],
});

export const SOURCE_LABELS = Object.freeze({
  user_confirmed: "用户确认",
  ai_suggestion: "AI建议",
  material_verified: "真实材料",
  demo_fixture: "演示数据",
  missing: "缺失",
});

function isVerified(sourceType) {
  return sourceType === "material_verified";
}

export function evaluateGrade(input = {}) {
  const cReasons = [];

  if (!input.teacherProfileConfirmed) {
    cReasons.push("教师画像尚未确认");
  }
  if (!input.realProblemConfirmed) {
    cReasons.push("真实工作问题尚未建立");
  }
  if (!input.topicConfirmed) {
    cReasons.push("课题方向尚未确认");
  }
  if (!input.researchQuestionConfirmed) {
    cReasons.push("研究对象、场景或研究问题尚未确认");
  }

  if (cReasons.length > 0) {
    return {
      grade: "C",
      label: "C：继续追问",
      allowedOutputs: [],
      reasons: cReasons,
      nextAction: "继续追问课程、对象、真实问题和课题方向，不生成申报材料。",
    };
  }

  const bReasons = [];

  if (!input.methodExecutable) {
    bReasons.push("方法路径或数据来源仍需细化");
  }
  if (!input.nonPaperOutcomeConfirmed) {
    bReasons.push("非论文成果尚未确认");
  }
  if (!isVerified(input.guideSource)) {
    bReasons.push("真实申报指南尚未接入");
  }
  if (!isVerified(input.literatureSource)) {
    bReasons.push("真实文献检索结果尚未接入");
  }
  if (!isVerified(input.templateSource)) {
    bReasons.push("真实申报模板尚未接入");
  }

  if (bReasons.length > 0) {
    return {
      grade: "B",
      label: "B：可生成阶段性材料",
      allowedOutputs: [...ALLOWED_OUTPUTS.B],
      reasons: bReasons,
      nextAction: "生成方案卡、字段映射稿、待补充清单和质量结果，不生成正式申报书草稿。",
    };
  }

  return {
    grade: "A",
    label: "A：可生成结构化内容草稿",
    allowedOutputs: [...ALLOWED_OUTPUTS.A],
    reasons: ["核心字段、可执行方法、非论文成果、真实指南、真实文献和真实模板均已确认。"],
    nextAction: "可生成申报书结构化内容草稿，仍需人工和专家审核。",
  };
}

export function deriveProgress(currentStateId) {
  const currentIndex = Math.max(
    0,
    INTERNAL_STATES.findIndex((state) => state.id === currentStateId),
  );

  return INTERNAL_STATES.map((state, index) => ({
    ...state,
    status:
      index < currentIndex
        ? "completed"
        : index === currentIndex
          ? "active"
          : "pending",
  }));
}
