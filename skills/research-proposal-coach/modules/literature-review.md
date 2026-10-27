# Literature Review Module

## Purpose

Support `evidence_and_design`: help the teacher understand what accessible literature can and cannot say about a confirmed question, use it to test the proposed indicators and method, and produce a claim-level traceable review draft when needed.

## Required Inputs

- Selected topic.
- Research question or problem area.
- A literature run directory containing `request.json`, `raw/openalex.jsonl`, and `corpus.json`, or an explicit `missing` status.
- Local cases or teacher-known examples when available.

## Coaching Loop

1. Confirm the selected problem and use the current run or refine focused queries. Separate real retrieved evidence from missing and demo/example content.
2. Screen every candidate as `included`, `uncertain`, or `excluded`, with a short reason in `corpus.json`. Only `included` records may support the review.
3. Explain verification labels whenever they are shown: `verified`（已核验）, `unresolved`（暂未核验：当前公共源无法确认）, `conflicted`（信息冲突）, and `rejected`（已排除：标识明确不存在或记录明显错误）.
4. Never cite `conflicted` or `rejected` records. An `unresolved` included record may support a cautious statement only when a traceable abstract or saved material contains the evidence; keep the verification warning visible. A missing DOI alone does not make a record unusable.
5. Answer three subquestions: how studies explain or handle the problem; which practices have supporting or limiting evidence; and what follows for this teacher's scene, including what does not follow.
6. For each substantive literature, comparison, trend, gap, or practice claim, save the exact accessible excerpt and its location before writing the claim. Use `abstract` only for text present in the saved abstract and state “尚未读取全文”. For teacher-provided readable material, save a relative path plus page or section.
7. Store the claim once in `claims.jsonl` with `claim_id`, `claim`, `evidence`, and `limitations`. A synthesis may cite multiple records; its scope must not exceed the excerpts.
8. Draft `review.md` from those claims. Mark claims as `[C01]` and references as `[record:<record_id>]`. Separate source findings, the assistant's interpretation, and recommendations to the teacher.
9. Treat a possible research gap as a clue to verify within this search scope. Report database coverage, query design, and access limitations alongside it; few results never prove absence of research.
10. Run `scripts/check-literature-run.mjs --input <run-directory>` before calling the draft traceable. Then manually review whether the excerpts actually support the claims; script success does not prove semantic support.
11. Ask whether the teacher knows closer school, industry, or course materials, and use the review to revise research questions, methods, outcomes, and innovation points.

Literature retrieval and review are support actions, not a separate main-flow phase. After answering a literature side question, return to the prior `resume_phase` unless the evidence explicitly changes the question or design.

## Pass Conditions

- Every included key claim has a claim ID, at least one allowed record, an accessible excerpt and location, and stated limitations.
- `review.md` includes the research conclusion, support for the teacher's scene, what cannot yet be concluded, references, and questions for the teacher.
- The association checker passes and human content review is reported separately.
- Missing, unresolved, and demo evidence is clearly labeled and listed as a risk. Demo evidence never supports a real deliverable.

## Output

Produce `review.md` using `templates/literature-review-longform.md`, with length determined by available evidence rather than a fixed word count. Claim and record IDs belong in the evidence file or appendix; ordinary teacher-facing summaries use natural-language citations and must not say “C04 shows” or expose similar internal IDs. Do not automatically generate a generic proposal-form literature section in this module. Compression happens later only against a real application template and must reuse the checked claims rather than regenerate facts or citations.

## Fallback

If no usable evidence exists, do not invent citations or force the template. Deliver the retrieval record and evidence-gap explanation, mark literature support as `missing`, and ask for one next action: revise queries, provide readable material, or narrow the problem. Do not promise publication readiness.
