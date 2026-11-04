# 客户应用边界

日期：2026-11-04；来源：产品负责人明确指令；适用范围：本仓库 customer lane 的规格归属、代码组织与首页入口。应用指客户可理解的业务单元，不要求独立构建或部署。

## 应用与能力

| 应用 | 规格目录 | 运行时代码 | 职责与状态 |
|---|---|---|---|
| 鉴权 | `specs/modules/auth` | `src/modules/auth` | 统一订单验证、访问安全、会话；订单号＋订单联系电话后四位 |
| Online Check-in | `specs/modules/online-checkin` | `src/modules/online-checkin` | 身份、驾驶人及证件资料、提交结果与补正；参考 `fe-online-check-in` |
| 快速取车 | `specs/modules/online-checkin` | `src/modules/selfservice-rental/pickup`（当前复用取车前确认组件） | 仅常规租车订单使用；门店准备车辆照片后，客户在到店或接驳途中提前确认车辆资料并签署合同；不包含电子钥匙或自助还车 |
| 自助取还 | `specs/modules/selfservice-rental` | `src/modules/selfservice-rental` | 取还车、验车、押金、合同、电子钥匙/车控、行程结束及行程评价；参考 `selfservice_rental` 的客户自助取还部分 |
| Renew 续租 | `specs/modules/renewal` | `src/modules/rental-extension` | 同订单续租、可用性、报价、付款及续租合同；接口未配置时阻断交易 |
| Skip the counter | `specs/modules/skip-the-counter` | 暂无独立运行时 | 独立规划应用，尚未上线；不得将既有验车或自助取车改名视为已实现 |
| 投诉反馈 | `specs/modules/feedback` | 暂无独立运行时 | 独立规划应用，尚未上线；既有行程评价与 Trip Ended 外部反馈入口不代表完整投诉流程 |

首页和预订摘要属于应用壳：规格 `specs/modules/home`，页面装配与跨应用草稿/导航位于 `src/app/customer-journey`，摘要与服务入口位于 `src/modules/home`。它们不增加独立业务应用。底层组件、合同、押金、验车、车控和行程结束均是自助取还子能力。

## 来源与差异

- Online Check-in 参照 `/Users/admin/Downloads/fe-online-check-in` 的 README、`src/App.jsx`、`src/pages/LoginPage.jsx`，于 2026-11-03 本地读取。该参考实现包含独立的概览、资料提交、状态及详情页；其订单确认号＋姓氏演示鉴权不覆盖本仓库统一手机号口径。
- 自助取还参照 `/Users/admin/Desktop/selfservice_rental/src/apps/selfservice-rental` 的路由、页面与模块目录，于 2026-11-03 本地读取；仅客户自助取还部分属于参考范围。
- 当前 Online Check-in 仍继承准备旅程的本地草稿、资料与现场核对状态，尚未完整迁入参考项目的 active submission、线上审核及页面实现。目录整理不改变这些状态，不宣称已经完成整合。
- 既有跨应用准备规格迁到 [customer-journey.md](customer-journey.md)，其中历史目录、入口宣传和模块命名由本规格及对应新规格覆盖，既有字段、状态、异常与持久化规则保持。
- 本地源码、Mock 和文档只证明仓库现状，不能据此认定生产已上线。

## 导航与展示

默认 `/` 与兼容 `/selfservice.html` 先验证订单，成功 Replace 到同订单首页；首页以两行三格展示 Online Check-in、快速取车、自助取还、续租、投诉建议、更多应用。快速取车与自助取还同时展示但分别按常规租车／自助取还订单准入；`step=pickup` 当前承载快速取车的车辆确认与签约，`?flow=selfservice` 保留包含电子钥匙和取还车的完整自助取还实现。更多应用仅预留后续规划入口。

## 验收

- AC-MOD-01：Given 任一验车、押金、合同、电子钥匙、取还车、评价规格，Then 归属 selfservice-rental；Skip the counter 明确为未上线。
- AC-MOD-02：Given 默认首页，Then 两行三格同时展示 Online Check-in、快速取车、自助取还、续租、投诉建议与更多应用；快速取车和自助取还不得按订单类型互相替换。
- AC-MOD-03：Given 重组后的源码，Then 所有 import 与回归脚本仍可解析，原订单隔离、校验、准入、提交及恢复测试通过；存储键和 URL 兼容。
- AC-MOD-04：Given 参考仓库，Then 仅作对照，不新增外部源码绝对路径依赖，不引入商户页面。
