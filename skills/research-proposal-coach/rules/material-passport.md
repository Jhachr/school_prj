# Material Passport

The Material Passport is a lightweight provenance ledger for a proposal session. It prevents the skill from losing track of what came from the teacher, what came from verified materials, what came from retrieval, and what is only an assistant suggestion.

Use it for any session that spans more than one exchange or produces phase artifacts.

## Required Sections

| Section | Purpose |
|---|---|
| Session envelope | Identify the teacher, current phase, current goal, resume point, date, and collaboration mode. |
| Source ledger | Record user facts, customer materials, literature-run references, demo fixtures, and missing sources. |
| Claim ledger | Map important proposal claims to source ids and source statuses; for literature claims, point to the run claim ID rather than copying its text. |
| Decision ledger | Record confirmed choices, skipped confirmations, and user overrides. |
| Artifact ledger | Track topic cards, literature drafts, method tables, mappings, and quality reports. |
| Quality ledger | Track grade, module status, blockers, and next actions. |
| Health ledger | Track dialogue-health status and intervention taken. |

## Minimal JSON Shape

```json
{
  "passport_id": "string",
  "session_id": "string",
  "current_phase": "real_problem",
  "current_goal": "undetermined",
  "resume_phase": null,
  "collaboration_mode": "explore",
  "source_ledger": [
    {
      "source_id": "S1",
      "source_status": "user_confirmed",
      "title": "string",
      "date": "YYYY-MM-DD",
      "notes": "string"
    },
    {
      "source_id": "S-LIT-1",
      "source_status": "retrieved_evidence",
      "title": "Literature run",
      "date": "YYYY-MM-DD",
      "literature_run": "literature/runs/<run-id>",
      "notes": "OpenAlex retrieval and saved records"
    }
  ],
  "claim_ledger": [
    {
      "claim_id": "C1",
      "claim": "string",
      "source_ids": ["S1"],
      "source_status": "user_confirmed",
      "risk": "low"
    },
    {
      "claim_id": "P-LIT-1",
      "source_ids": ["S-LIT-1"],
      "source_status": "retrieved_evidence",
      "external_reference": {
        "literature_run": "literature/runs/<run-id>",
        "literature_claim_ids": ["C01"],
        "record_ids": ["openalex:W123"]
      },
      "risk": "medium"
    }
  ],
  "decision_ledger": [
    {
      "decision_id": "D1",
      "phase": "research_focus",
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
      "phase": "delivery_and_action",
      "grade": "B",
      "module_status": "needs_revision",
      "blockers": ["real literature retrieval missing"],
      "next_actions": ["retrieve or provide literature evidence"]
    }
  ],
  "health_ledger": [
    {
      "phase": "research_focus",
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
- For a literature run, store its path plus relevant claim and record IDs. Keep the literature claim text and evidence only in that run's `claims.jsonl`; do not duplicate them in the passport.
- Convert `ai_suggestion` to `user_confirmed` only after explicit acceptance or user edits.
- Record decisions against the canonical five phases from `rules/stage-contract.md`; do not recreate the retired 8-stage or 10-state pipeline in the passport.
- When answering a side question, preserve `current_phase` and record `resume_phase` until the main line is restored.
- Mark downstream artifacts `stale` in the notes when the teacher changes topic, research question, method, or source basis.
- A missing source remains visible until replaced by `material_verified` or `retrieved_evidence`.
- Do not use the passport to skip final human review.

## Low-Cost Implementation

In plain chat or Markdown-only operation, the assistant may keep the passport as a compact table instead of JSON. The required behavior is traceability, not a specific storage engine.
