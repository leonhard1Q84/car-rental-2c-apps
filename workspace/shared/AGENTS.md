# AGENTS.md

## 适用范围

本文件适用于 `workspace/shared/**`。这里只放稳定、跨 lane、低偏置的共享契约。

## 允许内容

- `schema/**`：稳定数据结构与字段说明。
- `api-contract/**`：跨端或跨系统 API 契约。
- `glossary/**`：领域词汇与标准 Terms。
- `event-taxonomy/**`：稳定事件分类与语义。
- `templates/**`：可复用 spec/template。

## 禁止内容

- 不放 design token、页面视觉基线或 App 专属样式。
- 不放 customer、store-ops、merchant 任一 lane 专属的文案、页面节奏或交互哲学。
- 不用 shared 作为临时需求、页面方案或历史资料的收纳箱。

## 写作要求

- 解释文字使用中文；标准 Terms、API 名称、schema 字段、i18n key 可保留英文。
- 新增内容必须同时对至少两个 lane 稳定成立，或明确属于跨系统契约。
- 如果内容只服务单一 lane，应退回对应 `workspace/<lane>`。

