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

Date: 2026-10-25

An independent evaluator re-ran the same three prompts after reading only the installed Skill entry and files it routed to. The evaluator did not read this report, the design, implementation plan, or tests, and did not modify the repository.

### Scenario 1 Result

- The Skill asks one conversational choice—continue with 李老师's profile or chat temporarily—before reading detailed history or recommending from it. It does not narrate status checks or profile IDs.
- A rushed “按你记得的” request does not bypass the route or silently confirm historical facts.
- After identity confirmation, at most one relevant clue may personalize the opening question. It remains `suggested_from_history（根据历史推荐）` until the teacher's current response confirms or corrects it; the Skill does not require approval of a complete profile summary before useful coaching.

### Scenario 2 Result

- The Skill enters `temporary（临时会话）`, keeps `active_identity` empty, and does not read or write durable profile data.
- New research experience may support the current conversation or remain an in-session candidate, but it is not durable memory without item-level consent.
- The evaluator found a wording tension between ordinary end-of-module memory review and the optional end-of-session archive offer. The instructions were tightened: temporary sessions are not pressured, and an accepted archive offer must restart the teacher-identity route before any `commit`; `commit` is forbidden while the mode remains `temporary`.

### Scenario 3 Result

- The explicit current correction “跨境电商” becomes `user_confirmed（本次已确认）` for the current session.
- The former “市场营销” value becomes `superseded（已被新信息替代）` and can no longer drive recommendations.
- Dependent topic options, search plans, evidence matrices, arguments, or drafts are marked stale for review.
- “直接继续” permits current-session progress but does not authorize a silent durable write; saving the correction still requires item-level confirmation and a successful CLI result.

### Outcome

The previous RED gaps now have deterministic behavior: identity is explicitly routed, temporary sessions are isolated from durable data, and current corrections supersede history without silently rewriting the local profile. No unresolved loophole remains in the three tested scenarios.
