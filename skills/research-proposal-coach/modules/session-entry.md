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

“临时”只表示不进入教师画像和长期记忆，不表示所有本地文件都不会产生。这些工作文件可能写入当前项目或工作目录。If the task creates 工作产物、检索记录、source excerpts, or validation reports, tell the teacher before the first write, show the path, and distinguish them from durable memory.

Information shared later may support the current conversation and may appear in an explicitly requested working artifact, but it must not become durable teacher memory. Never say “哪里都没有保存” when task files or retrieval records exist. At the end of the conversation, the assistant may offer archival once as an option and must not pressure the teacher. 会话结束归档必须获得老师明确同意并逐条确认；silence or continued conversation is not consent.

这里的教师画像归档与“提交当前会话帮助改进产品”是两件事。完整会话上传走 `modules/session-sharing.md` 和配套的 `session-to-feishu-doc`，必须单独说明接收者、内容范围和脱敏方式并取得明确同意。沉默不代表同意；拒绝后不追问；上传不影响继续使用，也不写入教师画像或长期记忆。

老师同意归档后，必须先重新进入教师身份路由，确认或创建本机教师身份，再重新展示待保存条目。`session_mode` 仍为 `temporary` 时不得运行 `profile-store.mjs commit`；身份切换和逐条确认都完成后才允许提交。

本机已经存在教师档案时，不得提供看似可以并存的“新建第二个身份”选项。直接说明只有一个身份位，并提供“沿用现有身份”或“导出备份后替换现有身份”两条真实可执行的路径。

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
  "memory_candidates": [],
  "session_share_offer": "not_offered",
  "session_share_requested": false
}
```

Do not enter ordinary coaching modules until `session_mode` is `teacher` or `temporary`.
