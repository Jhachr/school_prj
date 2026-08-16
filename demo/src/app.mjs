import { CUSTOMER_STAGES, SOURCE_LABELS } from "./state.mjs";
import { liveCommerceFixture } from "./fixtures.mjs";
import { buildStepSnapshot } from "./outputs.mjs";

const fixture = liveCommerceFixture;

let stepIndex = 0;

const stageRail = document.querySelector("#stageRail");
const conversationLog = document.querySelector("#conversationLog");
const gradeBadge = document.querySelector("#gradeBadge");
const prevButton = document.querySelector("#prevButton");
const nextButton = document.querySelector("#nextButton");
const resetButton = document.querySelector("#resetButton");
const guideContent = document.querySelector("#guideContent");

const STEP_GUIDES = Object.freeze({
  teacher_profile: {
    question: "老师是谁、教什么课、真实工作场景在哪里。",
    why: "如果没有教师画像，系统只能泛泛聊天，无法判断课题是否贴合专业建设和课程实践。",
    outcome: "形成网络营销与直播电商专业教师画像，并锁定课程场景。",
    next: "继续把“AI+教育”从口号收敛到具体教学问题。",
  },
  intent_refinement: {
    question: "为什么不能直接帮老师写“AI+教育”。",
    why: "客户需要看到系统会阻断空泛题目，先追问课程、学生、教学环节和数据来源。",
    outcome: "确认当前仍是 C 级，只允许继续追问，不生成申报材料。",
    next: "进入真实工作问题挖掘，找到老师真正想解决的教学痛点。",
  },
  problem_discovery: {
    question: "老师日常困扰是否能变成研究问题。",
    why: "系统要区分“想用 AI”和“课程实训真实问题”，避免课题中心跑偏。",
    outcome: "学生直播任务全流程能力不足开始成为可研究问题。",
    next: "在客户认可的问题基础上推荐 2-3 个可申报方向。",
  },
  topic_recommendation: {
    question: "系统如何推荐课题方向，而不是只生成一个题目。",
    why: "推荐要结合教师画像、真实问题、申报导向和前沿研究，让客户看到判断依据。",
    outcome: "给出岗位任务导向实训改革、数据复盘评价体系、AI 辅助脚本诊断三个方向。",
    next: "请老师选择方向，并把方向改写为可研究问题。",
  },
  topic_confirmation: {
    question: "课题方向必须由老师确认。",
    why: "方向推荐是 AI 建议，只有老师确认后，系统才能把它作为后续研究问题和申报材料依据。",
    outcome: "老师选择“岗位任务导向实训改革”，并确认它来自真实课程问题。",
    next: "把方向转成有对象、场景、方法和评价方式的研究问题。",
  },
  research_question: {
    question: "课题名称不等于研究问题。",
    why: "客户要看到系统不是润色标题，而是在帮助老师说清楚研究对象、教学场景和评价方式。",
    outcome: "形成围绕直播策划、执行、复盘全流程能力的核心研究问题。",
    next: "引入政策、指南和文献前沿，说明这个课题为什么值得做。",
  },
  evidence_support: {
    question: "文献与政策如何影响选题判断。",
    why: "客户明确需要文献检索和综述草稿，Demo 要展示前沿研究会进入课题推荐和研究现状判断。",
    outcome: "用申报导向和文献线索说明课题切入点，正式版本会替换为客户学校指南和真实检索结果。",
    next: "确认可执行方法、数据来源和非论文成果。",
  },
  method_and_outcomes: {
    question: "课题能不能实施、能不能结题。",
    why: "小白老师常只有想法，系统要继续追问试点课程、数据、样本和可复用成果。",
    outcome: "形成任务包、评价量表、复盘模板和案例库等非论文成果。",
    next: "进入材料生成与质检，展示阶段性成果包和待补充项。",
  },
  quality_checking: {
    question: "当前能交付什么，为什么还不能生成正式申报书。",
    why: "客户需要看到质量门槛：系统可以先生成阶段性材料，但学校指南、真实文献和申报模板缺失时，不能直接包装成正式申报书。",
    outcome: "生成课题方案卡、文献综述草稿、字段映射稿、待补充清单和质量结果。",
    next: "请客户确认流程、阶段产物和下一版真实材料清单。",
  },
});

function sourceBadge(type) {
  return `<span class="source-badge ${type}">${SOURCE_LABELS[type] ?? type}</span>`;
}

function currentStep() {
  return fixture.dialogueSteps[stepIndex];
}

function visibleSteps() {
  return fixture.dialogueSteps.slice(0, stepIndex + 1);
}

function currentSnapshot() {
  return buildStepSnapshot(fixture, stepIndex);
}

function renderStageRail() {
  const activeStage = currentStep().stage;
  const activeStageIndex = CUSTOMER_STAGES.indexOf(activeStage);

  stageRail.innerHTML = CUSTOMER_STAGES.map((stage, index) => {
    const className =
      index < activeStageIndex
        ? "stage-item done"
        : index === activeStageIndex
          ? "stage-item active"
          : "stage-item";
    return `<li class="${className}">${index + 1}. ${stage}</li>`;
  }).join("");
}

function renderConversation() {
  conversationLog.innerHTML = visibleSteps()
    .map(
      (step, index) => {
        const grade = buildStepSnapshot(fixture, index).quality.grade;
        return `
        <article class="message ${step.speaker}">
          <div class="message-meta">
            <span>${step.speaker === "teacher" ? "教师" : "助手"}</span>
            <span>${step.stage}</span>
            <span class="grade-badge grade-${grade.toLowerCase()}">${grade}</span>
          </div>
          <p>${step.text}</p>
          <p class="message-meta">${step.note}</p>
        </article>
      `;
      },
    )
    .join("");
  conversationLog.scrollTop = conversationLog.scrollHeight;
}

function renderGrade() {
  const grade = currentSnapshot().quality.grade;
  gradeBadge.textContent = grade;
  gradeBadge.className = `grade-badge grade-${grade.toLowerCase()}`;
}

function renderGuideSummary(snapshot) {
  const step = currentStep();
  const guide = STEP_GUIDES[step.stateId];
  const stageNumber = CUSTOMER_STAGES.indexOf(step.stage) + 1;

  return `
    <section class="guide-section guide-focus">
      <div class="guide-kicker">第 ${stageNumber} 阶段 · ${step.stage}</div>
      <h3>${guide.question}</h3>
      <p>${guide.why}</p>
      <div class="maturity-line">
        <span class="grade-badge grade-${snapshot.quality.grade.toLowerCase()}">${snapshot.quality.grade}</span>
        <span>${snapshot.quality.label}</span>
      </div>
    </section>
  `;
}

function renderProposalMappingPanel(outputs) {
  if (outputs.proposalMapping.length === 0) {
    return `
      <section class="guide-section proposal-mapping-panel">
        <div class="section-title-row">
          <h3>申报书字段映射稿</h3>
          <span class="subtle-pill">字段映射待形成</span>
        </div>
        <p>当前还在追问和确认阶段。等课题方向、研究问题和依据足够明确后，系统会把已确认内容映射到申报书栏目里。</p>
      </section>
    `;
  }

  return `
    <section class="guide-section proposal-mapping-panel">
      <div class="section-title-row">
        <h3>申报书字段映射稿</h3>
        <span class="subtle-pill">${outputs.proposalMapping.length} 个栏目</span>
      </div>
      <p>下面展示的是系统如何把对话中已经确认的信息，放入通用申报书栏目。学校模板接入后，栏目名称和顺序会按真实模板替换。</p>
      <div class="mapping-list">
        ${outputs.proposalMapping.map(renderMappingRow).join("")}
      </div>
    </section>
  `;
}

function renderMappingRow(item) {
  return `
    <article class="mapping-row">
      <div class="mapping-row-head">
        <strong>${item.field}</strong>
        <span>${item.status}</span>
      </div>
      <p>${item.content}</p>
      <div class="mapping-source">来源：${sourceBadge(item.sourceType)}</div>
    </article>
  `;
}

function renderGuidePanel() {
  const snapshot = currentSnapshot();
  guideContent.innerHTML = `
    ${renderGuideSummary(snapshot)}
    ${renderProposalMappingPanel(snapshot.outputs)}
  `;
}

function renderControls() {
  prevButton.disabled = stepIndex === 0;
  nextButton.disabled = stepIndex === fixture.dialogueSteps.length - 1;
}

function render() {
  renderStageRail();
  renderConversation();
  renderGrade();
  renderGuidePanel();
  renderControls();
}

prevButton.addEventListener("click", () => {
  stepIndex = Math.max(0, stepIndex - 1);
  render();
});

nextButton.addEventListener("click", () => {
  stepIndex = Math.min(fixture.dialogueSteps.length - 1, stepIndex + 1);
  render();
});

resetButton.addEventListener("click", () => {
  stepIndex = 0;
  render();
});

render();
