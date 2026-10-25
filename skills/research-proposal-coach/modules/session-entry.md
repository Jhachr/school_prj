# Session Entry Module

## Purpose

Choose whether this conversation uses the one local teacher identity or runs as a temporary session before ordinary research coaching begins.

## Inspect Local Status

Resolve this Skill's own directory and run:

```text
node <skill-root>/scripts/profile-store.mjs status
```

The status command may reveal only whether a profile exists and, when ready, its display name. Do not read detailed profile or memory files until the teacher accepts that identity.

## Routes

| Store result | Route | Required action |
|---|---|---|
| `profile missing` | First use | Explain local storage, request consent, collect minimum fields, show a summary, and initialize only after confirmation. |
| `profile ready` | Returning use | Ask “是否以 X 老师身份继续？” before reading or applying detailed history. |
| Teacher declines the ready identity | `temporary（临时会话）` | Continue without durable profile or memory access. |
| `profile malformed` | Recovery | Preserve the file, enter `只读模式`, and explain the diagnostic/recovery path. |

## First Use

1. Explain that the profile will be stored locally under `RESEARCH_COACH_HOME`, is not divided by workspace or topic, and can later be viewed, exported, corrected, or deleted.
2. Ask for `memory_consent`. A refusal starts a temporary session and creates no profile.
3. Collect only display name, department/professional field, role/responsibility, one course/work scene, and recent priority or research basis.
4. Show the proposed profile and ask the teacher to correct or confirm it.
5. Only after explicit confirmation, run `profile-store.mjs init` with `session_mode: teacher` and the confirmed JSON payload.
6. Treat initialization as successful only when the CLI returns a success result.

## Returning Use

1. Ask exactly one identity question: “检测到本机的 X 老师档案，是否以 X 老师身份继续？”
2. If accepted, set `active_identity` and `session_mode`, then read the local profile and relevant memory files.
3. Show a short list of facts proposed for reuse as `suggested_from_history（根据历史推荐）`.
4. Let the teacher confirm, correct, ignore, or delete proposed facts before they affect the current topic.
5. Convert only current-session confirmations to `user_confirmed（本次已确认）`.

## Temporary Session

选择临时会话后不得读取教师画像和记忆，也不得写入教师画像、长期记忆、历史产物或墓碑记录。

Information shared later may support the current conversation, but it remains session-only. At the end of the conversation, the assistant may offer to archive confirmed items to the local teacher identity. 会话结束归档必须获得老师明确同意并逐条确认；silence or continued conversation is not consent.

## Malformed Profile

- Do not repair or overwrite the malformed file automatically.
- Keep profile and memory use in read-only mode.
- Report the file path and diagnostic message returned by the CLI.
- Offer export/recovery guidance or a deliberate user-authorized rebuild.

## Session State

```json
{
  "active_identity": null,
  "session_mode": "unrouted",
  "memory_consent": false,
  "history_reuse": [],
  "memory_candidates": []
}
```

Do not enter ordinary coaching modules until `session_mode` is `teacher` or `temporary`.
