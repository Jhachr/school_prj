# Product Design

这里存放“专科院校教师科研立项引导助手”的产品流程、Demo 脚本、质量标准和客户对齐材料。

当前阶段已经从第一次客户沟通的流程验证，推进到后续科研立项 Skill 开发准备。旧 Demo 材料仍可作为流程和质量规则的参考，但后续开发应以 `10-skill-development-technical-plan.md` 为主。

## 推荐阅读顺序

1. `10-skill-development-technical-plan.md`：0820 客户沟通后的 Skill 开发主方案，包含文件整理建议、架构、模块、数据契约、评测和开发阶段计划。
2. `05-stage-rule-blueprint.md`：执行源，定义状态、输入、阻断、追问、输出、来源状态和回退规则。
3. `03-proposal-quality-rubric.md`：质量源，定义 C -> B -> A 的唯一判定规则。
4. `01-novice-teacher-user-flow.md`：业务源，定义客户视角 8 个阶段和 10 个内部状态映射。
5. `04-customer-materials-request.md`：真实材料、评审标准、文献检索来源和优秀案例的资料责任清单。
6. `06-demo-output-samples.md`：空白模板和直播电商 B 级输出样例。
7. `archive/09-customer-facing-process-spec.md`：第一次流程验证 Demo 的客户说明版，已归档。
8. `archive/00-first-demo-delivery-plan.md`：第一次客户演示交付计划，已归档。
9. `archive/07-customer-confirmation-checklist.md`：第一次 Demo 会议确认清单模板，已归档。

## 关联 Demo

网页流程验证 Demo 位于 `demo/`。它是第一次客户沟通的流程验证资产，不是正式 Skill 运行时：

- `demo/index.html`：第一次客户沟通使用的主界面。
- `demo/src/state.mjs`：状态转换和 A/B/C 判定。
- `demo/src/fixtures.mjs`：直播电商演示数据。
- `demo/src/outputs.mjs`：方案卡、文献综述草稿、字段映射稿、待补充清单和质量结果。
- `demo/tests/`：状态和输出测试。

## 设计原则

1. 优先引导老师思考，不把产品定位为简单代写工具。
2. 第一版聚焦立项申请，不覆盖完整科研生命周期。
3. 客户视角统一使用 8 个业务阶段，系统内部统一使用 10 个执行状态。
4. 所有关键内容都必须标记来源状态：`user_confirmed`、`ai_suggestion`、`material_verified`、`retrieved_evidence`、`demo_fixture`、`missing`。
5. A/B/C 必须按 C -> B -> A 固定顺序判定，当前直播电商 Demo 稳定为 B。
6. 文献检索、前沿研究、政策和优秀案例服务于课题推荐与申报质量，不能伪造引用或把演示数据当作真实依据。
7. 网页 Demo 只验证流程和业务契约；正式交付将在成熟 Harness 中运行科研立项 Skill。
8. 0820 客户沟通后，后续 Skill 必须强化“导师/学伴式引导”：每个模块都应包含草稿生成、原则解释、关键追问、用户确认、修订和学习反馈。
