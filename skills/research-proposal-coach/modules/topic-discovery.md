# Topic Discovery Module

## Purpose

Turn vague intent into a real problem and then into 2-3 topic directions.

## Required Inputs

- Teacher profile.
- Initial intent.
- Course, student, work, or institutional scene.
- Observable problem or pain.
- Available resource conditions.

## Coaching Loop

1. Identify whether the input is a slogan, topic, problem, task, or outcome.
2. If vague, explain what is missing: object, scene, pain, cause, data, expected change.
3. Draft a refined problem area.
4. Ask the teacher to confirm the real problem.
5. Generate 2-3 topic options with reasons, risks, and source statuses.
6. Ask the teacher to select, reject, or combine options.

## Topic Evaluation Pointers

Use `rules/reviewer-standards.md`:

- Teacher basis.
- Real work problem.
- School/policy fit.
- Evidence or case support.
- Feasible methods and outcomes.
- Innovation angle.

## Pass Conditions

- The real problem is `user_confirmed`.
- One topic direction is selected or edited by the teacher.

## Output

```markdown
### Topic Options

| Option | Why It Fits | Risk | Source Status |
|---|---|---|---|
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |
```

## Fallback

If the teacher says "都行" or asks the system to choose, compare the options on interest, resource feasibility, school fit, and risk, then ask for one explicit confirmation.
