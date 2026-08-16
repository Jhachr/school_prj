# Product Design

这里存放“专科院校教师科研立项引导助手”的产品流程、Demo 脚本、质量标准和客户对齐材料。

当前阶段不是定义完整科研助手，而是完成第一次客户沟通的验证轮包：用流程、规则、网页交互 Demo 和展示材料，让客户确认科研立项 Agent 的业务契约。

## 推荐阅读顺序

1. `00-first-demo-delivery-plan.md`：第一次客户演示交付目标和边界。
2. `01-novice-teacher-user-flow.md`：业务源，定义客户视角 8 个阶段和 10 个内部状态映射。
3. `05-stage-rule-blueprint.md`：执行源，定义状态、输入、阻断、追问、输出、来源状态和回退规则。
4. `03-proposal-quality-rubric.md`：质量源，定义 C -> B -> A 的唯一判定规则。
5. `02-demo-conversation-script.md`：直播电商连续案例的演示脚本。
6. `06-demo-output-samples.md`：空白模板和直播电商 B 级输出样例。
7. `09-customer-facing-process-spec.md`：客户说明版，只展示业务阶段、阶段产物和人工确认点。
8. `07-customer-confirmation-checklist.md`：第一次 Demo 会议确认清单。
9. `04-customer-materials-request.md`：第二版真实材料 Demo 前的资料责任清单。
10. `08-demo-format-recommendation.md`：Demo 展示形式建议。
11. `10-demo-major-selection-rationale.md`：直播电商专业选择依据和官方来源记录。

## 关联 Demo

网页流程验证 Demo 位于 `demo/`：

- `demo/index.html`：第一次客户沟通使用的主界面。
- `demo/src/state.mjs`：状态转换和 A/B/C 判定。
- `demo/src/fixtures.mjs`：直播电商演示数据。
- `demo/src/outputs.mjs`：方案卡、字段映射稿、待补充清单和质量结果。
- `demo/tests/`：状态和输出测试。

## 设计原则

1. 优先引导老师思考，不把产品定位为简单代写工具。
2. 第一版聚焦立项申请，不覆盖完整科研生命周期。
3. 客户视角统一使用 8 个业务阶段，系统内部统一使用 10 个执行状态。
4. 所有关键内容都必须标记来源状态：`user_confirmed`、`ai_suggestion`、`material_verified`、`demo_fixture`、`missing`。
5. A/B/C 必须按 C -> B -> A 固定顺序判定，当前直播电商 Demo 稳定为 B。
6. 文献、政策和优秀案例服务于申报质量，不能伪造引用或把演示数据当作真实依据。
7. 网页 Demo 只验证流程和业务契约；正式交付将在成熟 Harness 中运行科研立项 Skill。
