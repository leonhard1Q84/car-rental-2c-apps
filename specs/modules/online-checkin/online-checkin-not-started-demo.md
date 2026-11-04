# Feature Spec: 自助取还体验革新与支付安全增强 (Pickup Inspection & Security) — Online Check-in 未开始演示

- **所属模块**：`online-checkin`
- **拆分来源**：`specs/feature/pickup-inspection-security.md` v1.17（2026-11-03 按产品模块拆分，正文未改写）
- **基线依赖**：`specs/epic/selfservice-rental-baseline.md` (v1.0)
- **同源拆分文件**：[access/link-access-security.md](../auth/link-access-security.md)、[return/return-location-parking.md](../selfservice-rental/return-location-parking.md)、[return/trip-rating.md](../selfservice-rental/trip-rating.md)、[skip-the-counter/pickup-inspection-security.md](../selfservice-rental/pickup-inspection-security.md)

本特征说明书（Feature Spec）是对生产基线文档的增量更新。此次迭代聚焦于解决目前在线鉴权的越权安全隐患、补齐前端对于 Stripe 预授权复杂状态的响应能力，并对现有的“客户自行拍照验车”流程进行了架构重构，以实现低阻力取车。同时规定验车阶段先展示驾照与车牌合照，再展示车辆控制区；车门控制由客户主动触发，不依赖照片是否已上传或审核通过，并补充弱网等待、超时恢复和自动重新落锁识别规则。对于可能投递至收费停车场的自助取车订单，通过取车前责任告知和取车完成后的驶离提醒，确保客户了解停车费承担与缴纳要求。

---

#### 3.6 Online Check-in 未开始演示流程

- `NOT_STARTED01 + 5678` 作为 `NOT_SUBMITTED` 演示订单，登录后进入乘客端 Online Check-in 表单。
- 表单包含主驾驶人资料、证件文件选择（本地文件或示例证件）和条款确认。
- 提交动作仅更新当前 demo 会话中的状态；不上传或持久化真实证件文件。
- 提交成功后状态变为 `PENDING_REVIEW`，页面提示资料已提交并阻止进入自助取还流程。
- 运行时资源 key 使用 `demoOnlineCheckinNotStarted*` 与 `checkin*`，提供 `zh-TW / en / ja / ko / th` 文案。

**验收场景**

- **场景 G：从未开始的 Check-in**
  - **Given** 用户使用 `NOT_STARTED01 + 5678` 登录
  - **When** 登录校验成功
  - **Then** 进入 Online Check-in 表单，不进入 Overview 或阻断页
- **场景 H：资料不完整时阻止提交**
  - **Given** 用户未上传证件或未同意条款
  - **When** 点击提交
  - **Then** 页面显示缺失项提示，保持在表单页
- **场景 I：提交后进入待审核**
  - **Given** 用户已填写资料、添加证件并同意条款
  - **When** 点击提交
  - **Then** 显示提交中的 loading，随后进入 `PENDING_REVIEW` 阻断页
  - **And** 用户再次使用同一订单登录时，不重复进入未开始表单
