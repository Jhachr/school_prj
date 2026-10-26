# Source Policy

Every substantive proposal claim must carry a source status. A good answer makes the status visible enough that a teacher, reviewer, or maintainer can tell what is fact, suggestion, verified material, retrieved evidence, demo/example content, or missing.

## Source Statuses

| Status | Meaning | May Support Proposal Claims? |
|---|---|---|
| `user_confirmed` | The teacher explicitly stated or confirmed this. | Yes, as teacher context or intent. |
| `ai_suggestion` | The assistant generated this as a recommendation, draft, interpretation, or rewrite. | Only after user review; cannot replace confirmation. |
| `material_verified` | A customer-provided or otherwise traceable school material supports this. | Yes, with source name and date. |
| `retrieved_evidence` | A real search or database retrieval supports this. | Yes, with retrieval source, query, date, and record details. |
| `demo_fixture` | Example or demonstration data. | No for real applications; only for demos and regression cases. |
| `missing` | Required information is absent. | No; add it to missing items. |

## Required Metadata

For `material_verified`, record:

- Material title or file name.
- Provider or source.
- Date received or accessed.
- Relevant section, page, or field if available.

For `retrieved_evidence`, record:

- Retrieval source or database.
- Search query.
- Search date.
- Run directory and included record IDs.
- Excluded or uncertain records when relevant.

## Literature Record Controls

Retrieval provenance and record fitness are separate judgments:

| Field | Values | Rule |
|---|---|---|
| Screening | `included`, `uncertain`, `excluded` | Only `included` records may support review claims. |
| Verification | `verified`, `unresolved`, `conflicted`, `rejected` | `conflicted` and `rejected` records must not be cited. |

When showing verification status to a teacher, include its Chinese meaning:

- `verified`（已核验）：关键信息能够匹配，并记录了核对来源。
- `unresolved`（暂未核验）：当前公共源无法确认；不等于论文不存在。
- `conflicted`（信息冲突）：DOI、标题、作者或年份存在冲突。
- `rejected`（已排除）：标识明确不存在或记录明显错误。

An `unresolved` record with a traceable abstract or saved readable material may support a narrowly worded claim, but the output must show the limitation. A title alone may expand a search and cannot support a research finding. Missing DOI does not by itself require exclusion.

## Conversion Rules

- `ai_suggestion` becomes `user_confirmed` only after the teacher explicitly accepts or edits it.
- `demo_fixture` never becomes `material_verified`.
- Missing evidence does not block all coaching, but it blocks grade A.
- Literature, policy, and excellent-case statements must be downgraded to `missing` when no traceable source exists.
- A literature claim is traceable only when its claim ID points to an included, allowed record and an accessible excerpt plus location in the same literature run.

## Output Rule

Exact source codes are required in the Material Passport, maintainer artifacts, and evaluation records. 教师可见的普通回复使用自然语言说明依据，不要求教师识别内部代码：

| Internal Status | Teacher-Facing Wording |
|---|---|
| `user_confirmed` | `你已确认` |
| `ai_suggestion` | `这是系统建议，待你判断` |
| `material_verified` | `已有可追溯材料支持` |
| `retrieved_evidence` | `已有检索证据支持` |
| `demo_fixture` | `这是示例，不能作为正式依据` |
| `missing` | `还缺相关材料或信息` |

When producing cards, mappings, reviews, or proposal drafts for the teacher, attach these natural-language cues only where the distinction affects trust or next action; do not stamp every field mechanically. If the teacher or maintainer explicitly asks to inspect provenance, show the natural-language wording together with the exact internal code.

## Passport Rule

For multi-turn sessions, mirror each important source and claim into the Material Passport described in `rules/material-passport.md`. For literature, mirror only the run path and relevant claim and record IDs; keep claim text and excerpts in `claims.jsonl`. The passport is the running index; this file defines the meaning of each source status.
