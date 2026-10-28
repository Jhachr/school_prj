# 科研教练 Skill 目录 README 设计

## 目标

在 `skills/research-proposal-coach/README.md` 新增一份中文维护说明，使接手项目的研发人员或 Agent 不必先通读全部文件，也能理解 Skill 目录中各文件夹的职责、相互关系、推荐阅读顺序和修改后的验证方式。

该 README 同时为非技术验收者提供简短导览，但主要服务 Skill 的维护、评审和交接，不替代根目录项目 README，也不复制各规则和模块的完整正文。

## 受众

第一受众：

- 接手维护 `research-proposal-coach` 的研发人员和 Agent；
- 需要判断修改入口、影响范围和验证方式的代码评审者。

第二受众：

- 验收核心交付物、希望理解交付组成的客户项目负责人；
- 需要快速判断 Skill 是否包含规则、工具、模板和验证材料的非技术读者。

## 文档位置与边界

- 新建文件：`skills/research-proposal-coach/README.md`。
- `SKILL.md` 仍是运行入口和行为路由，不把维护说明写入 `SKILL.md`。
- 根目录 `README.md` 仍负责解释整个仓库；Skill README 只解释 `skills/research-proposal-coach/` 内部。
- 本次不修改规则、模块、脚本、测试或评估场景，不改变 Skill 行为。
- 不逐行复述每个文件，避免 README 与当前实现形成两套事实来源。

## 内容结构

README 按以下顺序组织：

1. **目录定位**：说明这是项目核心交付物和唯一编辑源，并区分 `README.md` 与 `SKILL.md` 的职责。
2. **快速目录树**：列出所有一级目录，并展开对理解职责有帮助的二级目录，如 `scripts/lib/`、`tests/fixtures/`、`tests/helpers/` 和 `maintenance/evals/`。
3. **各文件夹说明**：为每个一级目录说明“放什么、何时读取、修改后检查什么”。覆盖：
   - `agents/`
   - `rules/`
   - `modules/`
   - `templates/`
   - `scripts/`
   - `tests/`
   - `maintenance/`
   - `examples/`
   - `references/`
4. **关键顶层文件**：分别说明 `SKILL.md` 和本 README 的角色。
5. **组件关系**：用简洁文本链路说明 `SKILL.md → rules/modules → templates/scripts → tests/evals` 的运行与验证关系。
6. **推荐阅读路径**：分别给出维护者、问题定位者和交付验收者的最短阅读路径。
7. **按修改类型定位**：用表格把常见需求映射到首选目录和必须检查的验证材料。
8. **验证命令**：列出完整 Node 测试、Skill 结构校验、补丁格式检查和安装脚本入口检查。
9. **README 维护规则**：仅在目录职责、顶层入口、验证方式或推荐阅读路径变化时更新，模块内部细节由对应文件维护。

## 目录说明原则

- 使用中文解释职责，保留真实目录名和文件名，便于搜索和跳转。
- 所有 Markdown 文件引用使用相对链接，确保在 GitHub 和本地仓库中可访问。
- 对空的 `references/` 明确说明当前未启用，避免读者误以为遗漏交付内容；未来只有重型参考资料才放入其中。
- 区分自动化测试与行为评估：`tests/` 固定可自动判断的约束，`maintenance/evals/` 保存需要人工或模型评审的真实交互回归场景。
- 区分运行资产与维护资产：`rules/`、`modules/`、`templates/`、`scripts/` 影响实际运行；`tests/`、`maintenance/`、`examples/` 支撑验证、维护和理解。
- 不写容易失效的文件数量或行数。

## 验证

新增 README 后执行：

```bash
node --test skills/research-proposal-coach/tests/*.test.mjs
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" \
  skills/research-proposal-coach
git diff --check
sh scripts/install-research-proposal-coach.sh --help
```

同时进行文档一致性检查：

- README 中列出的目录均实际存在；
- 相对 Markdown 链接均可解析到文件；
- README 覆盖所有一级目录，包括当前为空的 `references/`；
- 未把根目录仓库说明或 `SKILL.md` 的运行规则复制成长篇正文。

## 完成标准

- `skills/research-proposal-coach/README.md` 能独立回答“这个 Skill 下每个文件夹是什么内容”；
- 维护者能从 README 找到修改入口、关联验证和推荐阅读顺序；
- 非技术验收者能理解交付物由运行规则、辅导模块、模板、工具和验证材料共同组成；
- 所有链接、目录和验证命令与当前仓库一致；
- 改动直接提交到 `main`，完整验证通过后推送到 `origin/main`。
