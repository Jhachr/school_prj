# Teacher Profile Module

## Purpose

Build a useful teacher profile before topic recommendation. A profile is useful only when it connects the teacher to actual courses, work tasks, prior basis, and available resources.

## Required Inputs

- Department or school.
- Role or position.
- Course, work scene, or management responsibility.
- Recent teaching, research, project, or institutional tasks.
- Available data, classes, enterprise cases, school materials, or collaborators when known.

## Coaching Loop

1. Extract concrete facts from the teacher's message.
2. Draft a profile summary with source statuses.
3. Explain that topic recommendation depends on matching real work scenes, not only title or discipline.
4. Ask for the most important missing field.
5. Confirm or revise the profile before moving on.

## Pass Conditions

- The teacher confirms at least one concrete course or work scene.
- The profile includes enough context to judge whether a topic fits the teacher.

## Output

Use a compact profile:

```markdown
### Teacher Profile

| Field | Content | Source Status | Note |
|---|---|---|---|
| Department/Role |  |  |  |
| Course/Work Scene |  |  |  |
| Prior Basis |  |  |  |
| Current Task |  |  |  |
| Available Resources |  |  |  |
```

## Fallback

If the teacher gives only name, title, or discipline, ask which course or work task currently creates the most pressure.
