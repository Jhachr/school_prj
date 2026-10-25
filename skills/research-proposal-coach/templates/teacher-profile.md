---
profile_id: "{{profile_id}}"
display_name: "{{display_name}}"
created_at: "{{created_at}}"
updated_at: "{{updated_at}}"
memory_consent: true
---

# 教师画像

这份档案只保存老师已经确认、且对后续科研辅导有持续价值的信息。

| 字段 | 内容 | 来源状态 | 最后确认时间 | 历史 |
|---|---|---|---|---|
| 院系或专业领域 | {{department_or_field}} | user_confirmed（本次已确认） | {{updated_at}} |  |
| 岗位或主要职责 | {{role_or_responsibility}} | user_confirmed（本次已确认） | {{updated_at}} |  |
| 课程或工作场景 | {{course_or_work_scene}} | user_confirmed（本次已确认） | {{updated_at}} |  |
| 近期重点任务或科研基础 | {{recent_focus_or_research_basis}} | user_confirmed（本次已确认） | {{updated_at}} |  |

## 状态说明

- `suggested_from_history（根据历史推荐）`：来自既往档案，本次还没有重新确认。
- `user_confirmed（本次已确认）`：老师在当前会话中已经确认，可以用于本次判断。
- `superseded（已被新信息替代）`：旧值仍留在历史中，但不得继续作为当前事实。
