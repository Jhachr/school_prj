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
- Included records.
- Excluded or uncertain records when relevant.

## Conversion Rules

- `ai_suggestion` becomes `user_confirmed` only after the teacher explicitly accepts or edits it.
- `demo_fixture` never becomes `material_verified`.
- Missing evidence does not block all coaching, but it blocks grade A.
- Literature, policy, and excellent-case statements must be downgraded to `missing` when no traceable source exists.

## Output Rule

When producing cards, mappings, reviews, or proposal drafts, include the status next to each field. If compact prose is needed, add a short "来源状态" section after the main text.

## Passport Rule

For multi-turn sessions, mirror each important source and claim into the Material Passport described in `rules/material-passport.md`. The passport is the running index; this file defines the meaning of each source status.
