---
trigger: glob
description: FleetEdge 客户端范围、规格路由与证据边界
globs: "AGENTS.md,src/**,specs/**,docs/**,README.md,*.html"
---

# 客户端全局规则

本仓库只承载 FleetEdge 租车客户端，默认 lane 为 `customer`。

1. 客户端规格在 `specs/`，设计基线在 `docs/templates`。
2. 先读取 `docs/README.md`、设计基线、baseline spec 和相关 feature spec，再进入实现。
3. `docs/shared` 仅保存订单、车辆、门店等稳定领域契约与模板；涉及商户的字段是外部系统契约，不授权新增商户页面。
4. 根 `.agent/` 是可执行 control plane，`specs/` 与 `docs/` 是内容区，不在其中新增可执行规则或 workflow。
5. 写规格遵循 `spec-author.md`，写运行时代码遵循 `runtime-coder.md`。
6. `src/shared` 不得依赖 App 内部实现，不得引入外部商户仓库源码或绝对本地路径。
7. Mock、本地运行结果和代码缺口只属于仓库实现证据；生产结论必须有独立、可追溯的业务证据。
8. 技术拆分依据为 `specs/epic/customer-app-extraction.md`；业务语义继续以原客户 baseline 和 feature spec 为准。
