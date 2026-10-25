# Material Passport Template

```markdown
## Material Passport

Session ID:

Current State:

Collaboration Mode:

Quality Grade:

Dialogue Health:

### Source Ledger

| Source ID | Status | Title Or Fact | Date | Run / Material Location | Notes |
|---|---|---|---|---|---|
| S1 |  |  |  |  |  |

### Claim Ledger

| Passport Claim ID | Claim Or External Reference | Source IDs | Status | Risk |
|---|---|---|---|---|
| C1 |  |  |  |  |
| P-LIT-1 | Literature run `literature/runs/<run-id>`; claims `C01`; records `openalex:W...` | S-LIT-1 | `retrieved_evidence` |  |

### Decision Ledger

| Decision ID | State | Decision | Confirmed By User | Notes |
|---|---|---|---|---|
| D1 |  |  |  |  |

### Artifact Ledger

| Artifact ID | Type | Version | Depends On Claims | Status |
|---|---|---|---|---|
| A1 |  | v1 |  |  |

### Quality Ledger

| State | Grade | Module Status | Blockers | Next Actions |
|---|---|---|---|---|
| quality_checking |  |  |  |  |

### Health Ledger

| State | Status | Signals | Intervention |
|---|---|---|---|
|  |  |  |  |
```

For literature claims, do not copy the claim or excerpt into this table. The run's `claims.jsonl` is the single source of that text and evidence.
