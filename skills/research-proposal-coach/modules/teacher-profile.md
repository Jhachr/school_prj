# Teacher Profile Module

## Purpose

Build a useful teacher profile before topic recommendation. A profile is useful only when it connects the teacher to actual courses, work tasks, prior basis, and available resources.

Enter this module only after `modules/session-entry.md` has selected teacher or temporary mode.

## Required Inputs

- Department or school.
- Role or position.
- Course, work scene, or management responsibility.
- Recent teaching, research, project, or institutional tasks.
- Available data, classes, enterprise cases, school materials, or collaborators when known.

## Coaching Loop

1. Extract concrete facts from the teacher's current message.
2. In teacher mode, present relevant history as `suggested_from_history（根据历史推荐）`; 历史记录不等于本次确认。
3. Draft a profile summary with source statuses and explain what each status changes in this session.
4. Explain that topic recommendation depends on matching real work scenes, not only title or discipline.
5. Ask for the most important missing or stale field.
6. Convert a field to `user_confirmed（本次已确认）` only after the teacher confirms or corrects it now.
7. When the current answer conflicts with history, keep the current value and mark the old value `superseded（已被新信息替代）` after explicit confirmation.
8. Confirm or revise the profile before moving on.

## Pass Conditions

- The teacher confirms at least one concrete course or work scene.
- The profile includes enough context to judge whether a topic fits the teacher.
- Any historical fact that affects the current topic has been confirmed, corrected, or left unused.

## Output

Use a compact profile:

```markdown
### Teacher Profile

| Field | Content | Source Status | Current-session consequence |
|---|---|---|---|
| Department/Role |  |  |  |
| Course/Work Scene |  |  |  |
| Prior Basis |  |  |  |
| Current Task |  |  |  |
| Available Resources |  |  |  |
```

## Fallback

If the teacher gives only name, title, or discipline, ask which course or work task currently creates the most pressure.

In temporary mode, build only an in-session profile summary and do not read or write durable profile files.
