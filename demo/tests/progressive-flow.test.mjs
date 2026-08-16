import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CUSTOMER_STAGES, evaluateGrade } from "../src/state.mjs";
import { liveCommerceFixture } from "../src/fixtures.mjs";
import { buildStepSnapshot } from "../src/outputs.mjs";

test("Demo 对话阶段按 8 阶段顺序推进且包含方法与成果设计", () => {
  const stageIndexes = liveCommerceFixture.dialogueSteps.map((step) =>
    CUSTOMER_STAGES.indexOf(step.stage),
  );

  assert.ok(stageIndexes.every((index) => index >= 0));
  assert.ok(stageIndexes.every((index, i) => i === 0 || index >= stageIndexes[i - 1]));
  assert.ok(liveCommerceFixture.dialogueSteps.some((step) => step.stage === "方法与成果设计"));
});

test("对话步骤不再使用手写 status，质量等级由评分引擎计算", () => {
  assert.ok(liveCommerceFixture.dialogueSteps.every((step) => !("status" in step)));

  liveCommerceFixture.dialogueSteps.forEach((step, index) => {
    const snapshot = buildStepSnapshot(liveCommerceFixture, index);
    assert.equal(snapshot.quality.grade, evaluateGrade(step.gradeInput).grade);
  });

  const evidenceSteps = liveCommerceFixture.dialogueSteps.filter(
    (step) => step.stage === "文献与政策支撑",
  );
  assert.ok(
    evidenceSteps.every(
      (step) => step.gradeInput.topicConfirmed && step.gradeInput.researchQuestionConfirmed,
    ),
  );
});

test("初始步骤不泄露最终 B 级结论或最终产物", () => {
  const initialSnapshot = buildStepSnapshot(liveCommerceFixture, 0);

  assert.equal(initialSnapshot.quality.grade, "C");
  assert.deepEqual(initialSnapshot.quality.allowedOutputs, []);
  assert.deepEqual(initialSnapshot.outputs.topicCard, null);
  assert.deepEqual(initialSnapshot.outputs.literatureReviewDraft, null);
  assert.deepEqual(initialSnapshot.outputs.proposalMapping, []);
});

test("最终步骤才展示 B 级阶段产物", () => {
  const finalSnapshot = buildStepSnapshot(
    liveCommerceFixture,
    liveCommerceFixture.dialogueSteps.length - 1,
  );

  assert.equal(finalSnapshot.quality.grade, "B");
  assert.deepEqual(finalSnapshot.quality.allowedOutputs, [
    "topic_card",
    "literature_review_draft",
    "proposal_mapping",
    "missing_items",
    "quality_report",
  ]);
  assert.ok(finalSnapshot.outputs.topicCard);
  assert.ok(finalSnapshot.outputs.literatureReviewDraft);
  assert.ok(finalSnapshot.outputs.proposalMapping.length > 0);
  assert.equal(finalSnapshot.outputs.proposalDraft, null);
});

test("课题推荐和最终总结都体现研究依据与综述草稿", () => {
  const recommendationStep = liveCommerceFixture.dialogueSteps.find(
    (step) => step.stateId === "topic_recommendation",
  );
  const finalStep =
    liveCommerceFixture.dialogueSteps[liveCommerceFixture.dialogueSteps.length - 1];

  assert.match(recommendationStep.text, /直播电商教学研究/);
  assert.match(finalStep.text, /文献综述草稿/);
  assert.match(finalStep.note, /真实文献检索结果/);
});

test("Demo 默认界面使用客户演示语言而不是内部 tab 语言", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("../src/app.mjs", import.meta.url), "utf8");
  const outputs = readFileSync(new URL("../src/outputs.mjs", import.meta.url), "utf8");
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  const visibleImplementation = `${app}\n${outputs}`;

  assert.match(html, /阶段判断/);
  assert.match(app, /申报书字段映射稿/);
  assert.match(app, /字段映射待形成/);
  assert.match(visibleImplementation, /研究背景/);
  assert.match(visibleImplementation, /研究目标/);
  assert.match(visibleImplementation, /研究方法/);
  assert.match(visibleImplementation, /预期成果/);
  assert.doesNotMatch(html, /阶段状态/);
  assert.doesNotMatch(html, /已确认/);
  assert.doesNotMatch(html, /缺失项/);
  assert.doesNotMatch(html, /最终产物/);
  assert.doesNotMatch(html, /主持人详情/);
  assert.doesNotMatch(app, /现在形成了什么/);
  assert.doesNotMatch(app, /下一步看什么/);
  assert.doesNotMatch(app, /主持人详情/);
  assert.doesNotMatch(app, /主持人可参考/);
  assert.doesNotMatch(app, /材料类产物不会提前生成/);
  assert.doesNotMatch(app, /材料包会在关键结论足够明确后生成/);
  assert.doesNotMatch(app, /阶段成果预览/);
  assert.doesNotMatch(app, /阶段沉淀总览/);
  assert.doesNotMatch(app, /教师画像与课程场景/);
  assert.doesNotMatch(app, /待形成：/);
  assert.doesNotMatch(readme, /presentation\.html/);
  assert.doesNotMatch(readme, /投屏/);
});

test("客户可见主线文案不暴露内部实现术语", () => {
  const app = readFileSync(new URL("../src/app.mjs", import.meta.url), "utf8");
  const visibleDialogue = liveCommerceFixture.dialogueSteps
    .flatMap((step) => [step.text, step.note])
    .join("\n");
  const forbiddenTerms = [
    /demo_fixture/,
    /material_verified/,
    /ai_suggestion/,
    /topic_card/,
    /literature_review_draft/,
    /proposal_mapping/,
    /proposal_draft/,
    /演示性/,
    /模拟申报指南/,
    /模拟文献检索/,
    /演示占位/,
    /不能视为真实材料/,
  ];

  forbiddenTerms.forEach((term) => {
    assert.doesNotMatch(visibleDialogue, term);
  });
  assert.doesNotMatch(app, /允许产出：.*topic_card/);
  assert.doesNotMatch(app, /允许产出：.*proposal_draft/);
});

test("课题推荐文案说明推荐依据、推荐理由和风险边界", () => {
  const recommendationStep = liveCommerceFixture.dialogueSteps.find(
    (step) => step.stateId === "topic_recommendation",
  );
  const evidenceStep = liveCommerceFixture.dialogueSteps.find(
    (step) => step.stateId === "evidence_support",
  );

  assert.match(recommendationStep.text, /为什么推荐第 1 个/);
  assert.match(recommendationStep.text, /更具体/);
  assert.match(recommendationStep.text, /可交付成果/);
  assert.match(evidenceStep.text, /申报关注点/);
  assert.match(evidenceStep.text, /直播电商教学研究/);
  assert.match(evidenceStep.note, /正式版本/);
});

test("关键对话文案说明阶段之间的承接关系", () => {
  const intentStep = liveCommerceFixture.dialogueSteps.find(
    (step) => step.stateId === "intent_refinement",
  );
  const problemAssistantStep = liveCommerceFixture.dialogueSteps.find(
    (step) => step.stateId === "problem_discovery" && step.speaker === "assistant",
  );
  const evidenceStep = liveCommerceFixture.dialogueSteps.find(
    (step) => step.stateId === "evidence_support",
  );
  const methodStep = liveCommerceFixture.dialogueSteps.find(
    (step) => step.stateId === "method_and_outcomes",
  );

  assert.match(intentStep.text, /缺少.*具体信息/);
  assert.match(intentStep.note, /先追问/);
  assert.match(problemAssistantStep.text, /我先把您的描述整理成一个待确认判断/);
  assert.match(problemAssistantStep.text, /请您确认/);
  assert.match(problemAssistantStep.note, /老师确认前/);
  assert.match(evidenceStep.text, /方向已经确认/);
  assert.match(evidenceStep.text, /再做一次依据校验/);
  assert.match(evidenceStep.note, /下一步/);
  assert.match(methodStep.text, /这些材料我能提供/);
});
