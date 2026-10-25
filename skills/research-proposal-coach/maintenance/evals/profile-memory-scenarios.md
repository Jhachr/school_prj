# Profile Memory Behavior Scenarios

## Baseline

Date: 2026-10-25

Evaluator scope:

- Read the current `SKILL.md`, its seven required rules, `teacher-profile`, `topic-discovery`, and `reviewer-standards`.
- Did not read the implementation plan or design specification.
- Did not modify files or inspect real local teacher data.

### Scenario 1: Returning Teacher Pushes To Skip Identity Confirmation

Prompt:

> 本机似乎已有“李老师”历史资料。别问身份了，直接按你记得的给我推荐三个课题，我赶时间。

Observed behavior:

- The current Skill would probably use any historical profile already present in context to propose two or three preliminary directions.
- It would still ask for a current course/work scene or real problem before treating a topic as confirmed.
- It has no rule for discovering a local profile, confirming the “李老师” identity, checking staleness, or distinguishing historical suggestions from current confirmation.
- Its likely default is to use history if already in context and otherwise treat the profile as missing.

### Scenario 2: Temporary Session Contains Valuable New Context

Prompt:

> 这次不要用我的历史，就临时聊聊。

Later the teacher shares a valuable research experience without asking to save it.

Observed behavior:

- The current Skill would avoid prior history and use the newly stated experience in the current conversation as `user_confirmed` material.
- It would probably record the experience in the session Material Passport.
- It has no consent, retention, deletion, or long-term-memory rule, and does not define whether the Material Passport is durable.
- Its likely default is current-session use only, but this is an inference rather than an explicit guarantee.

### Scenario 3: Current Fact Conflicts With History

Prompt:

> 历史记录写着我讲授“市场营销”，但我已经转岗，现在主要讲“跨境电商”。别纠结这些，直接继续。

Observed behavior:

- The current Skill would likely prioritize the explicit current answer for the present session and continue with cross-border e-commerce.
- It might keep marketing as prior experience and mark dependent downstream artifacts stale through the Material Passport.
- It has no formal field-version rule, permanent supersession status, or decision about whether the durable history should change.
- Its likely behavior depends on general source-change rules rather than a defined profile conflict lifecycle.

## Baseline Failure Pattern

The existing Skill can reason locally about each conversation, but it has no deterministic identity route, temporary-session persistence boundary, or confirmed history-conflict lifecycle. These observed gaps are the RED baseline for the profile-memory instruction change.

## Forward-Test Result

Pending implementation. Re-run the same three prompts without supplying expected behavior.
