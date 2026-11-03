# Feature Spec: 自助取还体验革新与支付安全增强 (Pickup Inspection & Security)

- **基线依赖**：`workspace/customer/specs/epic/selfservice-rental-baseline.md` (v1.0)
- **文档版本**：v1.2
- **更新日期**：2026-03-17

本特征说明书（Feature Spec）是对生产基线文档的增量更新。此次迭代聚焦于解决目前在线鉴权的越权安全隐患、补齐前端对于 Stripe 预授权复杂状态的响应能力，并对现有的“客户自行拍照验车”流程进行了颠覆性的架构重构，以实现真正的“无感取车”。

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
| `CANCEL01` | `CANCELLED` | `APPROVED` | `true` | 拦截：Order Cancelled | 订单主状态已取消 |
| `PENDING01` | `CONFIRMED` | `PENDING_REVIEW` | `true` | 拦截：Complete Online Check-In First | 待审核逻辑在 ONLINE CHECK-IN 应用处理 |
| `REJECT01` | `CONFIRMED` | `REJECTED` | `true` | 拦截：Complete Online Check-In First | 驳回重提逻辑在 ONLINE CHECK-IN 应用处理 |
| `REGULAR01` | `CONFIRMED` | `APPROVED` | `false` | 拦截：Not Eligible for Self-Service | 常规租车单，不可进入自助取还 |
| `NOT_ELIGIBLE` | `CONFIRMED` | `APPROVED` | `false` | 拦截：Not Eligible for Self-Service | 与 `REGULAR01` 语义一致（兼容旧测试口令） |

补充约束：
- selfservice-rental 应用内只对 `APPROVED + is_selfservice_eligible=true` 放行。
- `PENDING_REVIEW/REJECTED/NOT_SUBMITTED` 不在本应用内承接“提交/重提资料”流程，统一提示先完成 ONLINE CHECK-IN。

---

## 2. 预授权状态字段变更与 Stripe 对齐 (Security Deposit Status Transition)

### 2.1 背景问题
当前生产基线依赖 `application_result` (1-成功, 2-失败) 进行状态判定。该字段只能表示“冻结申请动作”的即时阻断结果，但缺乏生命周期维护。从租户友好度与 Stripe 生命周期映射的角度，必须启用底层表 `platform_payment_deposit_freeze` 中的 `status` 字段来作为业务状态机。

### 2.2 现状 (AS-IS)
仅依赖即时请求结果 `application_result`（成功/失败），一旦遇到如 3DS 验证、7 天到期自动解冻等异步长周期事件，前端便无法获取准确状态，状态流转容易断链。

### 2.3 目标 (TO-BE)
启用并扩充 `status` 字段（`tinyint`），以精准对应和响应 [Stripe Authorizations 生命周期](https://docs.stripe.com/issuing/purchases/authorizations)。新定义的 `status` 枚举及前端响应策略如下：

| `status` 数值 | 业务定义与 Stripe 映射 | 业务事件与处理逻辑 | 前端响应策略 |
|---|---|---|---|
| `1` | 未发起/待处理 (`Pending`) | 尚未发起预授权或等待用户交互 | 显示 Pay Deposit 首屏 |
| `2` | 待确认 (`Requires Action`) | 发卡行要求进一步身份验证 (如 3D Secure) | 调起 Stripe SDK 的 challenge 窗口 |
| `3` | 已授权 (`Authorized / Requires Capture`) | 资金已成功授权冻结，但未实际 Captured | 视同已支付，满足取车前提：`isDepositPaid=true` |
| `4` | 待捕获 (`Captured Pending`) | (可作过渡态)商户发起扣款，等待清算 | (对客户侧同状态 5) |
| `5` | 成功 (`Captured`) | 订单结束时，商户完成最终实际扣款 | 展示为已结算，后台生成财务单据 |
| `6` | 已取消 (`Canceled / Reversed`) | 授权被商家主动撤回，或未捕获前被提早取消 | 视同未支付，报错或要求重新绑卡 |
| `7` | 已过期 (`Expired`) | 默认7天(或允许延长的30天)未经捕获自动过期 | 状态回滚为未支付，需强阻断后续用车或要求重新授权 |

> **关键约束**：进入取车验车（Inspection）的前提条件更改为：`status IN (3, 4, 5)`（即 待认证、待捕获、成功 当中任意状态均可放行）。

---

## 3. “无感取车”业务流程重构 (Pickup Inspection Shift)

### 3.1 核心理念：举证责任转移
将原本属于客户侧繁琐的取车四角拍照职责**前置**。客户的交互从“证明车辆完好”转变为“极简复核”，最大程度降低客户操作门槛。

### 3.2 流程重构划分
#### 3.2.1 调度员端：建立基准档案（整备交付阶段）
此部分为新增必须保障的前提机制。
- **标准化采集**：调度员在将车辆停放至取车网点后，必须且只能由系统强制要求拍摄车辆四角全景、内饰基础状况以及重点伤痕。
- **车机数据双重确认**：调度员需人工确认系统读取的车机实时里程、电量/油量数据的准确性。
- **数据锁定**：所有照片**必须携带时间戳和 GPS 定位水印**上传。系统以此形成该订单的“初始车况基准”，并且作为判定调度员是否完成此次投递任务的核心 SLA 考核节点。
- **SLA 把控与追责**：企业内部增加对调度端图像质量的校验机制。一旦调度员敷衍、反光、漏拍伤痕，由该网点或个人承担直接修复责任。

#### 3.2.2 客户端：极简复核（自助取车阶段）
- **透明展示**：客户进入 Inspection 页面后，直接加载由该笔订单调度员最后一次上传的「基准照片」及「车机同步数据」供客户比对确认。
- **核心界面区域划分 (Interface Structure)**：
  - **Telematics Action**:
    - `doors unlock description: "Vehicle doors are now unlocked successfully for interior inspection."`
    - 成功态提示采用**警示色/提醒色**而非绿色成功态，强调“可进入车内检查”，而非“取车流程已完成”。
  - **Driver Verification**: 
    - `title: "Driver verification"` (要求拍照合影)
    - `view example: button // show example image`
    - `subtitle: "Please hold your Home Country Driver's License against the vehicle's license plate (front or rear) and take a clear photo capturing both."`
    - `take photo: upload button // take photos`
    - `tips: "These photos are used to verify the driver and vehicle for this rental and are stored securely."`
  - **Vehicle Exterior (只读)**: `title: "Current Vehicle Condition (Exterior)"`, 包含 `front`, `rear`, `left side`, `right side` 四个只读图片组件 (基准图)。
  - **Vehicle Interior (只读)**: `title: "Current Vehicle Condition (Interior)"`, 包含 `Front Area Overview`, `Rear Area Overview` 两个只读图片组件 (基准图)。
  - **Damage Report (已有损伤只读)**: `title: "Existing Damage Report"`, 包含 `damage issues: [strings]` (如划痕、凹陷等分类), `damages :image` (报告的 existing damages)。
  - **Customer Decision**:
    - `title: "Vehicle Inspection"`
    - `photo guide: button // show example images`
    - `options: checkbox // Confirm & Accept Current Vehicle Condition (default), report exception`
    - `report issues: images // required only when [report exception] is selected`
    - `tips: strings // other statements`
- **条款确认与提交**: 同意条款 checkbox 文案调整为 `I have read and agree to the Service & Billing Policies.`，并保持 `Continue to Contract` 提交流程。
- **合同签署页只读原则 (Contract Screen Read-Only Policy)**：
  - 默认除「手写签名」与「同意合约条款 checkbox」外，其余字段、证件图片均为**只读**。
  - 预订相关字段（如订单号、车型、取还车时间地点、主驾驶联系方式）来自 Reservation / Booking Information。
  - 护照、驾照、IDP 等证件图片来自 Online Check-In 阶段已审核通过的资料；前端 demo 可使用 mock 图片进行展示。
  - 前端需明确提示：本页资料已预填并锁定，仅供用户复核后签署。

### 3.3 取车车机控制逻辑重构 (Vehicle Control Logic)
为配合“极简复核”中让客户能够进入车内检查车况的需求，需对目前的车机控制指令下发时机进行重构（指令基于智信通《车辆位置、状态及控制接口 V1.0》的 `/controlCar` 端点）。

#### 3.3.1 现状 (AS-IS)
- 逻辑：客户必须在手机上全部完成外观拍照、确认车况并**同意签署了电子合同之后**，系统才允许执行开门。
- 痛点：导致客户在未解锁开门前完全无法检查车室内部（如严重污染、烟味及内饰件损坏）。如果客户签了合同才发现内饰恶劣，极易产生退单纠纷。

#### 3.3.2 目标 (TO-BE)
将车门解锁前置到验车阶段，但同时物理阻断车辆动力，保障资产防盗安全。

- **阶段一：验车时开门授权 (Inspection Phase)**
  - **触发条件**：客户通过取车前置校验（到达网点并开始验车环节）。
  - **操作指令**：后端系统需向智信通调用两次控制指令，分别为：`500 (开门)` 解锁车辆；以及 `100 (断电)` 锁定发动机/动力电源。
  - **效果预估**：客户可以拉开车门进入车内检查。但即便有人破坏点火开关，由于系统执行了断电，引擎依旧无法启动。
  
- **阶段二：签约后启动授权 (Contract Signed Phase)**
  - **触发条件**：客户确认车况且**完全签署电子合同**。
  - **操作指令**：后端系统向智信通调用 `101 (供电)` 指令。
  - **效果预估**：解除点火限制。前端在合同签署完成页需显著提示“车辆引擎已解锁，可以发动车辆”，以明确区分此前“仅允许开门验车、尚未解锁引擎”的状态；客户此时方可正常发车驶离。

### 3.4 现状 vs 目标 对比清单
| 维度 | AS-IS (生产基线) | TO-BE (本次迭代) |
|---|---|---|
| **拍照责任主体** | 租客负责全部 (Customer) | **调度员 (Dispatcher)** 主责入库拍照，租客仅验明正身 |
| **租客操作链路** | 必需完成全套车身拍照 | 验证身份后，勾选 **Confirm & Accept Current Vehicle Condition** 快速通过 |
| **照片展示形式** | 上下滚动的列表/网格 | 分类模块化基准图：**Current Vehicle Condition (Exterior)**、**Current Vehicle Condition (Interior)**、**Existing Damage Report** |
| **异常反馈流程** | 统合在车身四角照片中额外填字 | 点击勾选 **Report Exception** 时独立展开新增凭证上传区 |
| **车况基线来源** | 每次以租客本次自拍为准，缺乏追溯 | 以调度员锁定的基准照 (Read Only) 作为判责基线 |
| **车机控制时机** | 签署合同后才开门（无法检查车内） | 验车时开门+断电，签署合同后供电启动 |

### 3.5 还车 Location & Parking 优化

#### 3.5.1 LOCATION & PARKING 提示增强
- 在 `Take a wide photo showing the car and the parking number or a nearby pillar.` 提示前，新增门店联系方式提醒：`If fail to return vehicle, please contact the store at {number}.`
- 该提醒**仅在用户当前位置位于围栏外**时展示；围栏内或定位检查中均不展示。
- `Take a wide photo...` 区域新增 `View Example` 入口，点击后展示 1 张停车拍照示例图与说明。
- 当前阶段示例图允许使用**占位示例图**；后续设计素材到位后可直接替换，不改变交互结构。

#### 3.5.2 RETURN CHECKLIST 精简
- `RETURN CHECKLIST` 页面仅保留一项：`Return the car key to the keybox in the glove compartment`。
- 该事项下新增单图拍照上传区域，用于证明钥匙已放回手套箱内的钥匙盒。
- 该照片字段为**必填**。
- 若未上传该照片，系统不得允许用户进入下一步或提交后续还车步骤。

#### 3.5.3 Vehicle Inspection 调整
- 还车第 2 步 `Vehicle Inspection` 页面需移除 `Lights Check` 模块，不再单独要求用户上传灯光照片。
- 除“钥匙归还”以外的其他还车 checklist 项（如 `Switch off the car headlights and interior lights`、`The car will lock once you tap 'End Trip'`）继续在第 2 步展示，并改为用户可勾选确认的 checkbox 列表。
- 若用户未完成上述 checkbox 确认，系统不得允许提交还车。
- `Damage Report` 区域需支持在用户填写损伤说明后，追加上传车损图片，作为异常佐证；交互参考取车验车页的异常上报图片上传方式。

#### 3.5.4 验收补充场景
- **场景 A：解锁提示色变更**
  - **Given** 用户进入取车验车页并触发开锁指令
  - **When** 开锁成功
  - **Then** 页面显示警示色提示条，且文案包含 `interior inspection`
- **场景 B：围栏外提醒**
  - **Given** 用户位于有效还车围栏外
  - **When** 位置校验完成
  - **Then** 展示联系电话提醒
  - **And** 围栏内或定位检查中不展示该提醒
- **场景 C：钥匙归还拍照必填**
  - **Given** 用户位于 `RETURN CHECKLIST`
  - **When** 未上传钥匙归还照片
  - **Then** 页面阻止进入下一步
  - **And** checklist 区域仅保留钥匙归还事项与对应拍照区
- **场景 D：签约后引擎解锁提示**
  - **Given** 用户已完成合同签署
  - **When** 进入合同签署完成页
  - **Then** 页面显著提示车辆引擎已解锁，可以发动车辆
  - **And** 该提示需明确区别于验车阶段“仅开门、未解锁引擎”的状态
- **场景 E：还车检查项转移到 Vehicle Inspection**
  - **Given** 用户已进入还车第 2 步 `Vehicle Inspection`
  - **Then** 页面不再展示 `Lights Check` 模块
  - **And** 页面展示可勾选的 checklist 确认项
  - **And** 未勾选全部 checklist 时不得完成还车
- **场景 F：车损图片补充上传**
  - **Given** 用户在还车第 2 步填写了 `Damage Report`
  - **Then** 页面允许继续上传车损图片作为佐证

---

## 4. 行程评价能力 (Trip Rating) 

### 4.1 背景问题
当前自助系统在客户完成还车后，流程即刻终止（Trip Ended 页面仅展示还车凭证入口），缺乏收集客户真实服务反馈的闭环渠道。

### 4.2 现状 (AS-IS)
还车成功转入 `canonical_status = RETURNED` 后，Trip Ended 页面不包含任何评价组件。

### 4.3 目标 (TO-BE)
在 Trip Ended 页面（或还车完成后的黄金窗口期），增加综合满意度评价组件 (Trip Rating)。
- **核心组件**：
  - **NPS 推荐意愿评分 (Overall Recommendation)**：1到10分，衡量“是否愿意推荐给朋友”。
  - **文字评价 (Comments)**：提供可选文本域（Optional），用于补充体验反馈（当前前端限制 50 字）。
- **交互策略**：
  - 评价必须为低阻力流程。提交评价不应当阻塞用户查看还车凭证的动作。
  - 低分原因标签（如“不愿推荐原因”）当前阶段暂不启用；待样本量与分类口径稳定后再补充。
  - 用户提交评价后，展示友好的感谢组件（如 "Thank you for sharing your experience!"）。
  - 该评价数据应同订单信息关联回流至商户后管系统，用于门店服务质量改进与客服跟进。
