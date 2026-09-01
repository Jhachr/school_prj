# Material Passport

The Material Passport is a lightweight provenance ledger for a proposal session. It prevents the skill from losing track of what came from the teacher, what came from verified materials, what came from retrieval, and what is only an assistant suggestion.

Use it for any session that spans more than one exchange or produces stage artifacts.

## Required Sections

| Section | Purpose |
|---|---|
| Session envelope | Identify the teacher, current stage, date, and collaboration mode. |
| Source ledger | Record user facts, customer materials, retrieved evidence, demo fixtures, and missing sources. |
| Claim ledger | Map important proposal claims to source ids and source statuses. |
| Decision ledger | Record confirmed choices, skipped confirmations, and user overrides. |
| Artifact ledger | Track topic cards, literature drafts, method tables, mappings, and quality reports. |
| Quality ledger | Track grade, module status, blockers, and next actions. |
| Health ledger | Track dialogue-health status and intervention taken. |

## Minimal JSON Shape

```json
{
  "passport_id": "string",
  "session_id": "string",
  "current_state": "teacher_profile",
  "collaboration_mode": "explore",
  "source_ledger": [
    {
      "source_id": "S1",
      "source_status": "user_confirmed",
      "title": "string",
      "date": "YYYY-MM-DD",
      "notes": "string"
    }
  ],
  "claim_ledger": [
    {
      "claim_id": "C1",
      "claim": "string",
      "source_ids": ["S1"],
      "source_status": "user_confirmed",
      "risk": "low"
    }
  ],
  "decision_ledger": [
    {
      "decision_id": "D1",
      "state": "topic_confirmation",
      "decision": "string",
      "confirmed_by_user": false,
      "notes": "string"
    }
  ],
  "artifact_ledger": [
    {
      "artifact_id": "A1",
      "artifact_type": "topic_card",
      "version": "v1",
      "source_claim_ids": ["C1"],
      "quality_grade": "B"
    }
  ],
  "quality_ledger": [
    {
      "state": "quality_checking",
      "grade": "B",
      "module_status": "needs_revision",
      "blockers": ["real literature retrieval missing"],
      "next_actions": ["retrieve or provide literature evidence"]
    }
  ],
  "health_ledger": [
    {
      "state": "topic_confirmation",
      "status": "yellow",
      "signals": ["teacher accepted topic without example"],
      "intervention": "asked for one concrete teaching scenario"
    }
  ]
}
```

## Update Rules

- Add a source entry before using a material or retrieval result to support a claim.
- Add a claim entry for each substantive topic, problem, literature, method, outcome, innovation, or policy statement.
- Convert `ai_suggestion` to `user_confirmed` only after explicit acceptance or user edits.
- Mark downstream artifacts `stale` in the notes when the teacher changes topic, research question, method, or source basis.
- A missing source remains visible until replaced by `material_verified` or `retrieved_evidence`.
- Do not use the passport to skip final human review.

## Low-Cost Implementation

In plain chat or Markdown-only operation, the assistant may keep the passport as a compact table instead of JSON. The required behavior is traceability, not a specific storage engine.
