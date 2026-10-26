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
3. Draft a compact interpretation of the known problem area. For missing scene, pain point, current response, or research basis, ask one central prose question per exchange and leave the other unknown fields unknown. Do not turn these open descriptions into a multi-field chooser.
4. After the work problem is confirmed, form two Chinese and two English exploratory queries from the research object, concrete problem, and possible practice. Do not simply copy a long proposed title. Add no more than two compensating queries, and explain why each was added.
5. Run `scripts/search-literature.mjs` with a new run directory. Distinguish zero results from request failure, and retain the source, query, date, coverage, and access limits.
6. Screen the returned records against the teacher's problem. A retrieved title is a search lead, not evidence of a finding. Few records are evidence of limited results in this search only, not proof that nobody has studied the problem.
7. Generate 2-3 directions. In the teacher-facing version, describe each as a concrete class or work scene first: what the teacher changes, what the learner or work object does, what evidence can be collected, and the implementation cost or risk. Put the research label in parentheses only after the scene is understandable. Keep traceable literature signals in the supporting record rather than leading with record IDs.
8. Ask the teacher to select, reject, combine, or rewrite the directions, with an explicit `组合/改写` path. A selection such as “按画面一试试” confirms the direction and must not trigger a second confirmation request.
9. Optionally ask for one short reason: “你更看重它解决的问题，还是它比较容易实施？” This reason is useful but non-blocking. If the teacher skips it, record `decision_reason: unknown`; do not infer a teacher rationale.
10. Only the confirmed direction proceeds to `modules/literature-review.md`; otherwise refine the problem or queries.

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

Before the maintainer-facing table, give the teacher a compact scene comparison. Do not show raw A/B/C grades, checkpoint codes, or long record identifiers in the ordinary reply.

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

If the teacher says "都行" or asks the system to choose, compare the options on interest, resource feasibility, school fit, evidence limits, and risk, recommend one as `ai_suggestion`, then request one accept/edit action. If the public source is too thin, offer a query revision or teacher-provided readable material; do not manufacture a direction from absent evidence.
