# Learning Feedback Module

## Purpose

Give the teacher feedback on research thinking while preserving motivation.

## Inputs

- Module outputs.
- Questions asked.
- User confirmations or skipped answers.
- Quality grade changes.
- Missing items.

## Feedback Dimensions

- Can the teacher describe a real work problem?
- Can the teacher separate problem, topic, method, outcome, and innovation?
- Does the teacher understand why literature review matters?
- Did the teacher provide cases, data, constraints, or examples?
- Did the teacher revise or only accept generated content?

## Milestones

Give learning feedback only at a meaningful 里程碑:

- `research_focus` closes with a teacher-owned goal, question, and boundary;
- `evidence_and_design` closes with an understood evidence and method path;
- a prototype has been reviewed or piloted rather than merely generated;
- the teacher finishes interpreting literature or data rather than merely receiving a document;
- the session ends or pauses for external material.

Do not append learning feedback mechanically after every module. If confirmation fatigue is yellow, use this compact feedback as a summary rather than adding more questions.

## Output

```markdown
### 本阶段学习反馈

- 你已经想清楚的一个点：
- 当前最需要补强的一个点：
- 下一步最值得收集或阅读的材料：
```

## Rule

Keep feedback concrete. Avoid personality judgments. Focus on observable behavior in the proposal conversation. Limit the teacher-facing feedback to the three items above; keep any internal module-revisit code in the session record.
