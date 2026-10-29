---
name: session-to-feishu-doc
description: Use when a user wants to configure, preview, save, export, archive, upload, or submit the current conversation to a Feishu document or a configured product-feedback recipient; not for local files, historical chats, or unrelated document creation.
---

# Session to Feishu Doc

把当前宿主仍可见的会话脱敏后保存为新的飞书文档，授予配置接收者只读权限，再发送通知。它是用户主动选择的反馈能力，不是静默遥测。

## 路由

- 用户说“配置、初始化、第一次使用会话上传”时，进入 Setup。
- 用户说“保存、导出、归档当前会话到飞书”时，进入上传确认；若只保存给自己，在确认摘要中选择“仅保存”，创建文档后跳过接收者授权和通知。
- 用户说“上传、提交当前会话给产品团队，帮助优化”等时，进入上传确认。
- 没有明确上传意图时不得默认创建文档、授权或发送消息。

## 上传前的明确同意

任何外部写入前，先展示一份确认摘要：

- 文档标题；
- 接收者名称和配置的 `open_id`；
- 详细程度；
- 将包含当前可见的用户/助手消息，以及是否包含技能和工具调用；
- API key、token、密码、secret、authorization、credential 和疑似密钥将替换为 `[REDACTED]`；
- 文档将在当前登录用户的飞书空间创建，并给接收者只读权限；
- 本地临时 Markdown 路径。

然后只问一次“是否确认上传？”。只有用户明确同意才继续。沉默、继续研究对话、同意某份研究产物或“可以看看”都不代表同意上传。用户拒绝后停止，本次会话不再追问；拒绝不影响其他 Skill 的使用。

即使用户主动说“上传这次会话”，也先展示上述确认摘要；若用户原话已经明确当前会话、产品接收者和立即上传，仍应在执行前简短复述接收范围，避免把普通“保存”误当成产品反馈授权。

## 详细程度

默认使用 `summary`：

| 级别 | 对话正文 | 技能调用 | 工具调用 |
|---|---|---|---|
| `full` | 当前可见内容完整保留 | 完整链路和触发原因 | 完整参数和完整返回，脱敏仍生效 |
| `summary` | 当前可见内容完整保留 | 技能名和顺序 | 工具名、约 200 字参数摘要、状态和约 200 字返回摘要 |
| `none` | 当前可见内容完整保留 | 不包含 | 不包含 |

“完整过程、全部工具参数”映射为 `full`；“只要对话、不要过程数据”映射为 `none`。无法确定时保留默认 `summary`。

不得声称获得平台底层完整审计日志。长会话若发生上下文压缩，在文档概览中标记“仅包含导出时当前可见内容”。隐藏系统消息、内部推理和宿主未暴露的日志不属于导出范围。

## Setup

先运行：

```bash
node <skill-root>/scripts/check-setup.mjs
```

若未就绪，经用户同意后运行交互式向导：

```bash
node <skill-root>/scripts/setup-wizard.mjs
```

向导负责检查 `lark-cli`、启动应用配置、用二维码和浏览器完成用户授权，并收集接收者名称及 `open_id`。配置默认保存在 `~/.session-to-feishu-doc/config.json`，可用 `SESSION_TO_FEISHU_HOME` 覆盖；不得把授权 URL、device code、App Secret 或 token 写入配置。

接收者必须能被当前飞书应用和租户识别。跨租户 `open_id` 不保证可用；失败时停止并说明接收者不可达，不要退化成公开链接。

## 重建与格式化

从当前可见会话的第一条用户消息开始，按轮次还原用户和助手正文。代码块、表格和列表保持 Markdown 结构。过程日志按轮次和时间顺序整理。

所有级别都执行保守脱敏。键名含 `key`、`token`、`secret`、`password`、`authorization`、`credential`，或值像长随机串、`sk-` 密钥时打码；无法确定时优先打码。

Markdown 至少包含：标题、日期、轮次、详细程度、可见范围说明、完整对话，以及 detail 不为 `none` 时的技能与工具表。

通过 `--title` 设置飞书文档标题时，Markdown 正文不要再重复同名一级标题。普通文本中的 Markdown 特殊字符要按飞书 Markdown 规则转义，代码块内容保持原样。

将文件写入当前工作目录，使用不会覆盖的时间戳文件名：

```text
./_session_export_YYYYMMDD-HHmmss.md
```

`lark-cli` 的 `@file` 只接受当前工作目录下的相对路径。

## 已确认后的上传事务

必须依次执行，不能把后一步成功建立在前一步失败之上：

1. 创建文档：

   ```bash
   node <skill-root>/scripts/create-doc.mjs --title "会话记录：[主题或日期]" --content "./_session_export_YYYYMMDD-HHmmss.md" --yes
   ```

2. 授予接收者只读权限。用户对上传事务的明确同意同时授权此步骤，但仍必须显式传 `--yes`，避免脚本被单独误调用：

   ```bash
   node <skill-root>/scripts/share-doc.mjs --doc-url "<文档URL>" --yes
   ```

3. 只有授权成功后才发送通知：

   ```bash
   node <skill-root>/scripts/send-notification.mjs --doc-url "<文档URL>" --title "会话记录：[主题或日期]" --yes
   ```

文档创建失败时停止。文档创建成功但授权失败时，返回文档 URL 并说明“提交未完成”；授权失败不得发送成功通知。授权成功但通知失败时，说明文档已共享、通知失败，并给出可重试命令。

完成后分别报告文档、授权、通知三个状态，以及轮次、技能数、工具数和详细程度。临时 Markdown 默认保留；删除必须再次得到用户明确同意。

## 边界

- 只处理当前会话，不读取历史聊天或其他本地文件。
- 不修改已有飞书文档，每次新建。
- 上传不等于教师长期记忆，不得把完整会话写入教师画像。
- `message-forwarder` 一类长期监听不属于本 Skill，不启动后台监听进程。
