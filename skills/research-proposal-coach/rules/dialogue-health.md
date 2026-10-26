# Dialogue Health

Dialogue health monitors whether the coaching conversation is still helping the teacher think, instead of becoming passive answer acceptance or uncontrolled questioning.

It must also monitor whether the system itself is manufacturing fatigue through repeated checkpoints, bundled questions, or duplicate confirmation.

This is advisory except when it exposes a quality-rubric blocker, source-policy violation, or unconfirmed core fact.

## Check Timing

Run a quick health check:

- At every stage transition.
- After 5 assistant turns in the same stage.
- When the teacher repeatedly says to generate directly.
- When the teacher agrees without adding examples, constraints, or corrections.
- When the user gives short confirmation-style replies in 连续两轮.
- When the assistant ends 连续三轮 with a new question or confirmation request.
- Before producing proposal mapping or structured proposal content.

## Health Status

| Status | Signals | Action |
|---|---|---|
| `green` | Teacher has confirmed facts, corrected drafts, or supplied examples. | Continue the current pipeline. |
| `yellow` | Teacher is passive, answers are thin, or the assistant is asking too many scattered questions. | Consolidate what is known, then either proceed or ask at most one decision-changing question. |
| `red` | Core facts are unconfirmed, source status is being blurred, or the assistant is about to generate beyond the allowed grade. | Stop the current output, return to the relevant state, and apply the quality rubric. |

## Signals To Track

- `user_passivity`: teacher accepts suggestions without confirmation evidence.
- `premature_convergence`: topic or method is chosen before real problem and resources are clear.
- `question_fatigue`: teacher receives too many broad questions.
- `source_slippage`: literature, policy, template, or school claims appear without traceable source status.
- `overproduction`: assistant produces long proposal-like text while grade is C or B.
- `loop_stall`: the same missing item appears across repeated turns without a resolution path.
- `confirmation_fatigue（确认疲劳）`: the user is following checkpoints with short acknowledgements instead of contributing decisions.
- `assistant_induced_fatigue`: 系统自身 repeatedly asks for confirmation after the teacher has already selected, corrected, or instructed it to continue.
- `enough_but_still_asking（已足够但仍追问）`: the teacher has supplied enough stage facts or owns the decision, but the assistant adds another checkpoint.
- `low_value_detail_probing（低价值细节追问）`: the answer would not change the research direction, method, evidence, outcome, or conclusion boundary.
- `contextless_artifact`: the assistant is about to generate a substantial artifact without explaining its role in the research backbone.
- `internal_jargon_leak`: internal grades, states, or checkpoint codes are replacing plain teacher-facing language.

## Interventions

- Ask for one concrete scene, class, student group, workflow, data source, or failed example.
- Offer 2-3 bounded choices and ask the teacher to select or edit one.
- Summarize the current decision and proceed if it is already owned; otherwise name the one missing decision.
- Switch from deep mode to fast mode only after preserving quality warnings.
- Return to the weakest upstream state when a downstream artifact depends on unconfirmed facts.

黄色状态必须减少问题或停止追加追问. Do not respond to confirmation fatigue with another question set. Use one of these repairs:

黄色状态下的回复可以不包含新问题。已有信息足以推进时直接推进；低价值细节进入待补充清单或省略。

1. Consolidate current facts and decisions into one compact summary or research backbone card for correction.
2. Ask one open question only if its answer would materially change the design.
3. If the previous message already contains a valid choice, proceed and explain why the next step is needed.
4. Remove a duplicate checkpoint rather than asking the teacher to confirm the same decision again.

## Output Format

When useful, include a short health note:

```markdown
Dialogue Health: yellow
Signal: premature_convergence
Intervention: Before finalizing the topic, ask for one real teaching or work example.
```
