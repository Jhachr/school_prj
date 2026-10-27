# Quality Rubric

Always evaluate in this exact order: C -> B -> A. Record one internal grade only.

## Teacher-Facing Readiness

The letter grade is an internal control, not a label for the teacher. In ordinary coaching replies, show the matching natural-language readiness instead:

| Internal Grade | Teacher-Facing Readiness |
|---|---|
| C | `继续梳理` |
| B | `可形成阶段材料` |
| A | `可形成目标结构稿` |

Show the raw C/B/A grade only in maintainer checks, evaluation artifacts, or when the teacher explicitly asks to inspect the rubric. Do not make the teacher learn the internal grading system before they can continue.

## C: Keep Asking, Do Not Generate Proposal Materials

Grade C applies when any condition is true:

| Condition | Return To |
|---|---|
| Session identity route is unresolved. | `identity_and_memory` support route. |
| Real work or teaching problem is not established. | `real_problem`. |
| Research direction, object, or answerable core question is missing. | `research_focus`. |

Allowed outputs:

- Clarifying questions.
- Direction options.
- Examples of better input.
- A short explanation of why proposal material would be premature.

Disallowed outputs:

- Topic card as if confirmed.
- A full measurement instrument or intervention package.
- Goal-specific paper, teaching-improvement, or application mapping.
- Formal target deliverable.

## B: Generate Stage Materials Only

Grade B applies when C does not apply, but any condition is true:

| Condition | Status |
|---|---|
| Evidence, method, comparison, indicator, or data path needs detail. | `missing` or `ai_suggestion` |
| A full instrument is requested before its validation route is clear. | `missing` |
| A goal-specific output is requested while `current_goal` is `undetermined`. | `missing` |
| Required literature or local evidence is absent. | `missing` or `demo_fixture` |
| A project application is requested but the real guide or template is absent. | `missing` or `demo_fixture` |

Allowed outputs:

- Topic card.
- Literature review draft with source labels.
- Evidence-and-design card.
- A small discussion prototype.
- Goal-compatible partial mapping.
- Missing items.
- Quality report.
- Learning feedback.

Disallowed outputs:

- A formal or directly submittable target document.
- A full research instrument presented as validated when its review route is incomplete.
- Unlabeled literature claims.
- Unverified school-policy claims.

## A: Generate Target-Aligned Structured Draft

Grade A requires all common conditions:

1. Session route is resolved as teacher or temporary mode.
2. `real_problem` and `research_focus` are teacher-owned.
3. `evidence_and_design` is coherent enough for the requested conclusion.
4. Any instrument or intervention used by the target output has a proportionate validation or pilot route.
5. `current_goal` is explicit and matches the requested deliverable.
6. Material Passport contains source, claim, decision, artifact, quality, and health records for the current output.
7. Dialogue health is not `red`.

Apply the matching goal-specific condition:

- `teaching_improvement`: implementation resources, observation or evaluation plan, and reusable practice outcome are plausible.
- `paper`: literature basis, data path, analysis direction, and claim boundary are explicit.
- `project_application`: application guide and school template are `material_verified`, and required literature evidence is traceable.

Allowed outputs include all B outputs plus a structured target-aligned draft. The output must still state that human and expert review is required.

## Module-Level Status

Each module records one internal status. Ordinary teacher-facing replies use the natural-language version:

| Internal Status | Teacher-Facing Wording |
|---|---|
| `pass` | `可以继续` |
| `needs_revision` | `还需补充或调整` |
| `blocked` | `暂时不能推进，需先补齐关键信息` |

## Key Checks

- Does the work solve a real teaching or work problem?
- Is the problem concrete and observable?
- Is the topic adapted to the teacher's role, courses, and prior basis?
- Can the method be implemented with actual class, project, data, or institutional resources?
- Does the requested output match `current_goal` rather than an assumed paper or application?
- If a full instrument is included, is its validation route visible?
- Are policy, guide, literature, and template claims traceable?
- Does the Material Passport show which claims, decisions, and artifacts the output depends on?
- Is the dialogue still producing teacher-owned decisions rather than passive acceptance?
