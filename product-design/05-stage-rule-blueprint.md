# 阶段规则蓝图

## 文档定位

本文件是后续 Agent/Skill 建设的执行源。它把 `01-novice-teacher-user-flow.md` 的 8 个客户阶段落成 10 个内部状态，并定义输入、阻断、追问、输出、来源状态和回退目标。

网页 Demo 和未来科研立项 Skill 不要求复用 UI 代码，但必须共享本文件定义的业务契约。

## 来源状态枚举

| 枚举 | 客户展示 | 含义 |
|---|---|---|
| `user_confirmed` | 用户确认 | 用户明确表达或确认 |
| `ai_suggestion` | AI建议 | 系统建议，尚需用户采纳 |
| `material_verified` | 真实材料 | 来自可追溯真实材料 |
| `demo_fixture` | 演示数据 | 演示占位数据，不是真实依据 |
| `missing` | 缺失 | 当前缺失 |

## 全局数据字段

| 字段 | 说明 | 默认来源状态 |
|---|---|---|
| `raw_intent` | 用户最初表达 | `user_confirmed` |
| `teacher_profile` | 教师画像 | `user_confirmed` |
| `refined_problem_area` | 收敛后的问题域 | `ai_suggestion` |
| `problem_candidates` | 候选工作问题 | `ai_suggestion` |
| `topic_options` | 候选课题方向 | `ai_suggestion` |
| `selected_topic` | 已选择课题方向 | `user_confirmed` |
| `research_question` | 核心研究问题 | `user_confirmed` 或 `ai_suggestion` |
| `evidence_basis` | 文献检索结果、前沿研究、政策、指南、案例依据 | `material_verified` 或 `demo_fixture` |
| `literature_review_draft` | 文献综述草稿 | `ai_suggestion`，依据必须可追溯 |
| `method_plan` | 研究方法路径 | `ai_suggestion` |
| `deliverables` | 预期成果 | `user_confirmed` |
| `proposal_mapping` | 申报书字段映射稿 | `ai_suggestion` |
| `missing_items` | 待补充信息 | `missing` |
| `quality_grade` | A/B/C 质量等级 | 系统判定 |

## 内部状态规则表

| 内部状态 | 客户阶段 | 必须输入 | 阻断条件 | 追问策略 | 输出字段 | 来源状态要求 | 回退目标 |
|---|---|---|---|---|---|---|---|
| `teacher_profile` | 教师画像采集 | 院系、岗位、课程或工作、近两年重点任务 | 不知道具体教学或管理场景 | 追问课程、对象、日常任务、学校要求 | `teacher_profile` | 关键字段为 `user_confirmed` | 入口 |
| `intent_refinement` | 空泛意图纠偏 | `raw_intent`、教师画像 | 只有“AI+教育”“提升质量”等口号 | 追问课程、学生群体、教学环节、可获得数据 | `refined_problem_area` | 系统判断为 `ai_suggestion`，需用户采纳 | `teacher_profile` |
| `problem_discovery` | 工作问题挖掘 | 收敛后的问题域、真实痛点 | 没有真实问题或问题不可观察 | 追问发生频率、影响对象、已有做法、失败原因 | `problem_candidates` | 候选为 `ai_suggestion`，选中项转 `user_confirmed` | `intent_refinement` |
| `topic_recommendation` | 课题方向推荐与确认 | 教师画像、候选问题、可用资源、申报导向、相关方向前沿研究 | 问题和教师工作无关 | 生成 2-3 个方向，说明前沿依据、申报理由、成果和风险 | `topic_options` | 全部为 `ai_suggestion`，前沿依据需标记来源 | `problem_discovery` |
| `topic_confirmation` | 课题方向推荐与确认 | 候选方向、教师选择、资源条件 | 用户未选择或只说“都行” | 比较兴趣、资源、学校认可度和申报风险 | `selected_topic` | 选中方向为 `user_confirmed` | `topic_recommendation` |
| `research_question` | 研究问题澄清 | 已选方向、对象、场景、目标、评价方式 | 只有题目，没有可回答问题 | 用“对象-场景-问题-方法-评价”框架追问 | `research_question` | 草案为 `ai_suggestion`，确认后为 `user_confirmed` | `topic_confirmation` |
| `evidence_support` | 文献与政策支撑 | 申报指南、政策、真实文献检索结果、优秀案例或演示数据 | 无任何依据且未标记演示数据 | 明确哪些来自真实材料，哪些只是演示占位；生成文献综述草稿 | `evidence_basis`、`literature_review_draft` | 真实材料为 `material_verified`，演示材料为 `demo_fixture`，综述草稿为 `ai_suggestion` | `research_question` |
| `method_and_outcomes` | 方法与成果设计 | 研究问题、可用资源、数据来源、成果要求 | 方法不可执行，或成果只有论文 | 追问样本、周期、数据、实施班级、工具性成果 | `method_plan`、`deliverables` | 方法可为 `ai_suggestion`，成果需 `user_confirmed` | `research_question` |
| `proposal_mapping` | 申报材料生成与质检 | 前序确认字段、来源状态、通用或真实模板 | C 级条件成立 | 只生成阶段产物，不生成正式申报书 | `proposal_mapping` | 每个字段保留来源状态 | 对应缺失字段状态 |
| `quality_checking` | 申报材料生成与质检 | 方案卡、字段映射稿、缺失项 | 发现硬性门槛缺失 | 输出 A/B/C、风险、待补充清单 | `quality_grade`、`missing_items` | 缺失项为 `missing` | 对应缺失字段状态 |

## A/B/C 判定入口

判定必须固定顺序：先判 C，再判 B，最后判 A。

| 等级 | 触发条件 | 允许输出 |
|---|---|---|
| C | 教师画像、真实工作问题、课题方向、研究对象/场景或研究问题尚未建立 | 继续追问，不生成申报材料 |
| B | C 不成立，但方法/成果仍需细化，或真实指南、真实文献检索结果、真实模板、关键确认尚未齐备 | 课题方案卡、文献综述草稿、申报书字段映射稿、待补充清单、质量结果 |
| A | 核心字段全部确认，方法和数据来源可执行，存在非论文成果，并已接入真实指南、真实文献检索结果和真实申报模板 | 额外生成申报书结构化内容草稿，仍需人工和专家审核 |

当前直播电商 Demo 使用 `demo_fixture` 指南、`demo_fixture` 文献综述依据和 `missing` 模板，必须稳定判定为 B。

## 异常输入处理

| 情况 | 处理策略 |
|---|---|
| 用户回答模糊 | 不进入下一状态，给出 2-4 个选择题帮助收敛 |
| 用户拒绝回答 | 说明该字段会影响哪些输出；允许跳过但标为 `missing` |
| 用户中途改方向 | 保留旧方向到备选区，回退到 `topic_recommendation` |
| 用户要求直接生成 | 如果 C 成立，只输出追问；如果 B 成立，只输出阶段性材料 |
| 用户上传材料但未说明用途 | 先识别材料类型，再询问用于政策、模板、案例还是过往成果 |

## 通过原则

1. 不因用户说“可以”就默认通过，必须满足字段条件。
2. `ai_suggestion` 不能替代 `user_confirmed`。
3. `demo_fixture` 不能伪装成 `material_verified`。
4. C 级不生成申报材料。
5. B 级不生成正式申报书草稿。
6. A 级也只能生成结构化内容草稿，不能称为可直接提交。
