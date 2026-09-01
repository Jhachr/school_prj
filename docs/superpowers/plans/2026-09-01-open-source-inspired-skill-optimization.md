# Open-Source-Inspired Skill Optimization Plan

## Goal

Optimize `skills/research-proposal-coach` for low-cost development while borrowing the strongest reusable ideas from the local `academic-research-skills` repository.

## Borrowed Patterns

- Human-AI collaboration: keep the teacher as the owner of topic, facts, and final judgment.
- Stage pipeline: use explicit checkpoints instead of a loose conversation flow.
- Material Passport: keep a lightweight ledger for sources, claims, decisions, artifacts, quality, and health.
- Socratic guidance: use State -> Challenge -> Reflect questioning before turning weak input into proposal text.
- Dialogue health: monitor passive acceptance, premature convergence, source slippage, and overproduction.

## Implementation Scope

- Update Skill entry instructions and required reading.
- Add collaboration and Material Passport rules.
- Strengthen the stage contract with checkpoint types and return conditions.
- Upgrade guidance rules with Socratic questioning and question budgets.
- Add dialogue-health rules and quality-report fields.
- Extend evaluation templates so future pilot cases can judge traceability and coaching health.

## Out Of Scope For This Pass

- Runtime state database.
- Multi-agent orchestration.
- Automatic literature search integration.
- UI changes.
- Formal JSON schema validation.

## Validation

- Validate the Skill package with the system skill validator.
- Run repository tests that already exist.
- Run whitespace diff checks.
- Inspect diff and status to make sure no unrelated file was reverted.
