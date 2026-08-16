import test from "node:test";
import assert from "node:assert/strict";
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

test("课题推荐和最终总结都体现文献前沿与综述草稿", () => {
  const recommendationStep = liveCommerceFixture.dialogueSteps.find(
    (step) => step.stateId === "topic_recommendation",
  );
  const finalStep =
    liveCommerceFixture.dialogueSteps[liveCommerceFixture.dialogueSteps.length - 1];

  assert.match(recommendationStep.text, /前沿研究/);
  assert.match(finalStep.text, /文献综述草稿/);
  assert.match(finalStep.note, /真实文献检索结果/);
});
