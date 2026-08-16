import test from "node:test";
import assert from "node:assert/strict";
import { liveCommerceFixture } from "../src/fixtures.mjs";
import { buildDemoOutputs } from "../src/outputs.mjs";

test("演示政策显示为 demo_fixture", () => {
  const outputs = buildDemoOutputs(liveCommerceFixture);
  assert.equal(outputs.topicCard.evidence.sourceType, "demo_fixture");
});

test("用户确认内容显示为 user_confirmed", () => {
  const outputs = buildDemoOutputs(liveCommerceFixture);
  assert.equal(outputs.topicCard.realProblem.sourceType, "user_confirmed");
  assert.equal(outputs.topicCard.researchQuestion.sourceType, "user_confirmed");
});

test("缺失模板进入缺口清单", () => {
  const outputs = buildDemoOutputs(liveCommerceFixture);
  assert.ok(
    outputs.missingItems.some(
      (item) => item.id === "school_template" && item.sourceType === "missing",
    ),
  );
});

test("B 级不生成 proposal_draft", () => {
  const outputs = buildDemoOutputs(liveCommerceFixture);
  assert.equal(outputs.quality.grade, "B");
  assert.equal(outputs.proposalDraft, null);
});
