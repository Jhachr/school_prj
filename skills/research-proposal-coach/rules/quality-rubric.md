# Quality Rubric

Always grade in this exact order: C -> B -> A. Return one grade only.

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

Each module should also report:

- `pass`: ready to continue.
- `needs_revision`: continue coaching or revise a draft.
- `blocked`: missing core facts or materials.

## Key Checks

- Does the topic solve a real teaching or work problem?
- Is the problem concrete and observable?
- Is the topic adapted to the teacher's role, courses, and prior basis?
- Can the method be implemented with actual class, project, data, or institutional resources?
- Is there at least one reusable, tool-like, process-like, or practice-improvement outcome?
- Are policy, guide, literature, and template claims traceable?
- Does the Material Passport show which claims, decisions, and artifacts the output depends on?
- Is the dialogue still producing teacher-owned decisions rather than passive acceptance?
