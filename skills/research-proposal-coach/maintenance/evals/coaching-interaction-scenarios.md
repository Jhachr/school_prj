# Coaching Interaction Scenarios

These scenarios evaluate whether the Skill behaves like a research coach without making the teacher chase an internal pipeline.

## Scenario 1: First-Use Vague Request

**Prompt:** “我想做科研，我们聊聊吧。”

- Expected: ask one closed route question—temporary conversation or create a profile now—and recommend temporary mode as the low-burden default.
- Disallowed: request name, department, role, course, research basis, and final deliverable in the first reply.
- Health: green if only one user action is requested.
- Memory: no durable read or write before the route is chosen.

## Scenario 2: Open Pain-Point Description

**Prompt:** “我平时上数据库课，感觉学生越来越依赖 AI。”

- Expected: use one prose question asking for one concrete classroom example and optionally show a short example of a useful answer.
- Disallowed: force the scene, pain point, evidence, student group, and resources into a multi-field chooser.
- Health: yellow if several unrelated questions are bundled.
- Memory: current-session facts remain candidates until the proper review point.

## Scenario 3: Direction Names Are Hard To Understand

**Prompt:** “你说的现象诊断、设计干预、苏格拉底脚手架我看不懂。”

- Expected: restate up to three options as concrete classroom scenes, with what changes, what students do, what can be observed, and the main implementation risk. Include a combine/rewrite path.
- Disallowed: lead with research jargon, grades, checkpoint codes, or long literature IDs.
- Health: treat incomprehension as an internal-jargon signal, not as weak user input.
- Memory: no direction is confirmed until the teacher selects or rewrites one.

## Scenario 4: Direction Switch Without A Reason

**Prompt:** “算了，我不做画面二了，按画面一。”

- Expected: accept the switch as confirmation and proceed. A single non-blocking reason question is optional.
- Disallowed: ask “是否确认画面一” or record implementation difficulty as the teacher's reason without the teacher saying so.
- Health: yellow if the assistant adds a duplicate confirmation.
- Memory: direction may be `user_confirmed`; `decision_reason` remains `unknown` unless supplied.

## Scenario 5: Large Artifact Before Research Backbone

**Prompt:** “那你直接给我做一套 20 道 SQL 题库吧。”

- Expected: explain that the task bank may be an intervention, measurement tool, or reusable outcome; show the compact research backbone card and request one correction or whole-card confirmation. A small example is allowed.
- Disallowed: generate the full task bank before the teacher understands and owns its role.
- Health: `contextless_artifact` if the assistant skips the explanation.
- Memory: do not save an artifact reference before the artifact exists.

## Scenario 6: Goal Changes From Application To Paper

**Prompt:** “我不准备申报课题了，想先写成一篇论文。”

- Expected: confirm the paper goal once, reuse compatible problem/direction/evidence work, and explain that data design and paper structure now take priority over school application fields.
- Disallowed: continue producing application sections or restart the whole conversation.
- Health: green when only one goal decision is requested.
- Memory: update the current-session goal immediately; offer the durable change with other candidates at a milestone.

## Scenario 7: Enough Facts But Disorganized

**Prompt:** “大一数据库课，15 人。学生能让 AI 写 SQL，但解释不了，也判断不了结果对不对。我想提高他们判断 SQL 对错的能力。”

- Expected: mirror the confirmed scene and give one compact research-problem draft for correction; do not ask the teacher to repeat course, group, problem, and intended change.
- Disallowed: restart discovery with a bundle of profile or scene questions.
- Health: `enough_but_still_asking` if the assistant asks for facts already present.
- Memory: current-session facts remain candidates until the normal milestone review.

## Scenario 8: One Evidence Risk

**Prompt:** “用了 AI 之后，学生的计算机基础肯定变差了。”

- Expected: distinguish observation from causal conclusion, name that single evidence risk, and ask for one concrete observable example or comparison basis.
- Disallowed: accept causality as fact or ask an unrelated questionnaire.
- Health: green when one decision-changing evidence question is asked.
- Memory: record the causal statement as unconfirmed, not `user_confirmed` evidence.

## Scenario 9: A Valid Choice Needs No New Question

**Prompt:** “画面一更适合我，因为不用统一 AI 平台，现有课堂就能做。按这个继续。”

- Expected: record the direction and reason, revise the current artifact, and proceed without another confirmation question.
- Disallowed: ask whether the teacher confirms画面一 or require another reason.
- Health: `enough_but_still_asking` if a new checkpoint is added.
- Memory: direction and supplied reason may become current-session `user_confirmed` facts.

## Scenario 10: Fatigue Repair Without A Question

**Prompt:** The teacher has replied “好的”“确认”“按这个做” in two consecutive rounds after already choosing a direction.

- Expected: consolidate the selected direction, known facts, and next artifact role, then proceed. The response may contain no new question.
- Disallowed: add another question set or ask for the same confirmation.
- Health: yellow with `confirmation_fatigue` or `assistant_induced_fatigue`, followed by a question-free repair.
- Memory: do not infer new preferences from low-information acknowledgements.
