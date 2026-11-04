# AGENTS.md

## 适用范围

本文件适用于 `docs/**` 与 `specs/**` 下的 spec、supporting docs、schema、API contract、glossary、event taxonomy 与 template。

## 语言策略

- 业务说明、流程说明、验收标准、设计原则和操作规则默认使用中文。
- 标准术语、领域 Terms、API 名称、schema 字段、i18n key、代码标识符、文件名可以保留英文。
- feature spec 中的 i18n 资源包可以包含 `zh-CN / en / ja` 等目标语言值，但正文叙述仍使用中文。
- 不要把整段业务说明写成英文。

## 内容边界

- `specs/` 承载客户 lane 的正式需求；`docs/` 承载设计基线、模板、架构与辅助说明，不替代 active feature spec。
- `docs/shared/` 只放稳定跨端契约（schema、API contract、glossary、event taxonomy、templates）。

## 写作要求

- 文档面向后续读者，不使用回应当前对话的口吻。
- spec 需要明确角色、入口、状态、字段、阻断、异常恢复、i18n 增量和 BDD 验收。
- Mermaid 图中的节点 ID 使用 ASCII；中文放在节点 label 中。
- 不要在 `specs/`、`docs/` 下新增可执行 rules、prompts 或 workflows。

## 变更落点

- 客户页面、流程、文案和交互哲学落在 `specs/` 与 `docs/` 客户内容区。
- 稳定 schema、API、glossary、event taxonomy 才进入 `docs/shared/`。
- 如果只是历史背景或迁移说明，不要提升为 active spec。

