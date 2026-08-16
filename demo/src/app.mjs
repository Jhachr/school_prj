import { CUSTOMER_STAGES, deriveProgress, SOURCE_LABELS } from "./state.mjs";
import { liveCommerceFixture } from "./fixtures.mjs";
import { buildStepSnapshot } from "./outputs.mjs";

const fixture = liveCommerceFixture;

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

function renderStatusTab() {
  const snapshot = currentSnapshot();
  const progress = deriveProgress(currentStep().stateId);
  return `
    <div class="content-section">
      <div class="output-block">
        <h3>当前结论</h3>
        <p>${snapshot.quality.label}。${snapshot.quality.nextAction}</p>
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
  const facts = currentSnapshot().confirmedFacts;
  if (facts.length === 0) {
    return `<div class="output-block"><h3>暂无已确认字段</h3><p>继续推进对话后，这里会逐步显示用户确认和真实材料来源。</p></div>`;
  }
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
  const missingItems = currentSnapshot().outputs.missingItems;
  if (missingItems.length === 0) {
    return `<div class="output-block"><h3>缺口清单尚未生成</h3><p>进入“申报材料生成与质检”后，系统会根据当前质量等级列出需要客户补充的材料。</p></div>`;
  }
  return `
    <div class="content-section">
      ${missingItems
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
  const snapshot = currentSnapshot();
  const outputs = snapshot.outputs;
  if (!outputs.topicCard) {
    return `
      <div class="content-section">
        <div class="output-block">
          <h3>最终产物尚未生成</h3>
          <p>当前质量等级为 ${snapshot.quality.grade}。系统会先解除阻断并收集必要确认，进入“申报材料生成与质检”后再展示方案卡和字段映射稿。</p>
        </div>
        <div class="output-block">
          <h3>当前允许产出</h3>
          <p>${snapshot.quality.allowedOutputs.length === 0 ? "暂无。继续追问，不生成申报材料。" : snapshot.quality.allowedOutputs.join(" / ")}</p>
        </div>
      </div>
    `;
  }
  return `
    <div class="content-section">
      <div class="output-block">
        <h3>课题方案卡 ${sourceBadge(outputs.topicCard.title.sourceType)}</h3>
        <p><strong>${outputs.topicCard.title.value}</strong></p>
        <p>${outputs.topicCard.researchQuestion.value}</p>
      </div>
      <div class="output-block">
        <h3>${outputs.literatureReviewDraft.title} ${sourceBadge(outputs.literatureReviewDraft.sourceType)}</h3>
        <p>${outputs.literatureReviewDraft.sourceLabel}</p>
        <ul>
          ${outputs.literatureReviewDraft.sections
            .map((section) => `<li><strong>${section.heading}：</strong>${section.content}</li>`)
            .join("")}
        </ul>
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
