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

## History Reuse

Historical information follows this transition:

```text
saved history
-> suggested_from_history（根据历史推荐）
-> current teacher review
-> user_confirmed（本次已确认） or ignored/corrected
```

History is a proposal, not a current fact. Identity selection does not confirm every historical field.

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

英文状态必须同时显示中文含义，并解释这个状态意味着当前会话或产物可以做什么、不能做什么。Do not require the teacher to infer behavior from an internal code.

| Internal value | Teacher display | Current consequence |
|---|---|---|
| `suggested_from_history` | `suggested_from_history（根据历史推荐）` | May guide a question, but is not yet a current fact. |
| `user_confirmed` | `user_confirmed（本次已确认）` | May support current decisions and an approved durable write. |
| `superseded` | `superseded（已被新信息替代）` | Remains visible as history but must not drive current decisions. |
