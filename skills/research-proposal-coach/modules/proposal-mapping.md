# Proposal Mapping Module

## Purpose

Compress confirmed upstream work into school proposal fields only when `current_goal` is `project_application`.

## Required Inputs

- Confirmed teacher profile.
- `current_goal: project_application`.
- Selected topic.
- Research questions.
- Literature review.
- Method and outcome map.
- Innovation points.
- School proposal template or explicit missing status.
- Application guide and word limits when available.

## Coaching Loop

1. Read the available template and guide, or mark them as missing.
2. Map confirmed content into fields.
3. Compress long-form thinking into proposal-section length.
4. Preserve source status for every field.
5. Run the quality rubric.
6. Ask the teacher to review fields that remain `ai_suggestion`.

## Pass Conditions

- C-grade blockers are absent.
- Proposal fields clearly show missing materials and review needs.

## Output

Use `templates/proposal-field-mapping.md`, `templates/missing-items.md`, and `templates/quality-report.md`.

## Fallback

If `current_goal` is `paper` or `teaching_improvement`, do not force proposal fields; route to the matching paper structure or implementation plan. If the goal is `undetermined`, keep shared upstream work and ask for goal routing only when the requested output depends on it.

If the real application template is missing, use a generic field mapping and mark template support as `missing`. Do not claim school-template conformity.
