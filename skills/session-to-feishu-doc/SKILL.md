---
name: session-to-feishu-doc
description: Use when a user wants to configure, preview, save, export, archive, upload, or voluntarily submit the current conversation to Feishu; supports private saving or publishing a read-only link to the product-improvement group after informed consent, not historical chats or unrelated local files.
---

# Session to Feishu Doc

把当前宿主仍可见的会话脱敏后保存为用户自己的新飞书文档。只有用户明确选择“提交反馈”时，才把该文档设置为“互联网上获得链接的任何人可阅读”，并通过维护者预配置的 Webhook 把标题和链接发送到“科研教练产品改进群”。Webhook 不发送会话正文。这不是静默遥测。

## 路由

- “保存、导出、归档到我的飞书”表示**仅保存**：创建用户自己的飞书文档，不调用 Webhook。
- “上传、提交给产品团队、帮助优化”表示**提交反馈**：创建文档，开启互联网链接只读权限，再把标题和链接发送到产品改进群。
- 意图不清时，只问“仅保存到你的飞书，还是同时提交给产品改进群？”；不能默认提交反馈。
- 没有当前会话保存或上传意图时，不得创建文档或调用 Webhook。

## 一次知情确认

任何外部写入前，用一条消息展示确认摘要并只问一次“是否确认？”：

- 模式：仅保存 / 提交反馈；
- 文档标题和详细程度；
- 范围：当前可见的用户与助手消息，以及是否包含技能和工具调用；
- 脱敏：API key、token、密码、secret、authorization、credential 和疑似密钥替换为 `[REDACTED]`；
- 去向与权限：文档创建在当前登录用户的飞书空间；提交反馈时会把 `external_access` 改为 `true`、把 `link_share_entity` 改为 `anyone_readable`，即任何获得链接的人无需登录即可阅读；Webhook 只向“科研教练产品改进群”发送标题和链接，不发送正文；
- 本地临时 Markdown 路径。

沉默、继续原任务、接受研究产物或“可以看看”都不算同意。拒绝后停止且本次不再追问，不影响其他功能。用户主动说“上传当前会话”仍需看到一次上述摘要；确认后如需首次授权，完成授权便自动继续原事务，不再询问接收者或二次确认上传。

流程结束时主动邀请，也直接把上述范围压缩成一句低压力确认，不要先问“需要我准备摘要吗”。每次会话最多主动邀请一次。

## 详细程度与重建

默认 `summary`：对话正文完整保留，技能记录名称与顺序，工具记录名称、状态及约 200 字的参数和返回摘要。`full` 保留当前可见的完整过程数据，`none` 只保留对话正文。

从当前可见会话的第一条用户消息开始按轮次还原。代码块、表格和列表保持 Markdown 结构。不得声称拥有平台底层完整审计日志；发生上下文压缩时标明“仅包含导出时当前可见内容”。隐藏系统消息、内部推理和宿主未暴露的日志不属于导出范围。

所有级别都执行保守脱敏。键名含 `key`、`token`、`secret`、`password`、`authorization`、`credential`，或值像长随机串、`sk-` 密钥时打码；无法确定时优先打码。Webhook URL 本身按凭证处理，不得在对话、导出文档或命令输出中展示。

Markdown 至少包含标题、日期、轮次、详细程度、可见范围说明和完整对话；detail 不为 `none` 时再包含技能与工具表。通过 `--title` 设置文档标题后，正文不要重复同名一级标题。

将 Markdown 写入当前工作目录，使用不会覆盖的时间戳文件名：

```text
./_session_export_YYYYMMDD-HHmmss.md
```

`lark-cli` 的 `@file` 只接受当前工作目录下的相对路径。

## 首次使用

先运行只读检查：

```bash
node <skill-root>/scripts/check-setup.mjs
```

按返回的 `next_action` 处理，不运行会等待 stdin 的交互式问答，也不询问接收者：

- `install_lark_cli`：提示安装 `lark-cli`；
- `configure_app`：运行 `lark-cli config init --new`，让用户在浏览器完成一次应用配置；
- `authorize_user`：运行 `node <skill-root>/scripts/setup-wizard.mjs --start-auth`，展示返回的授权链接或二维码；用户说明已授权后运行 `--finish-auth`；
- `repair_webhook_config`：这是 Skill 分发配置错误，不让客户填写维护者地址，停止并建议重新安装或联系维护者；
- `ready`：继续原事务。

授权只申请创建文档所需的 `docs` 与 `drive` domain，不申请 `im`。Webhook 已随 Skill 由维护者配置，客户无需选择收件人、提供 `open_id` 或配置消息权限。授权 URL 和临时 device code 不得写入导出文档。

## 已确认后的单次事务

确认后不要在步骤之间停下来解释、读取脚本或再次提问。先完成首次授权，再一次调用：

```bash
# 提交反馈
node <skill-root>/scripts/upload-session.mjs \
  --title "会话记录：[主题或日期]" \
  --content "./_session_export_YYYYMMDD-HHmmss.md" \
  --yes

# 仅保存
node <skill-root>/scripts/upload-session.mjs \
  --title "会话记录：[主题或日期]" \
  --content "./_session_export_YYYYMMDD-HHmmss.md" \
  --local-only \
  --yes
```

提交反馈时，脚本严格按以下事务执行：

1. 创建文档；
2. 检查当前用户是否有 `manage_public` 权限，读取当前公开设置；
3. 只修改 `external_access=true` 和 `link_share_entity=anyone_readable`，然后重新读取并验证；
4. 只有权限验证成功后，才通过 Webhook 发送标题和文档链接。

上传确认已经明确展示公开范围和准确字段变化，因此同时授权权限脚本使用 `--yes`；不得在未确认时单独调用权限脚本。文档创建失败时停止。权限开启或验证失败时返回 `permission_failed`，保留文档 URL 且不发送 Webhook；遇到 `91009`、`91010`、`91011`、`91012` 时分别说明租户策略、文档对外分享或密级限制，不当成普通登录错误。Webhook 失败时返回 `notification_failed`，明确说明文档已经公开但通知未送达，不自动重试。只有用户主动要求重试通知时，才复用已有公开文档，不重新创建文档或修改权限：

```bash
node <skill-root>/scripts/send-webhook.mjs \
  --doc-url "<已有文档URL>" \
  --title "会话记录：[主题或日期]" \
  --yes
```

完成后报告文档状态、公开权限验证状态、Webhook 状态、轮次、技能数、工具数和详细程度。不要展示 Webhook URL。临时 Markdown 默认保留且不主动询问清理；只有用户要求删除时才取得明确同意。

## 边界

- 只处理当前会话，不读取历史聊天或其他本地文件。
- 不修改已有飞书文档，每次新建。
- “仅保存”模式不修改公开权限；“提交反馈”模式产生互联网公开只读链接，链接被转发后仍可访问。
- 提交反馈不等于教师长期记忆，不把完整会话写入教师画像。
- 自定义机器人只负责向固定产品改进群投递，不读取群消息，也不启动后台监听。
