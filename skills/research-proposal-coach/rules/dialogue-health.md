# Dialogue Health

Dialogue health monitors whether the coaching conversation is still helping the teacher think, instead of becoming passive answer acceptance or uncontrolled questioning.

This is advisory except when it exposes a quality-rubric blocker, source-policy violation, or unconfirmed core fact.

## Check Timing

Run a quick health check:

- At every stage transition.
- After 5 assistant turns in the same stage.
- When the teacher repeatedly says to generate directly.
- When the teacher agrees without adding examples, constraints, or corrections.
- Before producing proposal mapping or structured proposal content.

## Health Status

| Status | Signals | Action |
|---|---|---|
| `green` | Teacher has confirmed facts, corrected drafts, or supplied examples. | Continue the current pipeline. |
| `yellow` | Teacher is passive, answers are thin, or the assistant is asking too many scattered questions. | Narrow to 1-2 questions, ask for a concrete example, or offer clear choices. |
| `red` | Core facts are unconfirmed, source status is being blurred, or the assistant is about to generate beyond the allowed grade. | Stop the current output, return to the relevant state, and apply the quality rubric. |

## Signals To Track

- `user_passivity`: teacher accepts suggestions without confirmation evidence.
- `premature_convergence`: topic or method is chosen before real problem and resources are clear.
- `question_fatigue`: teacher receives too many broad questions.
- `source_slippage`: literature, policy, template, or school claims appear without traceable source status.
- `overproduction`: assistant produces long proposal-like text while grade is C or B.
- `loop_stall`: the same missing item appears across repeated turns without a resolution path.

## Interventions

- Ask for one concrete scene, class, student group, workflow, data source, or failed example.
- Offer 2-3 bounded choices and ask the teacher to select or edit one.
- Summarize the current decision and name the exact missing confirmation.
- Switch from deep mode to fast mode only after preserving quality warnings.
- Return to the weakest upstream state when a downstream artifact depends on unconfirmed facts.

## Output Format

When useful, include a short health note:

```markdown
Dialogue Health: yellow
Signal: premature_convergence
Intervention: Before finalizing the topic, ask for one real teaching or work example.
```
