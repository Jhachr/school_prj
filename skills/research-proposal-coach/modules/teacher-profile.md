# Teacher Profile Module

## Purpose

Use the minimum current context needed to connect research coaching to actual courses, work tasks, prior basis, and available resources. Do not turn profile review into a mandatory form before the teacher can have a useful conversation.

Enter this module only after `modules/session-entry.md` has selected teacher or temporary mode.

## Required Inputs

- Department or school.
- Role or position.
- Course, work scene, or management responsibility.
- Recent teaching, research, project, or institutional tasks.
- Available data, classes, enterprise cases, school materials, or collaborators when known.

## Coaching Loop

1. Extract concrete facts from the teacher's current message.
2. In teacher mode, use at most one relevant historical clue as `suggested_from_history（根据历史推荐）`; 历史记录不等于本次确认。Do not inventory all saved fields at startup.
3. Ask a useful scene or intent question immediately. Draft a profile summary only when the teacher asks to inspect it or a consequential conflict requires review.
4. Explain that topic recommendation depends on matching real work scenes, not only title or discipline.
5. Ask for the most important missing or stale field only when its answer would change the current research decision.
6. Convert a field to `user_confirmed（本次已确认）` only after the teacher confirms or corrects it now.
7. When the current answer conflicts with history, keep the current value and mark the old value `superseded（已被新信息替代）` after explicit confirmation.
8. Continue coaching once enough current context exists; do not require approval of a complete profile card.

## Pass Conditions

- The teacher supplies or confirms at least one concrete course or work scene when the current task needs it.
- The profile includes enough context to judge whether a topic fits the teacher.
- Any historical fact that affects the current topic has been confirmed, corrected, or left unused.

## Output

When profile inspection is actually needed, use a compact profile:

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
