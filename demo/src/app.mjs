import { CUSTOMER_STAGES, deriveProgress, SOURCE_LABELS } from "./state.mjs";
import { liveCommerceFixture } from "./fixtures.mjs";
import { buildDemoOutputs } from "./outputs.mjs";

const fixture = liveCommerceFixture;
const outputs = buildDemoOutputs(fixture);

let stepIndex = 0;
let activeTab = "status";

const stageRail = document.querySelector("#stageRail");
const conversationLog = document.querySelector("#conversationLog");
const gradeBadge = document.querySelector("#gradeBadge");
const prevButton = document.querySelector("#prevButton");
const nextButton = document.querySelector("#nextButton");
const resetButton = document.querySelector("#resetButton");
const tabContent = document.querySelector("#tabContent");
const tabButtons = [...document.querySelectorAll(".tab")];

function sourceBadge(type) {
  return `<span class="source-badge ${type}">${SOURCE_LABELS[type] ?? type}</span>`;
}

function currentStep() {
  return fixture.dialogueSteps[stepIndex];
}

function visibleSteps() {
  return fixture.dialogueSteps.slice(0, stepIndex + 1);
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
      (step) => `
        <article class="message ${step.speaker}">
          <div class="message-meta">
            <span>${step.speaker === "teacher" ? "教师" : "助手"}</span>
            <span>${step.stage}</span>
            <span class="grade-badge grade-${step.status.toLowerCase()}">${step.status}</span>
          </div>
          <p>${step.text}</p>
          <p class="message-meta">${step.note}</p>
        </article>
      `,
    )
    .join("");
  conversationLog.scrollTop = conversationLog.scrollHeight;
}

function renderGrade() {
  const grade = currentStep().status;
  gradeBadge.textContent = grade;
  gradeBadge.className = `grade-badge grade-${grade.toLowerCase()}`;
}

function renderStatusTab() {
  const progress = deriveProgress(stepIndex, fixture.dialogueSteps.length);
  return `
    <div class="content-section">
      <div class="output-block">
        <h3>当前结论</h3>
        <p>${outputs.quality.label}。${outputs.quality.nextAction}</p>
      </div>
      <table class="state-list">
        <thead>
          <tr><th>内部状态</th><th>客户阶段</th><th>状态</th></tr>
        </thead>
        <tbody>
          ${progress
            .map(
              (item) => `
                <tr>
                  <td>${item.id}</td>
                  <td>${item.stage}</td>
                  <td><span class="state-pill ${item.status}">${item.status}</span></td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderConfirmedTab() {
  const facts = [
    outputs.topicCard.teacher,
    outputs.topicCard.courses,
    outputs.topicCard.realProblem,
    outputs.topicCard.researchQuestion,
    outputs.topicCard.officialMajor,
    outputs.topicCard.officialPractice,
  ];
  return `
    <div class="info-grid">
      ${facts
        .map(
          (fact) => `
            <div class="info-row">
              <strong>${fact.label} ${sourceBadge(fact.sourceType)}</strong>
              <p>${fact.value}</p>
              <p>${fact.sourceLabel}</p>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderMissingTab() {
  return `
    <div class="content-section">
      ${outputs.missingItems
        .map(
          (item) => `
            <div class="output-block">
              <h3>${item.item} ${sourceBadge(item.sourceType)}</h3>
              <p>用途：${item.why}</p>
              <p>负责人：${item.owner}</p>
              <p>节点：${item.milestone}</p>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderOutputsTab() {
  return `
    <div class="content-section">
      <div class="output-block">
        <h3>课题方案卡 ${sourceBadge(outputs.topicCard.title.sourceType)}</h3>
        <p><strong>${outputs.topicCard.title.value}</strong></p>
        <p>${outputs.topicCard.researchQuestion.value}</p>
      </div>
      <div class="output-block">
        <h3>申报书字段映射稿</h3>
        <table class="mapping-table">
          <thead>
            <tr><th>栏目</th><th>当前内容</th><th>来源</th><th>状态</th></tr>
          </thead>
          <tbody>
            ${outputs.proposalMapping
              .map(
                (item) => `
                  <tr>
                    <td>${item.field}</td>
                    <td>${item.content}</td>
                    <td>${sourceBadge(item.sourceType)}</td>
                    <td>${item.status}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="output-block">
        <h3>质量结果</h3>
        <p>${outputs.quality.label}</p>
        <ul>
          ${outputs.quality.reasons.map((reason) => `<li>${reason}</li>`).join("")}
        </ul>
      </div>
      <div class="output-block">
        <h3>允许产出</h3>
        <ul>
          ${outputs.quality.allowedOutputs
            .map((item) => `<li>${item}</li>`)
            .join("")}
        </ul>
        <p>当前不显示正式申报书下载按钮。</p>
      </div>
    </div>
  `;
}

function renderTab() {
  const renderers = {
    status: renderStatusTab,
    confirmed: renderConfirmedTab,
    missing: renderMissingTab,
    outputs: renderOutputsTab,
  };
  tabContent.innerHTML = renderers[activeTab]();
  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === activeTab);
  });
}

function renderControls() {
  prevButton.disabled = stepIndex === 0;
  nextButton.disabled = stepIndex === fixture.dialogueSteps.length - 1;
}

function render() {
  renderStageRail();
  renderConversation();
  renderGrade();
  renderTab();
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
  activeTab = "status";
  render();
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeTab = button.dataset.tab;
    renderTab();
  });
});

render();
