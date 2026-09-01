# Stage Contract

The first version focuses on vocational-college teachers who do not yet know what research project to apply for. The flow keeps the original 8 customer-facing stages and 10 internal states, but each state uses a coaching loop rather than a one-way pipeline.

The pipeline is stage-based and checkpointed. A stage can advance only when its required facts, source statuses, dialogue health, and user confirmation are good enough for the next stage.

## Customer-Facing Stages

1. Teacher profile collection.
2. Vague-intent correction.
3. Work-problem discovery.
4. Topic recommendation and confirmation.
5. Research-question clarification.
6. Literature and policy grounding.
7. Method and outcome design.
8. Proposal material mapping and quality review.

## Internal States

| State | Stage | Required Before Passing | Output |
|---|---|---|---|
| `teacher_profile` | Teacher profile collection | Department, role, course/work scene, recent tasks or research basis. | Teacher profile summary. |
| `intent_refinement` | Vague-intent correction | Initial idea tied to course, student group, work task, data, or outcome. | Refined problem area. |
| `problem_discovery` | Work-problem discovery | Observable real problem, affected group, current practice, failure or gap. | Confirmed work problem candidates. |
| `topic_recommendation` | Topic recommendation and confirmation | Profile, problem, resources, school/policy orientation, preliminary evidence. | 2-3 topic options with reasons and risks. |
| `topic_confirmation` | Topic recommendation and confirmation | Teacher selects or edits a topic direction. | Selected topic. |
| `research_question` | Research-question clarification | Object, scene, problem, method direction, evaluation angle. | Core question and subquestions. |
| `evidence_support` | Literature and policy grounding | Real guide, policy, literature, case, or explicit missing status. | Evidence records and literature review. |
| `method_and_outcomes` | Method and outcome design | Method path, data/resource conditions, non-paper deliverables. | Problem-method-outcome table. |
| `proposal_mapping` | Proposal material mapping and quality review | Confirmed upstream fields and template requirements. | Field mapping and compressed sections. |
| `quality_checking` | Proposal material mapping and quality review | All available artifacts and missing items. | A/B/C grade, risks, next actions. |

## Checkpoint Types

| Type | Use For | User Action | Assistant Action |
|---|---|---|---|
| `SLIM` | Low-risk factual summaries and small edits. | Confirm, correct, or add a short example. | Update state and passport; continue if no blocker appears. |
| `FULL` | Topic, research question, method path, outcomes, and proposal mapping. | Choose, revise, or explicitly approve the decision. | Explain trade-offs; record decision; do not treat silence as approval. |
| `MANDATORY` | Quality grade, source integrity, and final structured content readiness. | Acknowledge risks and missing items. | Apply C -> B -> A rubric; block disallowed outputs. |

## Stage Pipeline

| From State | Gate Type | Advance When | Return When |
|---|---|---|---|
| `teacher_profile` | `SLIM` | Profile includes role, work scene, and current basis. | Role or scene is missing. |
| `intent_refinement` | `SLIM` | Intent is tied to a concrete course, student group, workflow, data, or outcome. | Intent remains a slogan. |
| `problem_discovery` | `FULL` | Real problem, affected group, current practice, and gap are confirmed. | Problem is not observable or not owned by the teacher. |
| `topic_recommendation` | `FULL` | 2-3 options are compared with reasons, risks, and source statuses. | Options are generic or detached from the teacher profile. |
| `topic_confirmation` | `FULL` | Teacher selects or edits one topic direction. | Teacher is unsure or chooses only because the assistant recommends it. |
| `research_question` | `FULL` | Core question and subquestions are answerable and implementable. | The question is still a slogan, task list, or outcome statement. |
| `evidence_support` | `MANDATORY` | Literature, policy, guide, case, or missing status is recorded in the passport. | Claims lack source status or retrieval/material record. |
| `method_and_outcomes` | `FULL` | Method path, data/resource path, and at least one non-paper outcome are plausible. | Method is only conceptual or outcomes are only papers. |
| `proposal_mapping` | `MANDATORY` | Upstream artifacts are current and template requirements are known or marked missing. | Mapping exposes stale or contradictory upstream decisions. |
| `quality_checking` | `MANDATORY` | Grade and allowed outputs are clear. | Any C blocker remains. |

## Coaching Loop For Every State

```text
Recognize user input
-> Draft a structured interpretation
-> Explain the judgment principle
-> Ask Socratic targeted questions
-> Get user confirmation or edits
-> Revise the draft
-> Update Material Passport
-> Check quality, source statuses, and dialogue health
-> Record learning feedback
```

## Session State

Maintain or request this state when a multi-turn session exists:

```json
{
  "session_id": "string",
  "current_state": "teacher_profile",
  "teacher_profile": {},
  "raw_intent": "",
  "refined_problem_area": {},
  "problem_candidates": [],
  "topic_options": [],
  "selected_topic": {},
  "research_questions": [],
  "evidence_records": [],
  "literature_review": {},
  "method_plan": {},
  "deliverables": [],
  "innovation_points": [],
  "proposal_mapping": {},
  "quality_grade": "C",
  "missing_items": [],
  "learning_feedback": [],
  "interaction_metrics": {},
  "material_passport": {},
  "dialogue_health": {
    "status": "green",
    "signals": [],
    "last_intervention": ""
  }
}
```

## Required Human Confirmation Points

Pause for teacher confirmation before treating these as facts:

- Teacher profile summary.
- Real work problem.
- Selected topic direction.
- Core research question.
- Literature and policy relevance.
- Method path and available data.
- Non-paper outcomes.
- Proposal field mapping.

## Fallback Rules

- Vague answers stay in the current state.
- If the teacher changes direction, keep the old topic as an alternative and return to `topic_recommendation`.
- If proposal mapping exposes weak topic logic, return to `topic_confirmation` or `research_question`.
- If a missing template, guide, or literature source blocks grade A, produce missing items rather than pretending the material exists.
- If dialogue health is `red`, pause generation and repair the weakest upstream state.
