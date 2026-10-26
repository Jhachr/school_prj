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
| `profile missing` | First use | Ask one low-friction route question: start a temporary session now or create a local profile now. |
| `profile ready` | Returning use | Ask “是否以 X 老师身份继续？” before reading or applying detailed history. |
| Teacher declines the ready identity | `temporary（临时会话）` | Continue without durable profile or memory access. |
| `profile malformed` | Recovery | Preserve the file, enter `只读模式`, and explain the diagnostic/recovery path. |

## First Use

首次使用只问一个路由问题，不先索取五项资料：

> 可以先临时聊，方向清楚后再决定是否保存；也可以现在建立教师档案。你想先临时聊，还是现在建档？

Recommend `先临时聊` as the fastest, lowest-burden route. Present the two routes as a closed choice and do not combine the route question with research-background questions.

- If the teacher chooses temporary mode, set `memory_consent: false` and `session_mode: temporary`, then enter ordinary coaching immediately. Do not read or write durable profile data.
- If the teacher chooses to create a profile now, briefly explain that it is stored locally under `RESEARCH_COACH_HOME`, is not divided by workspace or topic, and can later be viewed, exported, corrected, or deleted.
- For profile creation, request `memory_consent`, then 一次性收集 display name, department/professional field, role/responsibility, one course/work scene, and recent priority or research basis in one compact prose prompt. Do not split these fields across consecutive menus.
- Show one compact proposed profile. A correction or “按这个建档” counts as confirmation; do not ask for a second confirmation.
- Only after confirmation, run `profile-store.mjs init` with `session_mode: teacher` and the confirmed JSON payload. Treat initialization as successful only when the CLI returns success.

## Returning Use

1. Ask exactly one identity question: “检测到本机的 X 老师档案，是否以 X 老师身份继续？”
2. If accepted, set `active_identity` and `session_mode`, then read the local profile and relevant memory files.
3. Show a short list of facts proposed for reuse as `suggested_from_history（根据历史推荐）`.
4. Let the teacher confirm, correct, ignore, or delete proposed facts before they affect the current topic.
5. Convert only current-session confirmations to `user_confirmed（本次已确认）`.

## Temporary Session

选择临时会话后不得读取教师画像和记忆，也不得写入教师画像、长期记忆、历史产物或墓碑记录。

Information shared later may support the current conversation, but it remains session-only. At the end of the conversation, the assistant may offer archival once as an option and must not pressure the teacher. 会话结束归档必须获得老师明确同意并逐条确认；silence or continued conversation is not consent.

老师同意归档后，必须先重新进入教师身份路由，确认或创建本机教师身份，再重新展示待保存条目。`session_mode` 仍为 `temporary` 时不得运行 `profile-store.mjs commit`；身份切换和逐条确认都完成后才允许提交。

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
