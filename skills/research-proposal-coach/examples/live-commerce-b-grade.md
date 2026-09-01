# Live Commerce B-Grade Example

This example is adapted from the earlier flow validation demo. It is a regression case for source labeling and grade B behavior.

## Input Facts

| Field | Content | Source Status |
|---|---|---|
| Teacher | Network marketing and live commerce teacher. | `user_confirmed` |
| Course Scene | New media live operation, online store operation, copywriting. | `user_confirmed` |
| Real Problem | Students can imitate livestream scripts but cannot complete product selection, audience analysis, script planning, execution, and data review as one workflow. | `user_confirmed` |
| Topic | Job-task-oriented live commerce practical training reform. | `ai_suggestion` then teacher confirmation required |
| Research Question | How can enterprise livestream job tasks be converted into practical training projects and data-review rubrics to improve students' planning, execution, and review abilities? | `user_confirmed` |
| Guide | Example guide only. | `demo_fixture` |
| Literature | Example literature clue only. | `demo_fixture` |
| School Template | Not provided. | `missing` |

## Expected Grade

B.

## Expected Reason

C does not apply because teacher profile, real problem, topic direction, and research question are present. A does not apply because real guide, real literature retrieval, and real template are missing.

## Allowed Outputs

- Topic card.
- Literature review draft with demo or missing status.
- Proposal field mapping.
- Missing items.
- Quality report.
- Learning feedback.

## Disallowed Outputs

- Formal proposal draft.
- Claims that the literature review is based on real retrieval.
- Claims that the mapping matches the school's actual template.
