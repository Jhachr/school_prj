# Literature Workflow Behavioral Evaluation

Evaluation date: 2026-10-26

This evaluation checks the Skill instructions as behavior, not the retrieval scripts. The evaluator was asked to respond as the Skill to three teacher scenarios without reading implementation plans or tests.

## Baseline Result

### Scenario 1: The teacher has a vague problem but no topic

The Skill correctly asked for more context and avoided inventing citations, but it had no explicit route from problem clarification to exploratory retrieval. It was unclear when to search, how to compare evidence-backed directions, or when teacher confirmation should stop exploration and start a focused review.

### Scenario 2: The public source returns few Chinese records

The Skill did not automatically claim that nobody had studied the topic, but it lacked an explicit coverage, query, and access-limit protocol. The existing grade language could still make a thin set look more complete than it was and did not require a cautious, testable formulation of a possible research gap.

### Scenario 3: A relevant record has an abstract but no DOI

The Skill did not require discarding the record, but it had no formal record-verification lifecycle, no rule limiting an abstract to abstract-level claims, and no explicit explanation of how unresolved records may be used without presenting them as fully verified sources.

## Baseline Failure Pattern

- Retrieval, screening, verification, and evidence use were too coarse.
- Topic-generation timing and the transition to a focused review were ambiguous.
- Few results could be over-interpreted as a research gap.
- Record status and teacher-visible Chinese meanings were absent.
- Literature claims had no required claim-to-record-to-excerpt trace.
- Teacher autonomy and the audit trail were not clearly connected.

## Forward-Test Result

GREEN — an independent evaluator found the updated behavior materially unambiguous:

- A vague problem is confirmed before bilingual exploratory retrieval; the teacher must explicitly select or edit a direction before focused review.
- Few Chinese records are reported as limited coverage in this run, with query, database, and access limits; they are never treated as proof that no research exists.
- A relevant record is not excluded solely because it lacks a DOI. Abstract-only support is limited to the saved excerpt, carries “尚未读取全文” and any `unresolved` warning, and cannot be broadened into a full-text claim.
- All four verification labels have teacher-facing Chinese meanings.
- Traceability is explicit from claim ID to an included, allowed record and exact excerpt plus location; script association checking and human semantic review remain separate.

Non-blocking implementation discretion remains: “few records” has no numeric threshold, and DOI absence alone does not decide whether a record becomes `verified` or remains `unresolved`. This is intentional because the first version has no fixed literature-count threshold and verification depends on the available source evidence.
