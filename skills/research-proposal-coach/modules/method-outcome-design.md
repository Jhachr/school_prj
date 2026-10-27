# Method And Outcome Design Module

## Purpose

Complete the method portion of `evidence_and_design` and support `prototype_and_validation` by mapping each research problem to methods, actions, data, outcomes, and validation.

## Required Inputs

- Confirmed research question.
- Available class, project, work, data, or collaboration resources.
- Expected cycle.
- Current goal and its outcome requirements when available.

## Coaching Loop

1. Draft the research backbone card from `templates/research-backbone-card.md`: real problem, core question, change or intervention, evidence, reusable outcome, and conclusion boundary.
2. Explain why the next proposed artifact belongs in that backbone and which research function it serves.
3. Let the teacher confirm the whole card once or correct one field. A correction or “按这个做” is confirmation; do not reconfirm each field.
4. Draft a problem-method-outcome table after the backbone is owned by the teacher.
5. Explain that a method should be a concrete work system, tool, process, rubric, case library, or implementation path.
6. Identify empty concepts or methods that could apply anywhere.
7. Ask for one missing resource, sample, data, or cycle detail only when it changes feasibility.
8. Check that at least one non-paper outcome exists, revise outcomes, and mark scoring risks.

## Large Artifact Gate

Before generating a large artifact such as a task bank, scale, lesson package, long literature review, or proposal section, show the 研究骨架卡 and explain:

- why this artifact is needed now;
- whether it is an intervention, measurement tool, evidence source, or deliverable;
- what decision remains with the teacher.

If the backbone is not confirmed, the assistant may provide a small illustrative sample but must not present the large artifact as settled or ready for use.

## Full Research Instrument Gate

研究骨架卡只允许进入讨论或小样，不自动授权完整测量工具。Before generating a full task bank, scale, rubric, interview protocol, or intervention package, all of these must be explicit:

- 核心研究问题：the instrument can be tied to one owned, answerable question.
- 主要评价指标：the primary outcome and any secondary dimensions are named.
- 比较或实施方式：the intervention, comparison, timing, and any validity-critical condition are answered rather than inferred.
- 数据或资源条件：the class, participants, material source, scoring capacity, and collection route are plausible.
- Evidence basis: focused literature, verified local material, or an explicit limitation supports the chosen dimensions.
- Validation route: expert review, pilot, item analysis, reliability check, or another proportionate review is planned.

If any validity-critical item is unresolved, provide a 1-3 item discussion prototype. 小样不能直接扩展为完整或正式工具，也不能因为老师说“继续”就跳过未回答的关键条件。

## Pass Conditions

- Each major problem has a plausible method path.
- The teacher has confirmed or corrected the research backbone card.
- Method path includes object, action, data/resource, cycle, and evaluation.
- A full instrument is generated only after `evidence_and_design` is complete and its validation route is named.
- At least one non-paper outcome is confirmed.

## Output

```markdown
### Problem-Method-Outcome Map

| Problem | Method/Action | Data Or Resource | Outcome | Source Status | Risk |
|---|---|---|---|---|---|
```

## Fallback

If outcomes are only papers, suggest 2-3 reusable artifacts that fit the topic and ask the teacher which are realistic, with a combine/rewrite path.
