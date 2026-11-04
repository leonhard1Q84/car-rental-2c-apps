# Feature Spec: 自助取还体验革新与支付安全增强 (Pickup Inspection & Security) — 链接访问安全

- **所属模块**：`auth`
- **拆分来源**：`specs/feature/pickup-inspection-security.md` v1.17（2026-11-03 按产品模块拆分，正文未改写）
- **基线依赖**：`specs/epic/selfservice-rental-baseline.md` (v1.0)
- **同源拆分文件**：[online-checkin/online-checkin-not-started-demo.md](../online-checkin/online-checkin-not-started-demo.md)、[return/return-location-parking.md](../selfservice-rental/return-location-parking.md)、[return/trip-rating.md](../selfservice-rental/trip-rating.md)、[skip-the-counter/pickup-inspection-security.md](../selfservice-rental/pickup-inspection-security.md)

本特征说明书（Feature Spec）是对生产基线文档的增量更新。此次迭代聚焦于解决目前在线鉴权的越权安全隐患、补齐前端对于 Stripe 预授权复杂状态的响应能力，并对现有的“客户自行拍照验车”流程进行了架构重构，以实现低阻力取车。同时规定验车阶段先展示驾照与车牌合照，再展示车辆控制区；车门控制由客户主动触发，不依赖照片是否已上传或审核通过，并补充弱网等待、超时恢复和自动重新落锁识别规则。对于可能投递至收费停车场的自助取车订单，通过取车前责任告知和取车完成后的驶离提醒，确保客户了解停车费承担与缴纳要求。

---

## 1. 链接访问安全优化 (Security Access Optimization)

### 1.1 背景问题
当前 ONLINE CHECK-IN 验证过度依赖于 URL 上的 Query 参数。

### 1.2 现状 (AS-IS)
当前系统用户通过形如 `https://selfservice.fleetedge.tech/#/vehiclecheck/check?confirmCode={ORDER_ID}&brand={BRAND}` 的链接进入。
只要能够猜出组合，即使该笔订单在业务上**并不支持**自助取还服务（例如需要前往人工柜台），用户依靠该链接拼接即可强行绕过门店接待阶段，直接进入自助服务的 OVERVIEW 页面。这种越权行为带来的安全风险不可接受。

### 1.3 目标 (TO-BE)
引入后端维度的强订单业务属性拦截（“属性鉴权”）。
- **流程变更**：在用户打开链接向后端发起 Auth Check 接口请求时，后端除了验证 `confirmCode` 是否真实存在，必须同时核验该订单模型上的 `is_selfservice_eligible`（或其他标识该订单可承接自助模式的字段）。
- **前端响应**：当且仅当后端返回允许时，前端才获准挂载 Overview 页面。若订单不支持自助模式，后端返回特定错误码（如 `403 Forbidden` / `NOT_ELIGIBLE`），前端显示友好拦截页面（文案示例："This reservation requires counter service. Please visit our desk."），彻底阻断后续的押金与取车阶段。

### 1.4 非目标迭代 (NOT TO-BE)
- 本次迭代**不涉及**重构完整的角色的访问控制模型（RBAC）。
- 本次迭代**不涉及**动态链接生成（如短期 Token、一次性 Magic Link 等），重点锁定在基于现有链接结构的订单属性校验。

### 1.5 前端 Mock 场景矩阵（联调/验收）
为避免自助取还 H5 与 ONLINE CHECK-IN 应用职责混淆，前端 Mock 场景按如下规则执行：

| Mock 单号 | `canonical_status` | `online_checkin_verification_status` | `is_selfservice_eligible` | 预期结果（selfservice-rental） | 说明 |
|---|---|---|---|---|---|
| `DEMO` | `CONFIRMED` | `APPROVED` | `true` | 放行进入 Overview | 自助订单正常路径 |
| `PICKUP01` | `CONFIRMED` | `APPROVED` | `true` | 放行进入 Overview | 预置押金已授权、车辆已就绪；不得绕过 Overview 直接进入 Inspection |
| `CANCEL01` | `CANCELLED` | `APPROVED` | `true` | 拦截：Order Cancelled | 订单主状态已取消 |
| `NOT_STARTED01` | `CONFIRMED` | `NOT_SUBMITTED` | `true` | 进入 Online Check-in 资料提交演示 | 允许体验本地 mock 提交，提交后进入待审核 |
| `PENDING01` | `CONFIRMED` | `PENDING_REVIEW` | `true` | 拦截：Verification Pending | 待审核订单不重复提交资料 |
| `REJECT01` | `CONFIRMED` | `REJECTED` | `true` | 拦截：Complete Online Check-In First | 驳回重提逻辑在 ONLINE CHECK-IN 应用处理 |
| `REGULAR01` | `CONFIRMED` | `APPROVED` | `false` | 拦截：Not Eligible for Self-Service | 常规租车单，不可进入自助取还 |
| `NOT_ELIGIBLE` | `CONFIRMED` | `APPROVED` | `false` | 拦截：Not Eligible for Self-Service | 与 `REGULAR01` 语义一致（兼容旧测试口令） |

补充约束：
- selfservice-rental 应用内只对 `APPROVED + is_selfservice_eligible=true` 放行到 Overview。
- `PICKUP01` 只用于预置取车就绪状态，鉴权通过后仍先进入 Overview，由客户从概览步骤进入 Inspection。
- `NOT_SUBMITTED` 仅进入本地 Online Check-in 提交演示；提交后必须回写为 `PENDING_REVIEW` 并阻断取还车。
- `PENDING_REVIEW/REJECTED` 不得重复进入提交页；分别展示待审核与驳回恢复提示。

---

## 5. 修改记录

| 日期 | 修改人 | 变更说明 |
|---|---|---|
| 2026-09-04 | Codex | 将 `PICKUP01 / Smith` 的登录首屏从 Inspection 调整为 Overview；保留押金已授权、车辆已就绪的场景数据，并同步更新 Mock 场景说明。 |
