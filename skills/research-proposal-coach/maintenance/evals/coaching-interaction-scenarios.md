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

- Expected: explain that the task bank may be an intervention, measurement tool, or reusable outcome; show the compact research backbone card and check whether the core question, primary indicator, comparison or implementation, data conditions, and validation route are ready. A 1-3 item sample is allowed.
- Disallowed: generate the full task bank merely because the backbone card is accepted; full expansion waits for `evidence_and_design` to close.
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

## Scenario 11: Ambiguous Continuation Does Not Answer A Critical Fact

**Context:** The assistant asks whether both comparison classes are taught by the same teacher.

**Prompt:** “好的，按这个方案来。”

- Expected: keep the teaching-condition field unknown and ask only that unresolved validity question.
- Disallowed: treat the reply as “yes”, close `evidence_and_design`, or generate the full instrument.
- Navigation: remain in evidence and design with one open blocker.

## Scenario 12: Side Question Returns To The Main Line

**Context:** The current phase is evidence and design; the open blocker is whether comparison classes share a teacher.

**Prompt:** “为什么刚才文献检索这么慢？”

- Expected: answer the operational question, state whether it changes evidence quality, then restore the design phase and its existing blocker.
- Disallowed: abandon the design phase, start a new workflow, or choose a new artifact as the next step.
- Navigation: `resume_phase` is evidence and design until the main line is restored.

## Scenario 13: Goal Is Still Undetermined

**Prompt:** “这个方向不错，先往下聊。”

- Expected: continue shared research-question or design work and preserve `current_goal: undetermined` unless a goal-dependent output is now required.
- Disallowed: assume the teacher is writing a paper or project application, or start “国内外研究现状” as an application field.
- Navigation: goal routing occurs once the output or design actually depends on it.

## Scenario 14: Temporary Session Creates Working Files

**Context:** The teacher chose temporary mode and now asks for a literature search and a downloadable review.

- Expected: before the first write, explain that no durable teacher memory will be updated but retrieval records and the requested document will be written to a named project or working path.
- Disallowed: say “nothing is saved anywhere” after files exist.
- Navigation: file creation is `artifact_io`, not research-phase completion.

## Scenario 15: Full Instrument Follows Evidence And Design

**Prompt:** “直接给我做两套各 12 题的前后测。”

- Expected: if the core question, primary indicator, comparison design, data conditions, evidence basis, or validation route is incomplete, provide at most a 1-3 item prototype and name the single blocker.
- Disallowed: generate both complete forms because the direction or backbone alone was accepted.
- Navigation: full production begins only in prototype and validation after evidence and design closes.

## Scenario 16: Direction Choice Does Not Trigger Card Approval

**Prompt:** “画面一比较符合我的课堂，就按这个方向继续。”

- Expected: record the direction, update the direction card internally, and move to the next incomplete research-focus decision.
- Disallowed: display a direction card and ask “请确认”, then display a research-backbone card for another approval.
- Health: `card_confirmation_cascade` if a second card becomes another approval gate without meaningful new teacher input.

## Scenario 17: Teacher-Owned Facts Fill The Backbone

**Context:** The teacher has already stated the real problem, selected the core question, described the intervention, named the observable evidence, and chosen a reusable outcome.

**Prompt:** “继续往下做研究设计吧。”

- Expected: update the backbone working snapshot, show at most a compact decision delta, and proceed to the next design task without asking for whole-card approval.
- Disallowed: ask “研究骨架卡是否确认” or replay every settled field merely because the phase changed.
- Navigation: phase movement follows exit criteria and decision ownership, not card approval.

## Scenario 18: One Consequential Inference In A Design Card

**Context:** The design card is based on teacher-owned facts except that the assistant inferred both classes share the same teacher.

**Prompt:** “这个设计大体可以。”

- Expected: keep that teaching condition unresolved and ask only whether both classes are taught by the same teacher.
- Disallowed: ask for approval of the entire design card or infer “yes” from the general response.
- Health: the specific validity question is healthy; another blanket card confirmation is `card_confirmation_cascade`.

## Scenario 19: Returning Teacher Gets A Conversational First Turn

**Context:** A ready local profile exists for 李老师.

**Prompt:** “我们讨论下科研吧。”

- Expected: greet briefly and ask one plain choice—continue with 李老师's profile or chat temporarily.
- Disallowed: say “启动科研教练”, narrate a status check, expose a profile ID, summarize profile fields, or mention which memory files will be read.
- Memory: no detailed profile or memory content is read before the identity choice.

## Scenario 20: Identity Choice Leads Directly To Useful Coaching

**Context:** 李老师 has chosen to continue with the ready profile. The stored profile mentions 信息化教学课程 and a first research attempt; all three memory tables are empty.

**Prompt:** “按李老师身份继续。”

- Expected: use at most one relevant historical clue as a revisable lead and ask one useful open question about the teacher's current discussion intent or a recurring teaching/work scene.
- Disallowed: list all four profile fields, announce empty memory tables, label the teacher as a beginner, predeclare several facts that need checking, or require approval of a profile summary before discussion.
- Memory: the clue remains `suggested_from_history` until the teacher's current response confirms or corrects it.
