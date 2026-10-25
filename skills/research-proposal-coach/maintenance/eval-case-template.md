# Evaluation Case Template

Copy this template for each real or synthetic evaluation case.

```markdown
# Eval Case: concise-case-name

## User Input

## Available Materials

| Material | Source Status | Notes |
|---|---|---|

## Expected Stage

## Expected Session Route

- `teacher` / `temporary` / `read-only recovery`:
- Durable profile reads allowed:
- Durable writes allowed:
- Required confirmation before the next action:

## Expected History Handling

- Historical facts proposed as `suggested_from_history（根据历史推荐）`:
- Facts requiring `user_confirmed（本次已确认）`:
- Conflicts requiring `superseded（已被新信息替代）`:
- Downstream artifacts to invalidate:

## Expected Grade

## Expected Allowed Outputs

## Expected Disallowed Outputs

## Expected Missing Items

## Expected Material Passport Checks

## Expected Dialogue Health

## Reviewer Notes

## Actual Result Summary

## Actual Passport Or Traceability Gaps

## Actual Health Gaps

## Actual Profile Or Memory Gaps

- Identity route:
- Temporary-session isolation:
- History confirmation:
- Durable-write evidence:

## Follow-Up Rule Or Template Change
```
