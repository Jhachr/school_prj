# Quality Rubric

Always evaluate in this exact order: C -> B -> A. Record one internal grade only.

## Teacher-Facing Readiness

The letter grade is an internal control, not a label for the teacher. In ordinary coaching replies, show the matching natural-language readiness instead:

| Internal Grade | Teacher-Facing Readiness |
|---|---|
| C | `继续梳理` |
| B | `可形成阶段材料` |
| A | `可形成申报结构稿` |

Show the raw C/B/A grade only in maintainer checks, evaluation artifacts, or when the teacher explicitly asks to inspect the rubric. Do not make the teacher learn the internal grading system before they can continue.

## C: Keep Asking, Do Not Generate Proposal Materials

Grade C applies when any condition is true:

| Condition | Return To |
|---|---|
| Teacher profile is not confirmed. | `teacher_profile` |
| Real work or teaching problem is not established. | `problem_discovery` |
| Topic direction is not confirmed. | `topic_confirmation` |
| Research object, scene, or question is missing. | `research_question` |

Allowed outputs:

- Clarifying questions.
- Direction options.
- Examples of better input.
- A short explanation of why proposal material would be premature.

Disallowed outputs:

- Topic card as if confirmed.
- Proposal field mapping.
- Formal proposal draft.

## B: Generate Stage Materials Only

Grade B applies when C does not apply, but any condition is true:

| Condition | Status |
|---|---|
| Method path or data source needs detail. | `missing` or `ai_suggestion` |
| Non-paper deliverable is not confirmed. | `missing` |
| Real application guide is absent. | `missing` or `demo_fixture` |
| Real literature retrieval is absent. | `missing` or `demo_fixture` |
| Real school template is absent. | `missing` |

Allowed outputs:

- Topic card.
- Literature review draft with source labels.
- Problem-method-outcome table.
- Proposal field mapping.
- Missing items.
- Quality report.
- Learning feedback.

Disallowed outputs:

- A formal or directly submittable proposal.
- Unlabeled literature claims.
- Unverified school-policy claims.

## A: Generate Structured Content Draft

Grade A requires all conditions:

1. Teacher profile confirmed.
2. Real work problem confirmed.
3. Topic direction confirmed.
4. Research question confirmed.
5. Method and data/resource path executable.
6. At least one non-paper deliverable confirmed.
7. Application guide is `material_verified`.
8. Literature evidence is `retrieved_evidence` or `material_verified`.
9. School proposal template is `material_verified`.
10. Material Passport contains source, claim, decision, artifact, quality, and health records for the current output.
11. Dialogue health is not `red`.

Allowed outputs include all B outputs plus a structured proposal content draft. The output must still state that human and expert review is required.

## Module-Level Status

Each module records one internal status. Ordinary teacher-facing replies use the natural-language version:

| Internal Status | Teacher-Facing Wording |
|---|---|
| `pass` | `可以继续` |
| `needs_revision` | `还需补充或调整` |
| `blocked` | `暂时不能推进，需先补齐关键信息` |

## Key Checks

- Does the topic solve a real teaching or work problem?
- Is the problem concrete and observable?
- Is the topic adapted to the teacher's role, courses, and prior basis?
- Can the method be implemented with actual class, project, data, or institutional resources?
- Is there at least one reusable, tool-like, process-like, or practice-improvement outcome?
- Are policy, guide, literature, and template claims traceable?
- Does the Material Passport show which claims, decisions, and artifacts the output depends on?
- Is the dialogue still producing teacher-owned decisions rather than passive acceptance?
