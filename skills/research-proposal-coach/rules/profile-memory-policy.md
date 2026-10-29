# Profile And Memory Policy

## Scope

One computer has at most one durable teacher identity. The identity is global to that computer and is not selected by working directory, project, research topic, or repository.

Human-readable Markdown under `RESEARCH_COACH_HOME` is the source of truth:

```text
teacher-profile.md
memories/research-history.md
memories/learning-feedback.md
memories/preferences.md
```

## What May Become Long-Term Memory

- Stable profile facts explicitly confirmed by the teacher.
- Important research choices the teacher explicitly confirms.
- Saved research directions or stage artifacts that have actually been created.
- Interaction preferences and learning feedback that will materially improve later coaching.

完整聊天记录不得保存为长期记忆。账号密码、Cookie、API key、无关个人标识、学生个人信息、可识别成绩和未经确认的推测也不能保存。

## Confirmation Lifecycle

1. During a module, collect a `记忆候选`; do not write it.
2. At a module boundary or session end, show proposed candidates with their purpose.
3. Ask the teacher to `逐条确认`, correct, or reject them.
4. 未经老师明确确认的候选不得写入本地档案。
5. Write accepted items only with `confirmation: user_confirmed` and only after the CLI reports success.

Batch memory review at meaningful milestones or session end. Do not interrupt every coaching turn to save a profile conflict, target change, direction, or preference; use the current-session value immediately and present the accumulated candidates together later.

When the teacher changes a direction without explaining why, keep the 方向切换原因 as `unknown（未知）` or `ai_suggestion（系统推测）`. 未经老师说明，不得把该原因标记为 `user_confirmed` or write it as the teacher's rationale.

## History Reuse

Historical information follows this transition:

```text
saved history
-> suggested_from_history（根据历史推荐）
-> current teacher review
-> user_confirmed（本次已确认） or ignored/corrected
```

History is a proposal, not a current fact. Identity selection does not confirm every historical field.

A single relevant historical item may personalize an opening question when clearly framed as a revisable clue. This does not convert it to a current fact and must not determine a topic, method, or deliverable without the teacher's current response. Do not make the teacher approve a complete history summary before ordinary conversation; show history only on request, when resolving a consequential conflict, or immediately before a specific historical fact would affect the study.

## Conflicts And Downstream Invalidation

- 当前会话中的明确回答优先于历史记录。
- Replace the active value only after current confirmation.
- Retain the old value as `superseded（已被新信息替代）`; do not silently erase the change trail.
- 将依赖旧值的下游课题选项、检索计划、证据矩阵、论点或草稿标记为`过期`或`失效`，并说明需要复核什么。
- A rushed request to “just continue” does not authorize silent durable changes, but a clear correction in the same message may be used in the current session.

## Temporary Sessions

After the teacher chooses temporary mode, do not read or write the durable profile or memories. Current-session facts may be used only in that conversation. Offer archival once at the end only as an option, without pressure. If the teacher accepts, restart the teacher-identity route and repeat item-level confirmation; never call `commit` while `session_mode` is `temporary`.

## User Controls

Natural-language requests must support:

- `查看` the stored profile and memories.
- `修改` a confirmed profile fact while preserving its superseded history.
- `导出` the durable profile and memory files without raw session working files.
- `删除一条` memory by exact memory ID and record a tombstone.
- `删除全部` personal profile and history only after exact `profile_id` confirmation.

Use `scripts/profile-store.mjs` for deterministic mutations. Never claim that a change was saved, exported, forgotten, or purged before the CLI returns success.

## Status Language

普通辅导回复不显示内部代码，直接用自然中文说明当前事实、建议及其影响，不要求教师先理解状态机。

Only memory review, export, user-control operations, maintainer inspection, and evaluation artifacts show the exact internal value. In those contexts, 英文状态必须同时显示中文含义，并解释这个状态意味着当前会话或产物可以做什么、不能做什么。

| Internal value | Teacher display | Current consequence |
|---|---|---|
| `suggested_from_history` | `suggested_from_history（根据历史推荐）` | May guide a question, but is not yet a current fact. |
| `user_confirmed` | `user_confirmed（本次已确认）` | May support current decisions and an approved durable write. |
| `superseded` | `superseded（已被新信息替代）` | Remains visible as history but must not drive current decisions. |
