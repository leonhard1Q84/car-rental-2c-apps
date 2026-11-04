# 客户移动端规格索引

本目录是 FleetEdge customer lane 的正式需求入口。业务应用分为鉴权、Online Check-in、自助取还、Renew，以及尚未上线的 Skip the counter、投诉反馈。首页、预订摘要与导航是应用壳。划分依据为 [客户应用边界](epic/customer-applications.md)，来源为2026-11-03产品负责人指令。

## 应用规格

| 应用 | 正式规格入口 | 运行时代码 |
|---|---|---|
| 鉴权 | [订单验证](modules/auth/booking-verification.md)、[访问安全](modules/auth/link-access-security.md)、[登录主题](modules/auth/login-brand-theme.md) | `src/modules/auth` |
| Online Check-in | [资料与提交](modules/online-checkin/README.md) | `src/modules/online-checkin` |
| 自助取还 | [验车、电子钥匙、取还车与评价](modules/selfservice-rental/README.md) | `src/modules/selfservice-rental` |
| Renew | [在线续租](modules/renewal/rental-extension.md) | `src/modules/rental-extension` |
| Skip the counter | [规划边界，尚未上线](modules/skip-the-counter/README.md) | 暂无 |
| 投诉反馈 | [规划边界，尚未上线](modules/feedback/README.md) | 暂无 |

## 基线与应用壳

- [客户移动端首页](modules/home/service-hub.md)、[My Trip 品牌主题](modules/home/brand-theme.md)
- [跨应用客户旅程](epic/customer-journey.md)：由历史取车前准备规格迁移，保留现有资料、草稿及签约规则；应用归属和验证页呈现以本次对应规格为准
- [自助取还业务基线](epic/selfservice-rental-baseline.md)
- [客户端工程拆分](epic/customer-app-extraction.md)
- [Customer H5 设计基线](../docs/templates/customer-h5-design-baseline.md)

正式 feature 按业务应用归属存放，跨应用语义上收 `specs/epic`。验车、车控、押金、合同、还车及评价不独立为顶层应用。新增应用同步更新本索引及 `.agent/rules/spec-author.md`。

## 来源与证据

- [客户资料迁移报告](../docs/architecture/customer-materials-migration.md)
- [原始自助取还资料](../docs/asset/feat_selfservice_management_spec.md)
- [原始 ONLINE CHECK-IN PDF](<../docs/asset/【027】- 自助取还ONLINE CHECK IN.pdf>)
- [旅程资料](../docs/journey/README.md)

原始拆分来源为 Codeup `ixtech-app-antigravity main@d6e5b1c`。参考项目与本地 Mock 仅证明可追溯的实现现状；不代表生产事实或跨项目能力已完整整合。迁移报告中的旧结构为历史快照，当前归属以本索引为准。
