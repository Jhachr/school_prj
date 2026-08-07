# Product Design

这里存放“专科院校教师科研助手”的产品流程、demo 脚本、质量标准和客户对齐材料。

当前阶段的设计目标不是定义完整产品，而是先围绕客户最关心的“科研立项申请”场景，形成一版可演示、可讨论、可调整的流程原型。

## 当前设计产物

- `01-novice-teacher-user-flow.md`：小白老师立项申请用户流程(含纠偏收敛设计与异常处理)
- `02-demo-conversation-script.md`：第一版 demo 对话脚本(含纠偏演示片段、文献政策环节、课题方案卡与映射稿输出)
- `03-proposal-quality-rubric.md`：申报书质量检查表(含硬性门槛、证据字段、测试案例)
- `04-customer-materials-request.md`：需要客户提供的资料清单(含资料收集责任表)
- `05-stage-rule-state-table.md`：立项引导阶段规则状态表(可执行产品规则,兼容 Skill/Agent)
- `06-deliverable-templates.md`：课题方案卡与申报书字段映射稿模板
- `07-customer-confirmation-checklist.md`：第一次客户演示会议确认清单

## 设计原则

1. 优先引导老师思考，不把产品定位为简单代写工具。
2. 第一版聚焦立项申请，不覆盖完整科研生命周期。
3. 每个关键节点都要有质量判断和人工确认。
4. 文献、政策和优秀案例服务于申报质量，而不是作为独立功能堆叠。
5. demo 先验证流程是否符合客户预期，再进入 Skill 设计。
