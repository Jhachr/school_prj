# 专科院校教师科研教练

本仓库沉淀“专科院校教师科研教练”项目的需求证据、产品决策、可运行 Skill、验证场景和分发工具。

项目采用“仓库即上下文”：新加入的成员或 Agent 应能仅通过仓库判断项目为什么存在、当前行为由什么定义、哪些资料已经过时，以及一次修改应如何验证。重要决策不能只留在聊天记录或计划文档里，必须进入当前 Skill、测试或评估场景。

## 当前产品

当前交付物由两个一起安装的 Skill 组成：[`research-proposal-coach`](skills/research-proposal-coach/SKILL.md) 负责科研辅导，[`session-to-feishu-doc`](skills/session-to-feishu-doc/SKILL.md) 负责在用户明确同意后，把当前可见会话脱敏保存到飞书并通知指定接收者。科研教练不是一键代写工具，会话上传也不是静默遥测。

目前已经具备：

- 教师身份、临时会话和长期记忆的明确边界；
- 一条统一的五阶段研究主线；
- 支持旁支问题后返回主线的导航状态；
- 探索性检索、聚焦文献综述和逐条证据追溯；
- 研究工具、干预材料和大型产物的生成门槛；
- 对确认疲劳、提问疲劳和流程跑偏的检测；
- 流程结束或暂停时只提议一次的自愿会话反馈，以及用户主动提出上传时的确认流程；
- Trae CN、Codex 和自定义目录的命令行安装；
- 自动化测试和真实交互评估场景。

## 什么是当前事实

仓库中的资料按以下优先级理解。出现冲突时，以更靠前的内容为准：

1. **运行规则**：两个 `skills/*/SKILL.md` 以及它们引用的规则、模块和脚本。
2. **行为验证**：两个 Skill 的 `tests/` 与科研教练的 `maintenance/evals/`，用于固定已经确认的交互和质量边界。
3. **客户证据**：`customer-communications/raw/` 保存原始沟通，`summaries/` 保存可追溯的需求理解。

已经被实现替代的旧 Demo、8/10 状态蓝图、实施计划、压缩包和会话生成物不继续保留在当前工作树中；需要追溯时使用 Git 历史。当前结论必须落实到上述三类资料之一，不能只存在于聊天或临时计划中。

## 当前主流程

唯一主流程定义在 [`rules/stage-contract.md`](skills/research-proposal-coach/rules/stage-contract.md)：

| 阶段 | 要完成的核心决定 | 典型阶段结果 |
|---|---|---|
| 找到真实问题 | 谁在什么场景遇到什么可观察问题，现有做法为什么不够 | 真实问题表述 |
| 明确目标与研究问题 | 研究目标、核心问题及结论边界 | 研究焦点工作快照 |
| 建立证据与研究设计 | 文献或本地依据、对象、干预或探究、比较、指标、数据、可行性和伦理如何配合 | 证据与设计工作快照 |
| 开发并验证工具或材料 | 小样是否与问题和指标一致，如何评审或试用 | 经检查的原型或工具草稿 |
| 形成目标产物并安排实施 | 将已有决定和证据压缩成与目标一致的产物，并明确限制和真实下一步 | 教学改进、论文、课题申报或其他约定产物 |

“开发并验证工具或材料”是条件阶段：研究不需要新建或改造题库、量表、量规、课程包、干预材料时，可以说明原因后跳过。

身份与记忆、文献检索、文件生成、来源管理、质量检查和对话健康都是主流程的支持系统，不是另外几条让教师追赶的流水线。

## 当前交互原则

- 每轮只要求一个有意义的用户动作；信息足够时可以不提新问题，直接推进。
- 开放描述使用正文问题；封闭路由使用少量选项；半开放决定提供候选并保留组合或改写入口。
- 教师的明确选择、纠正、改写或继续指令已经拥有对应决定，不得再次形式化确认。
- 研究方向卡、研究骨架卡和设计卡是系统维护的工作快照，不是依次审批的节点。
- 只有新增推断、信息冲突，或会改变研究问题、方法、证据、成果、可行性和结论边界的缺口才需要提问。
- 第二张结构化卡片再次要求整卡确认时，视为 `card_confirmation_cascade`，应停止确认流水线、合并已知信息并继续推进。
- 旁支问题可以即时回答，但必须保留并恢复原主线；不能因为最新问题容易生成产物就悄悄换阶段。
- 论文、课题申报和教学改进是目标路由。目标暂未确定时可以继续公共上游研究，但不能默认生成某类目标产物。
- 身份授权和长期记忆写入仍需明确确认；工作卡片免确认不削弱隐私边界。

更详细的交互规则见：

- [`guidance-principles.md`](skills/research-proposal-coach/rules/guidance-principles.md)
- [`dialogue-health.md`](skills/research-proposal-coach/rules/dialogue-health.md)
- [`human-ai-collaboration.md`](skills/research-proposal-coach/rules/human-ai-collaboration.md)
- [`research-backbone-card.md`](skills/research-proposal-coach/templates/research-backbone-card.md)

## 质量、证据与记忆边界

内部质量按 C → B → A 判断，但普通教师对话只显示“继续梳理”“可形成阶段材料”“可形成目标结构稿”。阶段材料不能伪装成已验证、可直接提交的最终产物。

所有重要主张必须区分教师事实、系统建议、已核验材料、检索证据、演示数据和缺失信息。文献标题或少量检索结果不能直接证明研究结论或研究空白；正式综述必须保存可访问证据片段、位置、限制、记录关联，并通过一致性检查。

长期记忆只保存教师明确同意的结构化事实、决定、偏好、反馈和已存在的产物引用。临时会话不读取或写入长期档案；完整聊天、账号凭证、学生个人信息和未经确认的推断不得进入长期记忆。

权威规则入口：

- [`quality-rubric.md`](skills/research-proposal-coach/rules/quality-rubric.md)
- [`source-policy.md`](skills/research-proposal-coach/rules/source-policy.md)
- [`material-passport.md`](skills/research-proposal-coach/rules/material-passport.md)
- [`profile-memory-policy.md`](skills/research-proposal-coach/rules/profile-memory-policy.md)
- [`method-outcome-design.md`](skills/research-proposal-coach/modules/method-outcome-design.md)
- [`literature-review.md`](skills/research-proposal-coach/modules/literature-review.md)

## 仓库结构

```text
.
├── customer-communications/
│   ├── raw/                  # 客户原始沟通，不用后来的理解覆盖原话
│   └── summaries/            # 从原始材料提炼的需求、决定和未决问题
├── scripts/
│   └── install-research-proposal-coach.sh
└── skills/
    ├── research-proposal-coach/
    │   ├── SKILL.md              # 科研辅导入口、路由和硬边界
    │   ├── rules/                # 主流程、来源、质量、记忆和交互规则
    │   ├── modules/              # 当前阶段与会话分享模块
    │   ├── templates/            # 工作快照、报告和长期记忆模板
    │   ├── scripts/              # 画像、检索与证据一致性工具
    │   ├── tests/                # 自动化行为与脚本测试
    │   ├── maintenance/evals/    # 真实交互回归场景
    │   └── maintenance/update-log.md
    └── session-to-feishu-doc/
        ├── SKILL.md              # 会话上传、同意、脱敏和事务规则
        ├── scripts/              # 配置、创建、授权和通知工具
        └── tests/                # 配置与上传回归测试
```

`skills/research-proposal-coach/` 和 `skills/session-to-feishu-doc/` 是两个 Skill 的唯一编辑源。不要直接修改 Trae、Codex 或其他宿主的安装副本后再反向覆盖仓库。

## 推荐阅读路径

新成员或 Agent 处理普通功能修改时：

1. 阅读本 README，确认资料优先级。
2. 阅读 [`SKILL.md`](skills/research-proposal-coach/SKILL.md)。
3. 阅读 [`stage-contract.md`](skills/research-proposal-coach/rules/stage-contract.md) 和与问题直接相关的规则。
4. 只加载当前阶段需要的模块和模板，不一次性加载无关材料。
5. 查看对应测试与 `maintenance/evals/`，再修改实现。

按问题类型可直接进入：

| 要处理的问题 | 首选入口 |
|---|---|
| 用户体验、提问或确认疲劳 | `rules/guidance-principles.md`、`rules/dialogue-health.md`、`maintenance/evals/coaching-interaction-scenarios.md` |
| 主流程跑偏、阶段切换、目标切换 | `rules/stage-contract.md`、`tests/research-navigation.test.mjs` |
| 教师画像、临时模式、长期记忆 | `modules/session-entry.md`、`rules/profile-memory-policy.md`、画像相关测试 |
| 文献检索、引用与证据追溯 | `modules/literature-review.md`、`rules/source-policy.md`、检索脚本与测试 |
| 题库、量表、量规或干预材料 | `modules/method-outcome-design.md`、`templates/research-backbone-card.md` |
| 课题申报字段映射 | `modules/proposal-mapping.md`，并先确认当前目标和真实指南模板 |
| 会话结束提议、上传同意或飞书反馈 | `modules/session-sharing.md`、`skills/session-to-feishu-doc/SKILL.md` |
| 客户为什么提出这些需求 | `customer-communications/raw/` 与对应 `summaries/` |

## 本地验证

运行 Skill 的全部测试：

```bash
node --test skills/research-proposal-coach/tests/*.test.mjs
node --test skills/session-to-feishu-doc/tests/*.test.mjs
```

检查 Skill 结构（本机已安装 Codex 系统 Skill 时）：

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" \
  skills/research-proposal-coach
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" \
  skills/session-to-feishu-doc
```

检查补丁格式和安装脚本入口：

```bash
git diff --check
sh scripts/install-research-proposal-coach.sh --help
```

## 安装与本地同步

安装到 Trae CN：

```bash
curl -fsSL \
  'https://gitee.com/jhachr/school_prj/raw/main/scripts/install-research-proposal-coach.sh' \
  | sh -s -- --target trae
```

安装到 Codex：

```bash
curl -fsSL \
  'https://gitee.com/jhachr/school_prj/raw/main/scripts/install-research-proposal-coach.sh' \
  | sh -s -- --target codex
```

安装到自定义目录：

```bash
curl -fsSL \
  'https://gitee.com/jhachr/school_prj/raw/main/scripts/install-research-proposal-coach.sh' \
  | sh -s -- --dest /path/to/skills
```

以上每条命令都会同时安装两个 Skill。安装脚本默认通过公开的 Gitee HTTPS 仓库 `https://gitee.com/jhachr/school_prj.git` 执行 Git sparse checkout，不要求安装者配置 Gitee SSH Key；它只下载两个 Skill 目录，并在复制前检查两个目标，任一同名目录已存在时整体停止。它默认拉取 `main`，所以未提交、未推送到 Gitee 的修改不会进入命令行安装版本。

测试尚未合并到 `main` 的 `codex` 分支时，安装脚本本身和 Skill 内容必须使用同一个分支：

```bash
curl -fsSL \
  'https://gitee.com/jhachr/school_prj/raw/codex/scripts/install-research-proposal-coach.sh' \
  | sh -s -- --target codex --ref codex
```

第一次上传时，用户只需对助手说“初始化会话反馈上传”。向导会完成飞书应用与用户授权，并配置接收者。会话上传始终需要明确同意；配置的接收者必须能被当前飞书应用和租户识别，跨租户 `open_id` 不保证可用。

开发时需要把仓库版本同步到本机 Trae 安装目录，可使用：

```bash
rsync -a --exclude '.DS_Store' \
  skills/research-proposal-coach/ \
  "${TRAE_HOME:-$HOME/.trae-cn}/skills/research-proposal-coach/"

rsync -a --exclude '.DS_Store' \
  skills/session-to-feishu-doc/ \
  "${TRAE_HOME:-$HOME/.trae-cn}/skills/session-to-feishu-doc/"
```

同步后应在新对话中使用，或重新加载宿主的 Skill 列表。

## 更新仓库上下文

一次新的客户讨论或真实使用反馈，应按以下方式进入仓库：

1. 原始材料进入 `customer-communications/raw/`，保留来源和上下文。
2. 整理后的需求、决定和未决问题进入 `summaries/`；不要只在截图、聊天或会议记录里留下决定。
3. 会改变行为的结论落实到 `SKILL.md`、规则、模块或模板。
4. 为真实失败补充 `maintenance/evals/` 场景；适合自动判断的约束再进入 `tests/`。
5. 运行完整测试和 Skill 结构校验，并更新 `maintenance/update-log.md`。
6. 只有主流程、边界、目录或开发方式变化时才更新本 README，避免复制模块细节造成双重真相。

检索目录、会话导出、题库、综述和其他运行产物默认不进入版本库。只有经过整理并进入规则、评估或客户总结的内容，才成为项目上下文。
