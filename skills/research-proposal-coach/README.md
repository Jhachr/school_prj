# Research Proposal Coach Skill

本目录是“专科院校教师科研教练”的核心交付物，也是该 Skill 的唯一编辑源。它把科研辅导的运行入口、跨阶段规则、阶段模块、输出模板、可执行工具和验证材料放在同一目录中。可选的会话反馈上传由同仓库的 [`session-to-feishu-doc`](../session-to-feishu-doc/SKILL.md) 配套 Skill 执行，两者由根目录安装脚本一起安装。

如果你第一次接手项目，先阅读本 README 了解目录，再阅读 [`SKILL.md`](SKILL.md) 了解 Agent 实际执行的入口与路由。整个仓库的项目背景、客户证据和安装方式见[仓库 README](../../README.md)。不要直接修改 Trae、Codex 或其他宿主中的已安装副本后再覆盖本目录。

## 快速目录树

```text
research-proposal-coach/
├── README.md               # 目录地图、阅读路径和维护说明
├── SKILL.md                # Agent 运行入口、路由与硬边界
├── agents/                 # 宿主展示元数据
├── rules/                  # 跨模块生效的流程、质量、来源和交互规则
├── modules/                # 按当前研究阶段加载的辅导模块
├── templates/              # 工作快照、报告、综述和长期记忆模板
├── scripts/                # 画像、文献检索与证据一致性工具
│   └── lib/                # 命令行工具复用的实现模块
├── tests/                  # 可自动判断的行为与脚本回归测试
│   ├── fixtures/           # 测试输入样本
│   └── helpers/            # 测试辅助工具
├── maintenance/            # 评估场景、资料吸收指南和更新记录
│   └── evals/              # 需要人工或模型判断的真实交互回归场景
├── examples/               # 帮助理解质量边界的完整示例
└── references/             # 预留给体量较大的外部参考资料
```

## 顶层文件

| 文件 | 作用 | 什么时候修改 |
|---|---|---|
| [`SKILL.md`](SKILL.md) | Skill 的运行入口，定义启动与身份路由、工作姿态、必读材料、硬边界和默认主流程。 | 入口路由、全局行为边界或必读依赖变化时。 |
| `README.md` | 面向维护者的目录地图，不参与 Agent 的运行指令。 | 目录职责、主要入口、阅读路径或验证方式变化时。 |

## 各文件夹说明

### `agents/`：宿主展示与发现元数据

当前包含 [`openai.yaml`](agents/openai.yaml)，仅定义 Skill 在支持该格式的宿主中使用的 `display_name` 与 `short_description`。这里负责“如何被看见”，不承载科研辅导规则。

调整或验收宿主中的显示名称与简短说明时读这里。修改后至少检查 YAML 可解析、两个字段与 `SKILL.md` 的实际能力一致，并运行 Skill 结构校验。

### `rules/`：跨阶段统一生效的规则

这里保存多个模块共同遵守的权威约束。它回答“无论处于哪个研究阶段，都必须怎样做”。主要文件包括：

- [`stage-contract.md`](rules/stage-contract.md)：唯一的五阶段研究主线、阶段切换和旁支返回规则；
- [`guidance-principles.md`](rules/guidance-principles.md)：单轮动作、提问和推进方式；
- [`dialogue-health.md`](rules/dialogue-health.md)：确认疲劳、提问疲劳和流程跑偏检查；
- [`human-ai-collaboration.md`](rules/human-ai-collaboration.md)：教师、Agent 与专家的职责边界；
- [`quality-rubric.md`](rules/quality-rubric.md)：内部 C、B、A 质量等级及对外表达；
- [`reviewer-standards.md`](rules/reviewer-standards.md)：选题与研究方案的评审视角；
- [`source-policy.md`](rules/source-policy.md)：来源状态、引用和证据追溯；
- [`material-passport.md`](rules/material-passport.md)：大型产物生成前后的材料护照要求；
- [`profile-memory-policy.md`](rules/profile-memory-policy.md)：教师画像、会话信息和长期记忆边界。

改变 `rules/` 往往会影响多个模块。修改前先查找引用方，修改后运行完整测试，并在 `maintenance/evals/` 中检查是否存在对应交互场景。

### `modules/`：按需加载的科研辅导模块

模块负责某一类具体辅导任务，通常由 `SKILL.md` 根据当前阶段和用户目标按需加载：

| 模块 | 负责内容 |
|---|---|
| [`session-entry.md`](modules/session-entry.md) | 判断临时会话、已有教师档案或新建档案等入口路由。 |
| [`teacher-profile.md`](modules/teacher-profile.md) | 在授权边界内建立和维护教师画像。 |
| [`topic-discovery.md`](modules/topic-discovery.md) | 从真实教学或工作问题中发现可研究方向。 |
| [`research-question.md`](modules/research-question.md) | 收敛研究目标、核心问题和结论边界。 |
| [`literature-review.md`](modules/literature-review.md) | 规划检索、管理证据并形成可追溯综述。 |
| [`method-outcome-design.md`](modules/method-outcome-design.md) | 设计对象、干预或探究、比较、指标、数据与成果。 |
| [`innovation-design.md`](modules/innovation-design.md) | 基于已有问题、证据和方法判断创新点。 |
| [`proposal-mapping.md`](modules/proposal-mapping.md) | 把已确认内容映射到真实申报指南和字段。 |
| [`learning-feedback.md`](modules/learning-feedback.md) | 收集使用反馈并形成可授权保存的学习记录。 |
| [`session-sharing.md`](modules/session-sharing.md) | 在真实结束或暂停节点只提议一次会话反馈，并把明确请求路由到配套上传 Skill。 |

修改模块时，应同时检查它引用的 `rules/` 和 `templates/`，并优先运行与该能力对应的测试和评估场景。

### `templates/`：结构化工作产物与记忆模板

模板约束 Agent 如何记录和呈现中间状态，避免临时文本逐渐变成不可追溯的事实。当前可分为四组：

- 研究工作快照：[`topic-card.md`](templates/topic-card.md)、[`research-backbone-card.md`](templates/research-backbone-card.md)、[`material-passport.md`](templates/material-passport.md)；
- 质量与缺口：[`quality-report.md`](templates/quality-report.md)、[`missing-items.md`](templates/missing-items.md)；
- 文献与申报输出：[`literature-review-longform.md`](templates/literature-review-longform.md)、[`literature-review-proposal-section.md`](templates/literature-review-proposal-section.md)、[`proposal-field-mapping.md`](templates/proposal-field-mapping.md)；
- 长期档案：[`teacher-profile.md`](templates/teacher-profile.md)、[`preferences.md`](templates/preferences.md)、[`research-history.md`](templates/research-history.md)、[`learning-feedback-memory.md`](templates/learning-feedback-memory.md)、[`session-memory-review.md`](templates/session-memory-review.md)。

生成或调整对应工作快照、质量报告、综述、申报映射或长期档案时读这里。修改模板字段后，检查相关模块、画像存储脚本和模板测试，避免读写双方对字段理解不一致。

### `scripts/`：可执行工具及其复用实现

这里的 Node.js 工具为需要确定性和可追溯性的操作提供实现：

- [`profile-store.mjs`](scripts/profile-store.mjs)：教师档案和长期记忆的命令行入口；
- [`search-literature.mjs`](scripts/search-literature.mjs)：执行文献检索并保存运行记录；
- [`check-literature-run.mjs`](scripts/check-literature-run.mjs)：检查文献运行目录、记录和证据引用的一致性；
- `lib/`：命令行入口共享的底层模块，目前包含画像存储与文献记录转换逻辑。

需要持久化画像、执行文献检索或核对证据一致性时读相应 CLI 与 `lib/`。修改脚本时先修改或补充对应的 `tests/*.test.mjs`，再运行单项测试和完整测试。脚本产生的画像、检索目录和会话产物属于运行数据，不应写回 Skill 目录。

### `tests/`：自动化回归测试

这里使用 Node.js 内置测试框架固定能够自动判断的行为和工具约束，包括：

- Skill 指令是否正确连接主流程、画像、记忆和交互边界；
- 会话上传提议是否自愿、只出现一次，并与长期记忆和研究阶段分离；
- 画像存储和命令行操作是否符合授权、路径与数据安全要求；
- 文献记录转换、检索和一致性检查是否稳定；
- 模板、目录说明和关键文件是否保持完整。

`fixtures/` 保存稳定的测试输入样本，`helpers/` 保存临时目录等测试辅助实现。新增真实失败时，如果能用确定性断言判断，就在这里增加回归测试。

修改运行规则、模板或脚本前先读对应测试；修改测试、`fixtures/` 或 `helpers/` 后先运行受影响的单项测试，再运行完整测试。

### `maintenance/`：维护过程与行为评估材料

该目录不直接参与普通教师对话，而是帮助团队持续更新和评估 Skill：

- [`eval-case-template.md`](maintenance/eval-case-template.md)：新增评估案例的统一格式；
- `evals/`：保存画像记忆、文献流程和辅导交互等真实场景，适合人工或模型评审；
- [`material-ingestion-guide.md`](maintenance/material-ingestion-guide.md)：把访谈、文件和反馈转化为规则或评估材料的方法；
- [`update-log.md`](maintenance/update-log.md)：记录影响行为或维护方式的重要更新。

真实使用暴露的问题应先进入 `evals/` 形成可复现案例；能稳定自动判断的部分再下沉到 `tests/`。

吸收新资料、复现真实交互问题或记录行为变更时读这里。修改后应复核评估场景与现行规则、模块是否一致，并判断是否需要同步自动化测试和更新日志。

### `examples/`：完整示例

当前的 [`live-commerce-b-grade.md`](examples/live-commerce-b-grade.md) 展示一个达到 B 级、可以形成阶段材料但尚不应冒充最终成果的案例。示例用于帮助维护者理解多份规则组合后的预期结果，不是可直接复制给所有教师的固定答案。

修改质量等级、材料护照或输出边界时，应检查示例是否仍与现行规则一致。

### `references/`：重型参考资料预留目录

该目录当前只有[目录说明](references/README.md)，没有运行时参考资料。只有无法合理放入 `SKILL.md`、`rules/` 或 `modules/` 的大体量稳定参考资料才应放在这里。新增资料时必须从运行入口或相关模块明确链接，不能把未被引用的资料当成生效规则。

## 这些部分如何协作

```text
宿主发现 agents/openai.yaml
        ↓
Agent 进入 SKILL.md
        ↓
加载跨阶段 rules/ + 当前任务 modules/
        ↓
按需使用 templates/ 形成结构化状态，调用 scripts/ 完成确定性操作
        ↓
tests/ 固定自动约束，maintenance/evals/ 检查真实交互质量
```

规则决定边界，模块组织具体辅导过程，模板保存过程状态，脚本执行可重复操作；测试和评估共同证明前四者仍按预期协作。

## 推荐阅读路径

### 第一次接手维护

1. 阅读本 README 和 [`SKILL.md`](SKILL.md)；
2. 阅读 [`rules/stage-contract.md`](rules/stage-contract.md)，建立唯一主流程；
3. 按当前任务阅读一个相关模块及其引用的规则和模板；
4. 查看相应 `tests/` 与 `maintenance/evals/`，理解已经固定的边界；
5. 修改后运行单项测试、完整测试和 Skill 结构校验。

### 定位真实交互问题

1. 先在 `maintenance/evals/` 查找相近场景；
2. 判断问题属于跨阶段规则还是单一模块；
3. 查找相关模板、脚本和自动化测试；
4. 先补充可复现案例或失败测试，再修改运行材料。

### 验收交付内容

1. 用本 README 确认目录组成；
2. 阅读 [`SKILL.md`](SKILL.md) 确认运行入口和边界；
3. 查看 `examples/` 理解阶段成果；
4. 查看 `tests/` 和 `maintenance/evals/` 理解验证覆盖；
5. 回到[仓库 README](../../README.md)查看安装与项目背景。

## 按修改类型定位

| 修改目标 | 首选入口 | 同时检查 |
|---|---|---|
| 改变五阶段流程、阶段切换或旁支返回 | `rules/stage-contract.md` | `SKILL.md`、导航测试、交互评估场景 |
| 减少确认疲劳或优化提问方式 | `rules/guidance-principles.md`、`rules/dialogue-health.md` | 辅导交互测试与评估场景 |
| 调整教师画像或长期记忆 | `modules/session-entry.md`、`modules/teacher-profile.md`、`rules/profile-memory-policy.md` | 画像模板、画像脚本和画像测试 |
| 调整文献检索与证据追溯 | `modules/literature-review.md`、`rules/source-policy.md` | 文献脚本、文献测试和文献评估场景 |
| 调整研究设计、工具或成果 | `modules/method-outcome-design.md` | 研究骨架模板、质量规则和示例 |
| 调整申报书字段映射 | `modules/proposal-mapping.md` | 真实指南、字段模板和来源规则 |
| 调整会话结束提议或上传路由 | `modules/session-sharing.md` | `session-entry.md`、配套 `session-to-feishu-doc` 及分享测试 |
| 改变工作卡片或报告字段 | `templates/` | 使用该模板的模块、脚本和模板测试 |
| 改变命令行工具行为 | `scripts/` | 对应单项测试与完整测试 |
| 新增客户材料或真实失败 | `maintenance/material-ingestion-guide.md` | `maintenance/evals/`、可自动化时再更新 `tests/` |

## 本地验证

运行全部自动化测试：

```bash
node --test skills/research-proposal-coach/tests/*.test.mjs
```

在仓库根目录检查 Skill 结构：

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" \
  skills/research-proposal-coach
```

检查补丁格式和安装脚本入口：

```bash
git diff --check
sh scripts/install-research-proposal-coach.sh --help
```

## 维护本 README

只有以下变化需要更新本 README：

- 新增、删除或改变一级目录职责；
- `SKILL.md`、关键规则或维护入口发生结构性变化；
- 推荐阅读路径或验证命令变化；
- 某类材料从运行资产转为维护资产，或反向迁移。

模块内部步骤、规则细节和模板字段应在各自文件中维护。本 README 只保存稳定的目录级事实，避免形成第二套运行规则。
