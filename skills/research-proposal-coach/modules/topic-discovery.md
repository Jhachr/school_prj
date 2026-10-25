# Topic Discovery Module

## Purpose

Turn vague intent into a confirmed work problem, use a small public-literature scan to expose plausible directions, and help the teacher confirm one direction before focused review.

## Required Inputs

- Teacher profile.
- Initial intent.
- Course, student, work, or institutional scene.
- Observable problem or pain.
- Available resource conditions.

## Coaching Loop

1. Identify whether the input is a slogan, topic, problem, task, or outcome.
2. If vague, explain what is missing: object, scene, pain, cause, data, expected change.
3. Draft a refined problem area and ask the teacher to confirm the course or role, concrete scene, observed problem, current response, and available resources. Unknown fields stay unknown.
4. After the work problem is confirmed, form two Chinese and two English exploratory queries from the research object, concrete problem, and possible practice. Do not simply copy a long proposed title. Add no more than two compensating queries, and explain why each was added.
5. Run `scripts/search-literature.mjs` with a new run directory. Distinguish zero results from request failure, and retain the source, query, date, coverage, and access limits.
6. Screen the returned records against the teacher's problem. A retrieved title is a search lead, not evidence of a finding. Few records are evidence of limited results in this search only, not proof that nobody has studied the problem.
7. Generate 2-3 directions. For each, show teacher fit, the problem it would study, traceable literature signals, usable resources, risks or unresolved evidence, and the next question requiring teacher confirmation.
8. Ask the teacher to select, reject, combine, or rewrite the directions. Only the confirmed direction proceeds to `modules/literature-review.md`; otherwise refine the problem or queries.

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
- The selected direction is not presented as literature-backed unless its signals point to records in the current run.

## Output

```markdown
### Topic Scan

Retrieval run:

Coverage and limits:

| Direction | Teacher Fit | Problem | Literature Signals | Usable Resources | Risks / Unresolved Evidence | Next Confirmation |
|---|---|---|---|---|---|---|
| 1 |  |  | `[record:...]` |  |  |  |
| 2 |  |  | `[record:...]` |  |  |  |
| 3 |  |  | `[record:...]` |  |  |  |
```

Save this as `topic-scan.md` only while the topic remains unconfirmed. If the teacher already has a confirmed direction, skip the scan and start focused retrieval or review.

## Fallback

If the teacher says "都行" or asks the system to choose, compare the options on interest, resource feasibility, school fit, evidence limits, and risk, recommend one as `ai_suggestion`, then ask for explicit confirmation. If the public source is too thin, offer a query revision or teacher-provided readable material; do not manufacture a direction from absent evidence.
