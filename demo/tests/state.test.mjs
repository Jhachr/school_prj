import test from "node:test";
import assert from "node:assert/strict";
import { evaluateGrade } from "../src/state.mjs";

test("空输入判为 C 且不生成材料", () => {
  const result = evaluateGrade({ rawIntent: "AI+教育" });
  assert.equal(result.grade, "C");
  assert.deepEqual(result.allowedOutputs, []);
});

test("直播电商演示案例使用演示依据时稳定判为 B", () => {
  const result = evaluateGrade({
    teacherProfileConfirmed: true,
    realProblemConfirmed: true,
    topicConfirmed: true,
    researchQuestionConfirmed: true,
    methodExecutable: true,
    nonPaperOutcomeConfirmed: true,
    guideSource: "demo_fixture",
    templateSource: "missing",
  });
  assert.equal(result.grade, "B");
  assert.deepEqual(result.allowedOutputs, [
    "topic_card",
    "proposal_mapping",
    "missing_items",
    "quality_report",
  ]);
});

test("真实指南和模板齐备后才判为 A", () => {
  const result = evaluateGrade({
    teacherProfileConfirmed: true,
    realProblemConfirmed: true,
    topicConfirmed: true,
    researchQuestionConfirmed: true,
    methodExecutable: true,
    nonPaperOutcomeConfirmed: true,
    guideSource: "material_verified",
    templateSource: "material_verified",
  });
  assert.equal(result.grade, "A");
  assert.ok(result.allowedOutputs.includes("proposal_draft"));
});
