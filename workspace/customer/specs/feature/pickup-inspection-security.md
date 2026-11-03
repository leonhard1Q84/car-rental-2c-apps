# Feature Spec: 自助取还体验革新与支付安全增强 (Pickup Inspection & Security)

- **基线依赖**：`workspace/customer/specs/epic/selfservice-rental-baseline.md` (v1.0)
- **文档版本**：v1.17
- **更新日期**：2026-10-29

> 2026-10-29 范围修订：客户取车删除读数填写及仪表盘上传区，取消对应提交门槛，仅保留顶部只读仪表板。客户还车继续按生产基线 §5.4.1 执行；运营端读数及证据要求不受影响。

本特征说明书（Feature Spec）是对生产基线文档的增量更新。此次迭代聚焦于解决目前在线鉴权的越权安全隐患、补齐前端对于 Stripe 预授权复杂状态的响应能力，并对现有的“客户自行拍照验车”流程进行了架构重构，以实现低阻力取车。同时规定验车阶段先展示驾照与车牌合照，再展示车辆控制区；车门控制由客户主动触发，不依赖照片是否已上传或审核通过，并补充弱网等待、超时恢复和自动重新落锁识别规则。对于可能投递至收费停车场的自助取车订单，通过取车前责任告知和取车完成后的驶离提醒，确保客户了解停车费承担与缴纳要求。

---

## 0. 车辆读数提交增量（2026-08-28）

客户取车仅保留顶部只读仪表板，删除“油量/电量与里程”填写及仪表盘照片区，不再要求客户修改或补填读数、上传仪表盘照片或创建取车车辆读数检查点。验车提交和合同准入均不得保留对应隐藏门槛；当前有效来源读数可作为只读快照保存，缺失值保持为空。历史检查点和照片保留，不自动生成新证据。客户还车只读仪表板另按基线 §5.4.1 执行，运营端控件保持原有范围。

```gherkin
Scenario: 客户取车不再填写读数或上传仪表盘照片
  Given 客户进入取车验车页
  Then 页面顶部保留只读仪表板，车况之后没有读数填写、仪表盘上传、读取时间或人工回退操作
  When 当前驾驶人合照和异常证据均满足且没有车门操作等待
  Then 无读数、无仪表盘照片和无读数检查点也可继续签约
  And 不创建客户取车读数检查点，不改变前序资格、押金、车控和合同签署要求
Scenario: 取车读数缺失及历史恢复
  Given 车机无有效读数或草稿仅有历史检查点及仪表盘照片
  Then 仪表板缺失字段显示暂无资料，不填为零，不显示采集区或阻断提示
  And 历史检查点及照片保留读取，新记录不伪造读数或现场证据
```

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
- **透明展示**：客户进入 Inspection 页面后，直接加载由该笔订单调度员最后一次上传的「基准照片」供客户比对确认；除顶部只读仪表板外，取车页不重复展示首页已有的车牌号、车辆品牌、车型、油量/电量或里程信息。
- **核心界面区域划分 (Interface Structure)**：
  - **驾驶证件与车牌合照**：按已登记驾驶人每人拍摄一张，名单及证件提示沿用已审核资料；无新增资格审核，具体规则见 §3.2.2.1。
  - **Telematics Action / Vehicle Controls**:
    - 位于 License & Plate Photo 之后、车辆外观和内饰验车之前。
    - `doors unlock description: "Vehicle doors are now unlocked successfully for interior inspection."`
    - 页面初始化后即可操作“解锁车门”和“锁闭车门”，不要求等待 License & Plate Photo 上传或验证；页面进入时不得自动发送指令。
    - 成功态提示采用**警示色/提醒色**而非绿色成功态，强调“可进入车内检查”，而非“取车流程已完成”。
  - **Vehicle Exterior (只读)**: `title: "Current Vehicle Condition (Exterior)"`, 包含 `front`, `rear`, `left side`, `right side` 四个只读图片组件 (基准图)。
  - **Vehicle Interior (只读)**: `title: "Current Vehicle Condition (Interior)"`, 包含 `Front Area Overview`, `Rear Area Overview` 两个只读图片组件 (基准图)。
  - **Damage Report (已有损伤只读)**: `title: "Existing Damage Report"`, 包含 `damage issues: [strings]` (如划痕、凹陷等分类), `damages :image` (报告的 existing damages)。
  - **Customer Decision**:
    - `title: "Vehicle Inspection"`
    - `photo guide: button // show example images`
    - `options: checkbox // Confirm & Accept Current Vehicle Condition (default), report exception`
    - `report issues: images // required only when [report exception] is selected`
    - `tips: strings // other statements`

页面区块顺序固定为：

```text
License & Plate Photo -> Vehicle Controls -> Vehicle Inspection
```

除顶部只读仪表板外，取车页不展示首页已有的车牌号、车辆品牌、车型、油量/电量或里程信息。页面进入时车辆保持原有状态且不自动解锁；用户可以在照片为空、上传中或上传失败时主动操作 Vehicle Controls，但提交验车前仍必须完成所有已登记驾驶人的证件与车牌合照。
- **验车提交（2026-10-16 修订）**：验车页删除“租车条款与注意事项”附件及双确认区块；`Continue to Contract` 不依赖材料配置或条款确认记录，仍校验前序身份审核、全员合照留存和异常照片；不再校验车辆读数、仪表盘照片或读数检查点。合同签署页的签名和最终同意条款要求继续生效，详见生产基线 §5.3.7。
- **取车事实与快照**：客户提交验车确认时，服务端必须先校验订单未取消、尚未取车且没有并发附加项保存；校验通过后，在同一事务写入 `pickup_completed_at`、`canonical_status=PICKED_UP`，并冻结包含线上预订项和门店新增项的完整 `pickup_addons_snapshot`。成功后才进入合同签署页。
- **合同签署页只读原则 (Contract Screen Read-Only Policy)**：
  - 默认除「手写签名」与「同意合约条款 checkbox」外，其余字段、证件图片均为**只读**。
  - 预订相关字段（如订单号、车型、取还车时间地点、主驾驶联系方式）来自 Reservation / Booking Information。
  - 护照、驾照、IDP 等证件图片来自 Online Check-In 阶段已审核通过的资料；前端 demo 可使用 mock 图片进行展示。
  - 前端需明确提示：本页资料已预填并锁定，仅供用户复核后签署。
  - 合同页只能读取取车完成时冻结的订单与附加项快照，不得读取门店后续变化覆盖当前签署内容。
  - 合同页必须展示 `pickup_addons_snapshot` 中的线上预订项和门店新增项，并按分组展示项目名称、数量、金额及币种；没有项目时展示明确的无附加项状态。
  - 上述附加项内容仅供复核，必须为只读，不允许编辑、删除、调整数量、改价或在客户端重新计算金额；展示值以服务端冻结快照为准。
  - 签字成功只写入签署事实并触发合同生成，不再承担 `CONFIRMED -> PICKED_UP` 的主状态推进。
  - 取车完成后尚未签字、签字失败、合同生成中或生成失败，均不得重新开放门店附加项入口；合同签署后的新增附加项依赖后续“支持合同补充协议”需求，本期不支持。

#### 3.2.2.1 多人驾驶证件与车牌合照（2026-10-28）

**目标与边界**：客户在车辆旁逐一拿出已登记驾驶人的驾驶证件，拍摄与本车车牌同框的照片。只形成提醒与现场留存，不重复证件审核，不新增人脸采集、签名、勾选、客户自删驾驶人或模拟审核。保持 Inspection 原页面及返回栈，不新增子页或弹窗流程。主驾驶1名、额外驾驶人0至3名。

**名单来源与绑定**：订单提供 `onlineCheckinDrivers = { revision, drivers: [{ id, name, role, credentialType }] }`，类型覆盖日本传统驾照、IDP、驾照加日文译本、マイナ免許証。快照只承载已提交并已通过前序资格审核的驾驶人，客户不能修改；类型缺失、空名单、重复ID或多个主驾驶等不完整快照不按客户名、数组下标或国籍生成默认人选。显示名单不可用及联系门店提示并阻断取车确认。当前本地演示通过显式fixture注入单人和多人名单，未提交/待审核账号沿用原入口拦截；生产订单服务接入不在本地演示交付范围。

**首屏与交互**：区块顺序为标题及查看示例、常驻浅橙携带提示、简短拍摄要求、已上传人数、逐人拍照位置、用途说明。每行明确姓名、主/额外驾驶人、待拍摄/上传中/已上传/上传失败状态。主区和查看示例均不展示额外的清晰度／无需重拍全部页面说明，各驾驶人行不展示按证件类型区分的拍摄提示，不保留对应空白或失效可访问描述引用。每人只保留一张，替换时保留旧成功记录直到新图保存成功；上传失败可重试同一文件。上传进行中禁止继续，其他人员的已完成记录不丢失。拍照/预览/重拍/示例按钮热区至少44px，长姓名和多语自然换行；图像预览使用可关闭的普通图片Dialog，支持Escape、恢复触发点焦点，无额外采集导航。

**拍摄要求**：照片同时显示证件及本车前或后车牌，姓名、证件照片及车牌号可辨；日本驾照使用日本驾照，IDP使用IDP本人资料页，驾照加译本的驾驶资格沿用前序审核，不要求重新完整拍摄全部材料；这些类型规则保留为证据口径，不在人员行增加提示文案。可由同行人员协助操作，不要求客户脸部入镜。Web使用相机优先文件入口，权限被拒时提示开启权限或联系门店；系统选择器取消不清空旧图，相机入口不作为防旧图或真实性保证。使用图片类型与大小校验；图片读取、解码、持久化失败显示对应人的页内错误和重试入口。照片不触发OCR或审核，上传后不写入前序资格审核状态。

**数据与恢复**：新 `driverPhotoConfirmation` 存储订单号、车辆号、名单版本和每人照片、稳定驾驶人ID、姓名/角色/资格快照及保存时间。新照片按订单+车辆+名单版本存入独立媒体存储层，刷新/返回可恢复；只恢复与完整快照一致的记录。改名/资格变更须由来源快照更新版本；切换车辆、订单或名单版本不继承旧证据。旧订单级 `verificationPhotos` 保持历史只读展示，不能当作任意驾驶人的新照片。名单读取失败与媒体读取失败均有常驻提示，后者提供重试；无成功读回前不算完成。异步切换订单与卸载不得把结果写入另一驾驶人，旧异步写入只属于原绑定键。

**完成与阻断**：当前有效名单每人均保存一张且无上传中动作时，此项完成；任何人缺照片、绑定不匹配、名单不可用或恢复失败都阻断取车确认。最终提交函数及合同准入重新校验当前订单/车辆/名单，不能只看照片总数。提醒没有额外确认勾选。异常证据及车门指令进行中条件继续生效；读数、仪表盘照片和读数检查点不构成提交条件，照片未齐不改变现有车门检查入口。新记录兼容聚合状态为 `uploaded`，不是 `approved`。历史无逐人字段的已完成验车记录沿用历史合同准入；新取车不得利用该兼容分支跳过全员采集。

**本地与生产边界**：本版媒体适配器使用浏览器IndexedDB留存经图像解码的照片，不发送至生产服务；成功状态代表本地留存成功。名单fixture代表演示账号此前已审核的资料，不把简化Online Check-in提交模拟成真实审核通过。保留生产替换点，不承诺后端上传、法定合规认证、照片真实性或全租期携带保证。未连接前序真实名单的生产环境必须显示不可用，不能回退到演示名单。

**i18n**：系统文案进入 `driverPhotoTranslations`，覆盖zh-CN、zh-TW、en、ja、ko、th；姓名、车牌作为原样业务数据。核心资源如下，其余状态与错误同义交付六语：

| key | zh-CN | zh-TW | en | ja |
|---|---|---|---|---|
| driverPhotoTitle | 驾驶证件与车牌合照 | 駕駛證件與車牌合照 | Driving document & plate photos | 運転書類とナンバープレートの写真 |
| driverPhotoCarryTitle | 驾驶时请随身携带证件 | 駕駛時請隨身攜帶證件 | Carry your documents when driving | 運転時は必要書類を携帯してください |
| driverPhotoCarryBody | 依日本《道路交通法》，每位驾驶人（含额外驾驶人）驾驶时，均须携带适用且有效的驾驶证件。请在驾驶前确认已带齐相关证件。 | 依日本《道路交通法》，每位駕駛人（含額外駕駛人）駕駛時，均須攜帶適用且有效的駕駛證件。請在駕駛前確認已帶齊相關證件。 | Under Japan’s Road Traffic Act, every driver, including additional drivers, must carry the applicable valid driving documents while driving. Before driving, check that you have all required documents. | 日本の道路交通法により、追加運転者を含むすべての運転者は、運転時に必要な有効な運転書類を携帯する必要があります。運転前に必要書類がすべてそろっていることをご確認ください。 |
| driverPhotoProgress | 已上传 {count} / {total} 人 | 已上傳 {count} / {total} 人 | Uploaded for {count} / {total} drivers | {total}名中{count}名の写真を保存済み |
| driverPhotoRequired | 请完成每位已登记驾驶人的合照。 | 請完成每位已登記駕駛人的合照。 | Add a photo for every registered driver. | 登録されたすべての運転者の写真を追加してください。 |

**BDD验收**：

- AC-DP-1：Given已审核单人或多人名单，When打开取车验车页，Then按稳定ID逐人显示主驾驶和额外驾驶人，携带提示位于拍摄说明之前，繁中使用已确认正文且不出现已删除的照片替代句，无额外勾选或审核动作。
- AC-DP-2：Given三名驾驶人，When仅保存同一人的照片或照片总数充足但另一人缺照片，Then该人仍只计1人且不能继续；全员成功且原有证据齐全后才允许继续。
- AC-DP-3：Given任一证件类型的驾驶人，Then人员行直接展示姓名、角色、上传状态和拍照操作，不显示日本驾照、IDP、驾照加译本或マイナ免許証的分类提示；主区及查看示例均不显示额外清晰度说明，无对应空占位或失效可访问描述引用，未重新添加护照、入境记录或逐页拍摄表单。
- AC-DP-4：Given已有一人的成功照片，When另一人失败或该人重拍失败，Then旧成功照片保留，页内提示可重试，取消文件选择不清空照片；进行中始终阻断继续。
- AC-DP-5：Given订单、车辆及名单版本完全一致，When返回/刷新并重新进入，Then恢复按人照片；Given任一绑定变化、额外人员新增或重复ID，Then旧照片不构成完成，无法越过最终提交守卫。
- AC-DP-6：Given历史无逐人绑定的已完成记录，Then历史详情仍可查看；Given新取车，Then不能把历史订单级照片分给主驾驶或其他驾驶人。新详情按人显示照片且无审核通过文案。
- AC-DP-7：Given新上传完成，Then只显示已上传，不模拟延迟审核/首轮驳回；车门、异常、合同和用车权限边界保持，仪表盘采集及读数门槛按本文件第0节取消。
- AC-DP-8：Given六语、窄屏、长姓名或键盘操作，Then提示完整可读、状态含文字、操作至少44px、预览可关闭且焦点恢复；浏览器交互由人工验收。

#### 3.2.3 預訂詳情与駕駛人身份驗證信息布局优化

本次布局优化仅适用于合同签署页的 `Reservation Details` 与 `Driver Identification` 两个信息区块，不影响附加项、证件图片、手写签名、条款确认、底部 CTA 或合同状态逻辑。

- `[MOD]` 两个区块合并到同一个“签署前核对”容器中；容器内部仍保留 `Reservation Details` 与 `Driver Identification` 两个独立标题，字段直接完整展示，不增加“查看完整详情”、折叠或二次跳转动作。
- `[MOD]` 预订字段改为紧凑信息行或双列只读布局，仍完整展示 `REF ID`、`CONFIRMATION NO.`、车型、客户姓名、取车时间、取车地点、还车时间和还车地点。
- `[MOD]` `REF ID` 与 `CONFIRMATION NO.` 是两个不同的业务字段，必须始终分别渲染、分别标注并分别保留值；selfservice 演示数据使用不同示例值，且即使上游数据恰好相同，也不得合并、去重或推断为同一编号。
- `[MOD]` 驾驶人字段改为紧凑信息行或双列只读布局，仍完整展示名字、姓氏、居住身份、联系电话、Email 和额外驾驶人数量；不得因为姓名可合并而删除 `FIRST NAME` 或 `LAST NAME` 字段。
- `[MOD]` 每个字段继续展示其原有来源标签（`Reservation` 或 `Online Check-In`）；本次不做来源标签聚合或移除。
- `[UNCHANGED]` 上述字段继续只读，用户不可编辑、删除、改价、重新提交或修改来源；字段值仍分别来自 Reservation / Booking Information 与已审核的 Online Check-In 记录。

**布局优化 i18n 增量**

| resource_key | zh-CN | zh-TW | en | ja | ko | th |
|---|---|---|---|---|---|---|
| `contractReviewBeforeSigning` | 签署前核对 | 簽署前核對 | Review before signing | 署名前の確認 | 서명 전 확인 | ตรวจสอบก่อนลงนาม |

**布局优化验收场景**

- **场景 W：预订与驾驶人区块合并且直接展开**
  - **Given** 客户满足合同签署准入条件并进入 `Contract`
  - **When** 页面完成加载
  - **Then** `Reservation Details` 与 `Driver Identification` 位于同一个“签署前核对”容器中
  - **And** 两个区块的全部字段直接展示
  - **And** 页面不提供“查看完整详情”、折叠或二次跳转动作
  - **And** 附加项、证件图片、签名、条款确认与底部 CTA 的现有区块不发生布局或行为变化

- **场景 X：两个预订编号字段保持独立**
  - **Given** `orderNumber` 与 `confirmationCode` 可用
  - **When** 客户查看预订详情
  - **Then** 页面分别展示 `REF ID` 与 `CONFIRMATION NO.`
  - **And** 两个字段分别展示各自的来源标签和值
  - **And** selfservice 演示账号的两个示例值不同
  - **And** 不因上游值相同而合并或隐藏任一字段

- **场景 Y：驾驶人字段完整直接展示**
  - **Given** 客户存在已审核的驾驶人资料
  - **When** 客户查看驾驶人身份验证
  - **Then** 直接展示名字、姓氏、居住身份、联系电话、Email 和额外驾驶人数量
  - **And** 每个字段保持只读
  - **And** 每个字段继续展示 `Reservation` 或 `Online Check-In` 来源标签

- **场景 Z：信息布局优化不改变签署门禁**
  - **Given** 客户未完成手写签名或未同意条款
  - **When** 客户点击底部主 CTA
  - **Then** 仍按原有逻辑阻止提交并展示校验提示
  - **And** 信息区块的合并与直接展开不改变合同签署状态、取车事实或合同生成流程

**合同取车附加项展示 i18n 增量**

| resource_key | zh-CN | en | ja |
|--------------|-------|----|----|
| `contractPickupAddonsTitle` | 取车时冻结的附加项 | Add-ons frozen at pickup | 受取時に確定した追加項目 |
| `contractPickupAddonsHint` | 以下只读项目已在取车完成时冻结，将用于您的合同 | These read-only items were frozen when pickup was completed and will be used for your agreement. | 以下の項目は受取完了時に確定され、契約書の内容に使用されます。 |
| `contractOnlineAddonsLabel` | 线上预订 | Online booking | オンライン予約 |
| `contractStoreAddonsLabel` | 门店新增 | Added by the store | 店舗追加 |
| `contractNoAddons` | 无附加项 | No add-ons | 追加項目なし |

### 3.3 取车车机控制逻辑重构 (Vehicle Control Logic)
为配合“极简复核”中让客户能够进入车内检查车况的需求，需对目前的车机控制指令下发时机进行重构（指令基于智信通《车辆位置、状态及控制接口 V1.0》的 `/controlCar` 端点）。

#### 3.3.1 现状 (AS-IS)
- 逻辑：客户必须在手机上全部完成外观拍照、确认车况并**同意签署了电子合同之后**，系统才允许执行开门。
- 痛点：导致客户在未解锁开门前完全无法检查车室内部（如严重污染、烟味及内饰件损坏）。如果客户签了合同才发现内饰恶劣，极易产生退单纠纷。

#### 3.3.2 目标 (TO-BE)
将车门解锁前置到验车阶段，但不允许页面进入时自动下发车控指令。客户必须在车辆控制区主动触发操作；系统在发送指令前重新读取车门状态，并在弱网环境下等待车辆实际状态确认。车辆动力仍由后端按取车阶段策略进行物理阻断，保障资产防盗安全。

- **阶段一：验车时开门授权 (Inspection Phase)**
  - **触发条件**：客户进入 Inspection 页面后，在 Vehicle Controls 中主动点击“解锁车门”或“锁闭车门”；不要求先完成 License & Plate Photo，页面进入时不得自动发送解锁指令。
  - **前置守卫**：点击后先调用 `queryCarStatus` 查询车门状态。如果目标状态已经达到，只更新页面，不发送重复指令；查询失败时不得在未知状态下盲目重试指令。
  - **未知状态处理**：如果查询成功但返回 `UNKNOWN`，保持车控弹窗为失败 / 可重试状态，不发送解锁或锁闭指令。
  - **操作指令**：确认车门仍处于锁闭状态后，后端调用 `controlCar` 的 `500 (开门)`。如车型安全策略要求验车期间断电，后端在开门编排成功后调用 `100 (断电)`；该动力控制不由客户页面直接呈现。
  - **效果预估**：客户可以拉开车门进入车内检查。但即便有人破坏点火开关，由于系统执行了断电，引擎依旧无法启动。
  
- **阶段二：取车后签约与启动授权 (Post-Pickup Contract Signed Phase)**
  - **触发条件**：客户确认车况、取车事实已成立、**完全签署电子合同且正式合同附件生成成功**（`contract_attachment_status=READY`）。
  - **操作指令**：后端系统向智信通调用 `101 (供电)` 指令。
  - **效果预估**：解除点火限制。取车事实在验车确认事务中成立，合同签字和附件生成完成后才允许进入真正用车态；供电仅决定车辆能否启动，不再推进订单主状态。前端在合同签署完成页需显著提示“车辆引擎已解锁，可以发动车辆”，以明确区分此前“仅允许开门、已确认取车但尚未解锁引擎”的状态；客户此时方可正常发车驶离。

#### 3.3.3 弱网车门操作交互

车门解锁和锁闭均使用同一套异步交互模型。操作弹窗用于明确告知客户系统正在等待车辆响应，避免客户在弱网环境下重复点击。

**页面状态与弹窗规则**

| 阶段 | 页面 / 弹窗文案 | 是否可关闭 | 可执行动作 |
|---|---|---|---|
| `CHECKING_STATUS` | 正在确认车门状态 | 否 | 不允许其他车控操作 |
| `UNLOCKING` | 正在解锁车门 | 否 | 不允许其他车控操作 |
| `LOCKING` | 正在锁闭车门 | 否 | 不允许其他车控操作 |
| `VERIFYING_STATUS` | 指令已发送，正在确认车辆状态 | 否 | 不允许其他车控操作 |
| `SUCCEEDED` | 车门已解锁 / 车门已锁闭 | 是 | 更新状态后结束弹窗 |
| `TIMEOUT` | 操作超时 | 是 | 再次操作、关闭 |
| `FAILED` | 暂时无法控制车门 | 是 | 再次操作、关闭 |

处理中弹窗必须满足以下约束：

- 不显示关闭按钮；点击遮罩层、按 `Esc` 或页面内部返回操作均不能中断车控等待。
- 遮罩层阻止第二个车控命令和 `Continue to Contract` 提交。
- 不显示动态剩余秒数，超时时间只用于内部截止判断。
- 成功后更新 Vehicle Controls 的 Door status；成功提示采用提醒色，强调“可进入车内检查”，不表示取车或合同已经完成。

**超时规则**

- 单次操作默认超时时间为 **20 秒**，从客户点击按钮开始计算，包含状态查询、指令受理和实际状态确认。
- `controlCar` 返回 `code=1` 只表示智信通服务端已受理，不得直接视为车辆已完成操作；必须继续通过 `queryCarStatus` 或有效的车身状态推送确认目标状态。
- 超时文案必须说明“车辆可能已经完成操作”，不能直接断言操作失败。
- 客户点击“再次操作”后，系统必须使用新的 `request_id`，先重新查询车门状态；只有确认目标状态尚未达到时才允许发送新指令。

#### 3.3.4 车门状态查询与自动重新落锁识别

当前接入以主动查询为主，页面不得依赖单次控制接口响应判断最终状态：

- 进入 Inspection 页面时调用一次 `queryCarStatus`，只读取并展示当前状态，不触发解锁。
- 车门指令受理后立即查询一次，之后每 **2 秒**查询一次，直到目标状态确认或达到 20 秒截止时间。
- 解锁成功后在后台继续观察约 **30 秒**，不在页面展示倒计时。
- 页面从后台恢复前台、重新获得焦点时立即补查一次车门状态。

系统需记录最近一次操作来源：`lastCommand=UNLOCK|LOCK|NONE`、`lastCommandAt`、`unlockSessionId`。

当状态出现以下转换，且期间没有客户主动点击“锁闭车门”时，标记为“车辆已重新落锁”：

```text
UNLOCKED -> LOCKED
```

前台提示：

```text
车辆已重新落锁
请再次点击“解锁车门”。解锁后请立即拉开车门并开始验车。
```

若后端可返回锁闭原因，使用 `PROTECTION_AUTO_LOCK`、`USER_COMMAND` 或 `UNKNOWN` 区分；没有原因字段时，前台只展示“车辆已重新落锁”，不直接断言保护机制已触发。

#### 3.3.5 车控接口与幂等约束

Customer 页面通过 customer vehicle-control service 调用后端适配层，不在 JSX 中直接拼接智信通请求。适配层至少提供：

| 能力 | 语义 | 结果要求 |
|---|---|---|
| `getDoorStatus` | 读取当前车门状态 | 返回 `LOCKED / UNLOCKED / UNKNOWN` 与状态接收时间 |
| `sendDoorCommand(UNLOCK)` | 发送 `controlCar cmd=500` | 返回受理结果和 `command_id` |
| `sendDoorCommand(LOCK)` | 发送 `controlCar cmd=501` | 返回受理结果和 `command_id` |

每次操作必须携带唯一 `request_id`，后端按订单、车辆和请求号提供幂等处理。超时或网络异常时不得自动发送第二条指令；重试必须由客户触发并创建新的请求号。

本地预览使用 mock adapter 验收异常状态时，可在入口地址追加以下参数；这些参数不属于生产接口契约：

| 参数 | 预览行为 |
|---|---|
| `doorControlDemo=timeout` | 模拟车控接口响应超过 20 秒，进入超时弹窗 |
| `doorControlDemo=fail` | 模拟车控接口明确拒绝，进入失败弹窗 |
| `doorControlDemo=auto-lock` | 解锁成功后模拟车辆在观察窗口内重新落锁 |

**车门控制 i18n 增量**

| resource_key | zh-CN | en | ja |
|---|---|---|---|
| `inspectionVehicleControlsTitle` | 车辆控制 | Vehicle Controls | 車両コントロール |
| `inspectionDoorStatusLabel` | 车门状态 | Door status | ドアの状態 |
| `inspectionDoorStatusLocked` | 已锁闭 | Locked | ロック中 |
| `inspectionDoorStatusUnlocked` | 已解锁 | Unlocked | ロック解除済み |
| `inspectionDoorStatusUnknown` | 无法取得状态 | Status unavailable | 状態を取得できません |
| `inspectionDoorStatusChecking` | 正在确认车门状态 | Checking door status | ドアの状態を確認中 |
| `inspectionDoorStatusUnavailable` | 目前无法确认最新车门状态，请稍后再试。 | We could not confirm the latest door status. Please try again. | 最新のドア状態を確認できませんでした。もう一度お試しください。 |
| `inspectionUnlockDoors` | 解锁车门 | Unlock doors | ドアを解錠 |
| `inspectionLockDoors` | 锁闭车门 | Lock doors | ドアを施錠 |
| `inspectionDoorInstruction` | 验车前请先解锁车门，并在解锁后立即拉开车门开始验车。若未及时开门，车辆可能会自动上锁；如已上锁，请再次点击“解锁车门”。 | Before inspection, unlock the doors, then open a door and start your inspection immediately. If you do not open a door in time, the vehicle may lock automatically. If it is locked, tap "Unlock doors" again. | 点検前にドアを解錠し、解錠後すぐにドアを開けて点検を開始してください。すぐにドアを開けない場合、車両が自動的に施錠されることがあります。施錠された場合は、もう一度「ドアを解錠」をタップしてください。 |
| `inspectionDoorUnlocking` | 正在解锁车门 | Unlocking doors | ドアを解錠しています |
| `inspectionDoorLocking` | 正在锁闭车门 | Locking doors | ドアを施錠しています |
| `inspectionDoorChecking` | 正在确认车辆当前的车门状态。 | We are confirming the vehicle's current door status. | 車両の現在のドア状態を確認しています。 |
| `inspectionDoorVerifying` | 指令已发送，正在确认车辆的实际车门状态。 | The command was sent. We are confirming the vehicle's actual door status. | 指示を送信しました。車両の実際のドア状態を確認しています。 |
| `inspectionDoorWaiting` | 请稍候，正在等待车辆响应。 | Please wait while we wait for the vehicle to respond. | 車両からの応答を待っています。 |
| `inspectionDoorUnlocked` | 车门已解锁 | Doors unlocked | ドアを解錠しました |
| `inspectionDoorLocked` | 车门已锁闭 | Doors locked | ドアを施錠しました |
| `inspectionDoorAlreadyUnlocked` | 车门目前已解锁 | Doors already unlocked | ドアはすでに解錠されています |
| `inspectionDoorAlreadyLocked` | 车门目前已锁闭 | Doors already locked | ドアはすでに施錠されています |
| `inspectionDoorLockSuccess` | 车门已成功锁闭。 | The vehicle doors are now locked. | 車両のドアを施錠しました。 |
| `inspectionDoorLastUpdated` | 已收到最新状态 | Latest status received | 最新状態を受信済み |
| `inspectionDoorLockedAgainTitle` | 车辆已重新落锁 | Vehicle was locked again | 車両が再び施錠されました |
| `inspectionDoorLockedAgainBody` | 请再次解锁车门，并在解锁后立即拉开车门开始验车。如再次发生，请联系门店。 | Please unlock the doors again, then open a door and start your inspection right away. Contact the store if this happens again. | もう一度ドアを解錠し、解錠後すぐにドアを開けて点検を開始してください。再発する場合は店舗へご連絡ください。 |
| `inspectionDoorTimeoutTitle` | 操作超时 | Operation timed out | 操作がタイムアウトしました |
| `inspectionDoorTimeoutBody` | 暂时没有收到车辆的最终状态。车辆可能已经完成操作，请重新确认状态后再试。 | We did not receive the vehicle's final status. The vehicle may have completed the operation. Check the status and try again. | 車両の最終状態を確認できませんでした。操作が完了している可能性があります。状態を確認して再試行してください。 |
| `inspectionDoorFailureTitle` | 暂时无法控制车门 | Unable to control the doors | ドアを操作できません |
| `inspectionDoorFailureBody` | 车辆未接受本次操作，请稍后再试。 | The vehicle did not accept this operation. Please try again. | 車両が操作を受け付けませんでした。もう一度お試しください。 |
| `inspectionDoorRetry` | 再次操作 | Try again | 再試行 |
| `inspectionDoorClose` | 关闭 | Close | 閉じる |

### 3.4 现状 vs 目标 对比清单
| 维度 | AS-IS (生产基线) | TO-BE (本次迭代) |
|---|---|---|
| **拍照责任主体** | 租客负责全部 (Customer) | **调度员 (Dispatcher)** 主责入库拍照，租客仅验明正身 |
| **租客操作链路** | 必需完成全套车身拍照 | 验证身份后，勾选 **Confirm & Accept Current Vehicle Condition** 快速通过 |
| **照片展示形式** | 上下滚动的列表/网格 | 分类模块化基准图：**Current Vehicle Condition (Exterior)**、**Current Vehicle Condition (Interior)**、**Existing Damage Report** |
| **异常反馈流程** | 统合在车身四角照片中额外填字 | 点击勾选 **Report Exception** 时独立展开新增凭证上传区 |
| **车况基线来源** | 每次以租客本次自拍为准，缺乏追溯 | 以调度员锁定的基准照 (Read Only) 作为判责基线 |
| **取车与车机控制时机** | 页面进入后可能自动触发开门，且仅依据控制接口响应 | 客户主动点击车门操作；先查状态、再下发指令并轮询实际状态；解锁成功后观察约 30 秒是否重新落锁；确认验车时形成取车事实并冻结快照；签署后生成正式合同，附件 `READY` 后供电启动 |

### 3.5 自助取车停车费告知与驶离提醒

#### 3.5.1 场景目标与范围

- 适用于车辆由门店投递至停车场、客户自行完成取车的自助订单。
- 在暂时无法可靠识别停车场是否收费时，自助投递订单默认展示停车费提示；后续具备稳定的免费停车场标识后，允许对明确免费的订单隐藏。
- 本期只解决停车费事项的责任告知与驶离提醒，不定义费用责任起算点、金额上限或超额处理规则。
- 本期不新增车辆投递完成通知，不新增独立的停车费详情页或 Bottom Sheet，不接入停车场支付，不要求上传停车票、发票或缴费截图。
- 复用现有 `Service Terms & Billing Rules / 服务与计费说明` 页面和内容；`Overview` 停车费提示内增加轻量详情入口，与页面底部入口导航至同一 `AppView.SERVICE_TERMS`，不得维护第二份计费规则。

#### 3.5.2 两个页面触点

| 页面 | 展示位置 | 内容与交互 | 阻断规则 |
|---|---|---|---|
| `Overview` | 车辆信息之后、取车步骤之前 | 常驻页内提示条，说明车辆可能停放在收费停车场、产生的停车费由客户承担，并提示驶离时按现场指引缴纳；正文下方展示“点击查看详细计费说明”文字按钮，点击后与页面底部“服务与计费说明”入口一样进入现有服务与计费说明页面 | 非阻断，不新增停车费专属页面或确认动作 |
| `Completion` | 合同状态与合同摘要之后、底部主按钮之前 | 常驻页内提示条，重申车辆可能停放在收费停车场、停车费由客户承担，并提醒驶离前缴费及确认可以正常出场 | 非阻断，不新增“已缴费”动作 |

`Overview` 仅在取车事实尚未成立时展示提示。`pickup_completed_at` 已存在、订单已进入用车或还车阶段时不再展示；取车完成后的即时提醒由 `Completion` 承载。

#### 3.5.3 i18n 增量资源

| resource_key | zh-CN | en | ja | ko | th |
|---|---|---|---|---|---|
| `pickupParkingFeeNoticeTitle` | 取车停车费提示 | Pickup parking fee | 受取時の駐車料金 | 픽업 주차 요금 안내 | ค่าจอดรถเมื่อรับรถ |
| `pickupParkingFeeNoticeBody` | 车辆可能停放在收费停车场，若产生费用则由您来承担。取车驶离时，请按照停车场现场指引完成停车费缴纳。 | The vehicle may be parked in a paid parking lot. You are responsible for any parking fees incurred. Follow the on-site instructions to pay before leaving. | 車両は有料駐車場に停められている場合があります。発生した駐車料金はお客様のご負担となります。出庫前に現地の案内に従ってお支払いください。 | 차량이 유료 주차장에 주차되어 있을 수 있습니다. 발생한 주차 요금은 고객이 부담합니다. 출차 전에 현장 안내에 따라 결제해 주세요. | รถอาจจอดอยู่ในที่จอดรถแบบเสียค่าบริการ โดยคุณเป็นผู้รับผิดชอบค่าจอดรถที่เกิดขึ้น โปรดชำระตามคำแนะนำ ณ สถานที่ก่อนออก |
| `pickupParkingFeeDetailsLink` | 点击查看详细计费说明 | View detailed billing information | 詳しい料金説明を見る | 상세 요금 안내 보기 | ดูรายละเอียดการคิดค่าบริการ |
| `pickupParkingFeeCompletionTitle` | 驶离前请完成停车费缴纳 | Pay the parking fee before leaving | 出庫前に駐車料金をお支払いください | 출차 전에 주차 요금을 결제해 주세요 | ชำระค่าจอดรถก่อนออก |
| `pickupParkingFeeCompletionBody` | 车辆可能停放在收费停车场，该费用由您承担。取车驶离时，请按照停车场现场指引完成停车费缴纳，确认可以正常出场后再驶离。 | The vehicle may be parked in a paid parking lot. You are responsible for the parking fee. When leaving with the vehicle, follow the parking lot's on-site instructions to pay, and confirm you can exit normally before driving away. | 車両は有料駐車場に停められている場合があり、その駐車料金はお客様のご負担となります。車両で出庫する際は、現地の案内に従って料金を支払い、正常に出庫できることを確認してから出発してください。 | 차량이 유료 주차장에 주차되어 있을 수 있으며, 해당 주차 요금은 고객이 부담합니다. 차량을 인수해 출차할 때는 현장 안내에 따라 결제하고 정상 출차가 가능한지 확인한 후 출발해 주세요. | รถอาจจอดอยู่ในที่จอดรถแบบเสียค่าบริการ โดยคุณเป็นผู้รับผิดชอบค่าจอดรถดังกล่าว เมื่อรับรถและขับออก โปรดชำระเงินตามคำแนะนำ ณ สถานที่ และตรวจสอบว่าสามารถออกได้ตามปกติก่อนออกเดินทาง |

#### 3.5.4 验收场景

- **场景 S：Overview 提前展示停车费提示**
  - **Given** 自助投递订单尚未完成取车
  - **When** 客户进入 `Overview`
  - **Then** 车辆信息之后展示停车费提示标题和正文
  - **And** 提示正文下方展示“点击查看详细计费说明”入口，触控热区高度不小于 44px
  - **When** 客户点击该入口
  - **Then** 导航到与页面底部“服务与计费说明”相同的 `AppView.SERVICE_TERMS`
  - **And** 不新增停车费专属详情页、弹窗、确认状态或独立计费内容
- **场景 T：Completion 展示非阻断驶离提醒**
  - **Given** 客户已完成取车并进入 `Completion`
  - **When** 页面展示合同生成中、失败或成功状态
  - **Then** 均展示驶离前缴纳停车费提示
  - **And** 不要求上传凭证或点击“已缴费”

### 3.6 还车 Location & Parking 优化

#### 3.6.1 LOCATION & PARKING 提示增强
- 在 `Take a wide photo showing the car and the parking number or a nearby pillar.` 提示前，新增门店联系方式提醒：`If fail to return vehicle, please contact the store at {number}.`
- 该提醒**仅在用户当前位置位于围栏外**时展示；围栏内或定位检查中均不展示。
- `Take a wide photo...` 区域新增 `View Example` 入口，点击后展示 1 张停车拍照示例图与说明。
- 当前阶段示例图允许使用**占位示例图**；后续设计素材到位后可直接替换，不改变交互结构。

#### 3.6.2 还车检查清单（2026-10-28）
- 角色与入口：客户进入自助还车第一步「位置与停车」，停车信息卡片下展示独立的白底圆角「还车检查清单」卡片。
- 视觉层级：标题下按顺序纵向排列钥匙、灯泡和锁三个深色线性图标；图标置于浅橙圆形底上，右侧为一条简短说明。行间留白一致，图标不收缩，长文案自然换行，适配窄屏及各语言。
- 三条提示依次为：将钥匙放回手套箱内的钥匙盒；关闭车头灯和车内灯；点击「结束行程」后车辆将自动上锁。
- 三项均为静态操作提示，不增加勾选框、确认状态或车控请求；展示提示不代表系统已核实钥匙、灯光或锁车状态。
- 移除钥匙归还照片上传区、必填标签、重复说明和缺图提示；不新增或提交钥匙照片字段。
- 第一步「下一步：车辆检查」仍受现有定位门禁约束：定位检查中或围栏外禁用，定位通过可进入第二步，不再依赖钥匙照片。定位失败继续使用现有页内原因、重新定位及联系门店路径；第二步返回第一步时保留现有会话数据。
- 五语文案沿用 App 的 `returnTranslations` 资源，不修改历史还车凭证使用的 `returnChecklistTitle`。清单不引入新的异步状态、上传权限或失败链路。

| i18n key | zh-TW | en | ja | ko | th |
|---|---|---|---|---|---|
| `returnSafetyChecklistTitle` | 還車檢查清單 | Return checklist | 返却チェックリスト | 반납 체크리스트 | รายการตรวจสอบก่อนคืนรถ |
| `returnKeyInstruction` | 請將車鑰匙放回手套箱內的鑰匙盒 | Return the car key to the keybox in the glove compartment | 車のキーをグローブボックス内のキーボックスに戻してください | 차량 열쇠를 글로브 박스 안의 키 박스에 넣어 주세요 | โปรดนำกุญแจรถกลับไปใส่ในกล่องกุญแจในช่องเก็บของหน้ารถ |
| `returnLightsInstruction` | 關閉車頭燈和車內燈 | Switch off the headlights and interior lights | ヘッドライトと室内灯を消してください | 전조등과 실내등을 꺼 주세요 | ปิดไฟหน้าและไฟภายในรถ |
| `returnLockInstruction` | 點選「結束行程」後車輛將自動鎖定 | The vehicle will lock automatically after you tap “End Trip” | 「利用を終了」をタップすると車両が自動で施錠されます | ‘이용 종료’를 누르면 차량이 자동으로 잠깁니다 | รถจะล็อกอัตโนมัติหลังจากแตะ “สิ้นสุดการเดินทาง” |

#### 3.6.3 Vehicle Inspection 调整
- 还车第 2 步 `Vehicle Inspection` 页面需移除 `Lights Check` 模块，不再单独要求用户上传灯光照片。
- 第 2 步不再展示灯光和上锁 checklist，也不保留相应勾选提交门槛；安全操作提醒由第一步检查清单、联系门市提示和最终结束行程弹窗承载。
- `Damage Report` 显示默认“无”的无／有单选；选有后展开可选说明与最多 4 张补充照片。切回无后提交不包含隐藏的说明和照片。
- 只读仪表板、外观上传、联系门市与费用提示的顺序、数据缺失恢复、五语和 BDD 统一按生产基线 §5.4.1 执行。

#### 3.6.4 验收补充场景
- **场景 A：解锁提示色变更**
  - **Given** 用户进入取车验车页并触发开锁指令
  - **When** 开锁成功
  - **Then** 页面显示警示色提示条，且文案包含 `interior inspection`
- **场景 B：围栏外提醒**
  - **Given** 用户位于有效还车围栏外
  - **When** 位置校验完成
  - **Then** 展示联系电话提醒
  - **And** 围栏内或定位检查中不展示该提醒
- **场景 C：三项提示与定位准入**
  - **Given** 客户进入还车第一步
  - **Then** 检查清单按钥匙、灯光、自动锁车顺序展示三项图标提示，没有照片上传、必填标签或勾选框
  - **When** 定位检查中或结果在有效围栏外
  - **Then** 下一步保持禁用，围栏外沿用现有重新定位及门店联系入口
  - **When** 重新定位通过且未上传钥匙照片
  - **Then** 可进入车辆检查；返回第一步仍展示三项提示，且不触发锁车或完成还车
  - **And** 在 320px 窄屏及五种语言下，文案完整换行，图标不压缩，底部按钮不遮挡清单
- **场景 D：签约后引擎解锁提示**
  - **Given** 用户已完成验车确认，订单已写入 `PICKED_UP` 与 `pickup_completed_at`
  - **And** 用户已完成合同签署且合同附件状态为 `READY`
  - **When** 进入合同签署完成页
  - **Then** 页面显著提示车辆引擎已解锁，可以发动车辆
  - **And** 该提示需明确区别于验车阶段“仅开门、未解锁引擎”的状态
  - **And** 签约完成页不得再次推进取车主状态
- **场景 E：第二步不重复检查清单**
  - **Given** 用户已进入还车第 2 步 `Vehicle Inspection`
  - **Then** 页面不再展示 `Lights Check` 模块
  - **And** 页面不再展示灯光或上锁 checklist 确认项
  - **And** 提交条件及最终结束行程确认按生产基线 §5.4.1 执行
- **场景 F：车损图片补充上传**
  - **Given** 用户在还车第 2 步填写了 `Damage Report`
  - **Then** 页面允许继续上传车损图片作为佐证

#### 3.6 Online Check-in 未开始演示流程

- `NOT_STARTED01 + Smith` 作为 `NOT_SUBMITTED` 演示订单，登录后进入乘客端 Online Check-in 表单。
- 表单包含主驾驶人资料、证件文件选择（本地文件或示例证件）和条款确认。
- 提交动作仅更新当前 demo 会话中的状态；不上传或持久化真实证件文件。
- 提交成功后状态变为 `PENDING_REVIEW`，页面提示资料已提交并阻止进入自助取还流程。
- 运行时资源 key 使用 `demoOnlineCheckinNotStarted*` 与 `checkin*`，提供 `zh-TW / en / ja / ko / th` 文案。

**验收场景**

- **场景 G：从未开始的 Check-in**
  - **Given** 用户使用 `NOT_STARTED01 + Smith` 登录
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

- **场景 J：验车确认先形成取车事实**
  - **Given** 自助订单满足车辆可取、押金、Online Check-in 与现场验车门禁
  - **And** 当前没有正在提交的附加项变更
  - **When** 客户提交验车确认
  - **Then** 服务端在同一事务写入 `pickup_completed_at` 和 `canonical_status=PICKED_UP`
  - **And** 冻结当前线上预订项与门店新增项完整快照
  - **And** 页面随后进入合同签署

- **场景 K：签字或合同失败不重新开放附加项**
  - **Given** `pickup_completed_at` 已存在
  - **When** 合同尚未签字、签字失败、生成中或生成失败
  - **Then** 订单保持 `PICKED_UP`
  - **And** 门店附加项入口保持关闭
  - **And** 合同按取车时冻结快照继续签字或重试生成

- **场景 L：进入验车页不自动解锁**
  - **Given** 客户通过取车前置校验进入 Inspection 页面
  - **When** 页面完成初始化
  - **Then** 页面只调用 `getDoorStatus/queryCarStatus`
  - **And** 不调用 `sendDoorCommand/controlCar`
  - **And** 页面先展示 License & Plate Photo，随后展示 Vehicle Controls
  - **And** 车门状态可以读取，解锁和锁闭按钮可主动点击

- **场景 R：照片为空时仍可车控**
  - **Given** 客户进入 Inspection 页面且车辆仍处于锁闭状态
  - **When** License & Plate Photo 为空、上传中或尚未验证通过
  - **Then** 页面仍允许用户主动点击“解锁车门”或“锁闭车门”
  - **And** 用户点击车门按钮后才开始 20 秒车控等待和后续重新落锁观察
  - **And** 提交验车前仍阻止未完成照片验证的记录进入合同

- **场景 M：目标状态已达到时不重复下发**
  - **Given** 当前车门状态已经是客户点击的目标状态
  - **When** 客户点击“解锁车门”或“锁闭车门”
  - **Then** 系统先查询实时状态
  - **And** 不发送重复车控指令
  - **And** 页面提示车门当前已经处于目标状态

- **场景 N：车控等待期间锁定弹窗**
  - **Given** 客户点击车门控制按钮且操作尚未完成
  - **When** 页面等待接口或车辆状态返回
  - **Then** 展示对应的“正在解锁车门”或“正在锁闭车门”弹窗
  - **And** 弹窗无关闭入口，遮罩层和 `Esc` 均不能关闭
  - **And** 不允许并发发送第二个车控指令

- **场景 O：弱网操作超时可恢复**
  - **Given** 车控操作开始后 20 秒内未确认目标车门状态
  - **When** 达到操作截止时间
  - **Then** 展示“操作超时”弹窗
  - **And** 说明车辆可能已经完成操作
  - **And** 提供“再次操作”和“关闭”
  - **And** 点击“再次操作”时先查询状态，不直接重复发送指令

- **场景 P：自动重新落锁提示**
  - **Given** 本次解锁已确认 `UNLOCKED`
  - **And** 后台观察窗口约 30 秒内没有客户主动锁车
  - **When** 主动查询发现状态从 `UNLOCKED` 变为 `LOCKED`
  - **Then** 页面显示“车辆已重新落锁”提示
  - **And** 提供再次解锁入口
  - **And** 不直接断言为保护机制，除非接口返回明确的锁闭原因

- **场景 Q：页面恢复前台重新同步**
  - **Given** 客户在车控等待期间切换 App 或锁屏
  - **When** Inspection 页面恢复前台或重新获得焦点
  - **Then** 立即查询车门状态
  - **And** 根据实际状态展示成功、继续等待或超时恢复状态

---

## 4. 行程评价能力 (Trip Rating) 

### 4.1 背景问题
客户完成还车后可自愿反馈用车体验；评分应易于选择，不影响返回首页及查看还车凭证。

### 4.2 现状 (AS-IS)
截至本次调整前，`TripEndedScreen.tsx` 已展示 1～5 分推荐意愿、可选文字评价和反馈二维码，但仍使用推荐朋友及两端意愿文案，分值含义不够明确。评分提交仅模拟当前页面内的完成状态，未接入评价保存接口。

### 4.3 目标 (TO-BE)
客户完成还车并进入 `Trip Ended` 后，通过一个可关闭的五级满意度评价区反馈本次用车体验。
- **核心组件**：
  - **五级满意度评分**：仅提供 1、2、3、4、5 五个整数选项，对应“非常不满意、不满意、一般、满意、非常满意”。默认不预选，1 为最低分、5 为最高分；题目直接邀请客户评价本次用车体验，不再询问推荐朋友意愿。
  - **视觉与可访问性**：数字按钮在同一行五等分展示，最小触控区域为 44×44px；每档含义紧贴对应按钮下方，首尾含义加粗，允许多语言自然换行。不再展示独立的“1分最低，5分最高”说明及对应留白。未选按钮统一中性色，选中后使用品牌橙背景、白色数字和加粗含义，不使用红绿颜色区分好坏。支持可见键盘焦点、完整的分数及含义可访问名称和选中状态；320px 窄屏不得横向溢出。
  - **选中反馈**：选择或改选后，仅当前项高亮，通过按钮的可访问名称与选中状态表达结果；删除独立的“已选择：{score}分 · {label}”结果行及对应留白，不保留空的状态区域。
  - **文字评价 (Comments)**：提供可选文本域（Optional），用于补充体验反馈（最多 300 个可见字符，中文、英文、数字、标点、空格和换行计入，组合表情按一个可见字符计数）。
- **交互策略**：
  - 评价必须为低阻力流程。提交评价不应当阻塞用户查看还车凭证的动作。
  - 不增加低分原因必填项，不使用旧 NPS 分段阈值或“待改善／中立／推荐者”标签，统计语义统一为满意度。
  - 选择分值后展示可选评价及提交入口；未选择时不渲染可编辑评论或提交控件，避免隐藏控件仍可被键盘或读屏访问。只允许提交 1～5 的整数，提交中禁用评分、问题多选、评论和提交按钮，避免重复操作。
  - 用户提交评价后展示感谢组件；返回首页和关闭评价卡片保持可用，不将评分作为任何旅程准入条件。
  - 删除本页完整的外部反馈卡片，包括二维码、反馈说明和复制反馈链接按钮，以及本页专属的复制状态与处理逻辑。页面顺序为行程结束提示 → 满意度评价 → 返回首页。其他页面的投诉建议入口和共享反馈地址配置保持原有用途，不删除仍被使用的共享配置。
  - 本次不新增 API、持久化或外部表单修改；保留现有页面内模拟提交，不将模拟成功视为评价已保存到后台。订单关联和后台回流需另行接入；关闭或离开页面不新增草稿保存。
  - i18n 使用既有 `i18n/trip-ended.ts` 资源模块并接入 `LanguageContext`，覆盖简中、繁中、英语、日语、韩语和泰语。旧 `nps* / feedbackQr*` 不再作为本页展示文案来源。

### 4.3.1 问题分类及补充说明（2026-10-30）

- 选任意分值后，在评分下方显示“哪些地方需要改进？（选填，可多选）”，单列复选框整行可点击，最小触控高度 44px，长文案自然换行。未评分时不渲染该区域。
- 固定选项：找车或定位困难、取还车指引不清晰、远程开锁或关锁不顺畅、页面提示难理解、车辆状况不满意、客服服务不满意、其他问题。分别使用稳定编码 `finding_vehicle`、`pickup_return_guidance`、`remote_lock`、`page_messages`、`vehicle_condition`、`customer_service`、`other`。
- 默认不勾选；可同时选择、取消任意项，“其他问题”可与其他项共存。改分保留勾选和文字。只评分、仅选择其他问题而不填文字，均允许提交。
- 勾选“其他问题”后，在多选列表下方、补充说明之前新增独立文本框，标题“其它问题详细内容（选填）”，提示“请描述其它问题的详细内容。”。原“补充说明（选填）”始终保留原标题和提示。两个字段分别保存、分别最多300字并独立计数；不自动聚焦或弹出键盘。取消其他问题隐藏其输入框，保留本页草稿供再次勾选恢复，隐藏内容不参与提交或校验；补充说明不受影响。
- 文本框默认四行，计数初始为 `0/300`。输入、粘贴及提交使用一致的可见字符计数；超长内容保留前 300 字，显示“最多可输入 300 字”。中文输入法组合期间不截断，组合结束再校验，组合期间不可提交；不拆分组合表情。旧浏览器不支持可见字符分段时降级为 Unicode 码点计数，普通表情仍只计一字。
- 六语沿用 `i18n/trip-ended.ts`；选项和提示完整翻译。保持页面内模拟提交，不增加持久化或后台回流。提交中禁用全部评价输入，关闭与返回首页保持可用。

**i18n 增量**（六语值由运行时资源包完整交付）：

| key | zh-CN | zh-TW | en | ja |
|---|---|---|---|---|
| `tripRatingTitle` | 请为这次用车体验评分 | 請為這次用車體驗評分 | Rate your rental experience | 今回のご利用体験を評価してください |
| `tripRatingHint` | 选择1～5分，分享您的感受，帮助我们改善服务。 | 選擇1～5分，分享您的感受，幫助我們改善服務。 | Choose a score from 1 to 5. Your feedback helps us improve. | 1～5の点数をお選びください。ご意見はサービス改善に役立てます。 |
| `tripRatingVeryDissatisfied` | 非常不满意 | 非常不滿意 | Very dissatisfied | とても不満 |
| `tripRatingDissatisfied` | 不满意 | 不滿意 | Dissatisfied | 不満 |
| `tripRatingNeutral` | 一般 | 一般 | Neutral | 普通 |
| `tripRatingSatisfied` | 满意 | 滿意 | Satisfied | 満足 |
| `tripRatingVerySatisfied` | 非常满意 | 非常滿意 | Very satisfied | とても満足 |
| `tripRatingOptionLabel` | {score}分 · {label} | {score}分 · {label} | {score} out of 5 · {label} | {score}点 · {label} |
| `tripRatingCommentLabel` | 补充说明（选填） | 補充說明（選填） | Additional comments (optional) | 補足コメント（任意） |
| `tripRatingCommentPlaceholder` | 可以描述遇到的问题，也欢迎分享做得好的地方。 | 可以描述遇到的問題，也歡迎分享做得好的地方。 | Describe any issues, or tell us what went well. | お困りの点や良かった点をお聞かせください。 |
| `tripRatingSubmit` | 提交评价 | 送出評價 | Submit review | 評価を送信 |
| `tripRatingSubmittedTitle` | 感谢您的评价！ | 感謝您的評價！ | Thank you for your review! | 評価ありがとうございます！ |
| `tripRatingSubmittedBody` | 您的意见能帮助我们改善服务。 | 您的意見能幫助我們改善服務。 | Your feedback helps us improve our service. | ご意見はサービス改善に役立てます。 |
| `tripRatingDismiss` | 关闭评价 | 關閉評價 | Dismiss review | 評価を閉じる |

### 4.4 验收场景

```gherkin
Scenario: 五级满意度含义及选择反馈
  Given 客户进入行程结束页且尚未评分
  Then 评分区仅展示1至5五个选项，默认均未选中
  And 题目直接邀请评价，各分值下方展示对应满意度，1分非常不满意、5分非常满意
  And 不展示独立的最低最高分说明、选中结果行或空占位，没有旧推荐意愿或NPS分段标签
  When 客户选择任一分值并改选另一分值
  Then 始终仅有一个选中项，当前按钮及对应含义高亮
  And 显示可选文字评价及提交入口，未选中前不存在隐藏可聚焦表单
Scenario: 评分提交边界
  Given 客户已选择1至5的整数分值
  When 提交评价
  Then 提交期间评分、评论和提交按钮禁用，模拟完成后显示感谢状态
  And 未选择、越界值或非整数不可触发提交
Scenario: 可选问题多选与保留
  Given 客户选择任意评分
  When 勾选多个问题及其他问题，再改选评分或取消其他问题
  Then 其他原因与补充说明独立保存；勾选其他问题展开独立输入框，取消后隐藏且不参与提交，再勾选恢复草稿
  And 补充说明始终可见且不被改名、替换或清空，两框各自最多300字、各自计数
  And 原生复选框支持键盘及读屏，整行可点击，手机长文案完整换行
  And 不选问题、不填文字或仅选其他问题均可提交
Scenario: 三百字及输入法边界
  Given 客户输入中文、英文、表情、空格或换行
  Then 输入框与提交使用同一计数规则，300 字允许提交
  When 输入或粘贴超过300字
  Then 保留前300字并显示本地化上限提示，不拆分表情
  And 中文输入法组合期间不截断且禁用提交，结束后校验
Scenario: 非阻断及移动端布局
  Given 客户不希望评价，或使用窄屏及任一支持语言
  Then 可关闭评分卡片或直接返回首页，本页没有外部反馈卡片、二维码或复制链接按钮
  And 五个评分按钮同一行排列且触控区域至少44乘44像素，长标签完整换行
  And 各分值可访问名称包含分数与满意度，按钮选中状态可被读屏感知
```

---

## 5. 修改记录

| 日期 | 修改人 | 变更说明 |
|---|---|---|
| 2026-10-30 | Codex | 其他问题改为独立的其他原因输入框，保留补充说明；两框分别选填、分别限制300字，取消勾选保留草稿但不参与提交。 |
| 2026-10-30 | Codex | 行程评价增加七项选填多选问题，远程开关锁单独分类；其他问题复用补充说明框，上限改为300个可见字符，补齐六语、输入法及非阻断验收。 |
| 2026-10-29 | Codex | 删除客户取车读数填写及仪表盘照片区并取消页面和合同准入隐藏校验，保留只读仪表板、历史证据及其他验车门槛；同步恢复规则和验收。 |
| 2026-10-29 | Codex | 精简驾驶证件合照区：删除主区和示例中的补充清晰度说明、各驾驶人证件类型提示及对应留白和可访问引用；同步六语资源和验收，保留携带提醒、统一拍摄说明、逐人操作与保存门槛。 |
| 2026-10-28 | Codex | 取车证件与车牌合照按 Online Check-in 已登记驾驶人逐人拍摄一张；增加驾驶时随身携带证件提醒、六语资源、按订单／车辆／驾驶人版本绑定的本地恢复与失败重试，取消新照片模拟审核，保留车控与其他验车门槛。 |
| 2026-10-28 | Codex | 删除评分区独立的最低最高分说明和已选择结果行及留白，清理六语资源与失效可访问描述引用；保留五档含义、选中高亮及按钮可访问状态。 |
| 2026-10-28 | Codex | 合并评价相关批注：改为五级满意度邀请，明确各分值含义与选中反馈，补齐六语和可访问性；删除行程结束页外部反馈二维码及复制链接卡片，保留其他页面反馈入口与现有模拟提交边界。 |
| 2026-10-28 | Codex | 行程结束页推荐意愿改为1～5五级评分，扩大触控区并移除旧NPS分段标签；补充单选、提交范围及非阻断验收，保留现有页面模拟提交和外部反馈入口。 |
| 2026-10-28 | Codex | 还车第一步改为钥匙、灯光、自动锁车三项图标提示清单，取消钥匙照片上传及必填门槛；保留定位准入，补齐五语和窄屏、定位重试及返回验收。 |
| 2026-10-15 | Codex | 更新客户还车第二步生产基线引用，移除旧灯光／上锁勾选及读数上传门槛，损伤报告改为无／有选择；取车规则保持原有范围。 |
| 2026-09-09 | Codex | Overview 取车停车费提示增加“点击查看详细计费说明”轻量入口，复用页面底部“服务与计费说明”的 `AppView.SERVICE_TERMS` 导航和既有内容；不新增停车费专属页面、弹窗或确认状态，并同步更新五语资源和验收标准。 |
| 2026-09-05 | Codex | 优化合同签署页的 `Reservation Details` 与 `Driver Identification`：合并为同一复核容器，两个区块字段直接完整展开；`REF ID` 与 `CONFIRMATION NO.` 始终分别展示，保留各字段来源标签；不改变附加项、证件、签名、条款、CTA 或合同状态逻辑。 |
| 2026-09-04 | Codex | Completion 停车费提示补充车辆可能停放在收费停车场及费用由客户承担，并保留现场缴费和确认正常出场提醒；同步更新五语资源。 |
| 2026-09-04 | Codex | 将 `PICKUP01 / Smith` 的登录首屏从 Inspection 调整为 Overview；保留押金已授权、车辆已就绪的场景数据，并同步更新 Mock 场景说明。 |
| 2026-09-04 | Codex | 删除 Inspection 车辆控制区中重复的驾照与车牌合照提示；补充“未及时开门可能自动上锁、已上锁可再次解锁”的五语操作说明，且不在缺少接口原因时断言保护机制已触发。 |
| 2026-09-04 | Codex | 将停车费方案收敛为 Overview 责任告知与 Completion 驶离提醒两个触点；删除 Inspection 独立确认、提交阻断、确认字段及对应 i18n/BDD，并在 Overview 文案中明确产生的停车费由客户承担。 |
| 2026-09-04 | Codex | 增加自助取车停车费三触点告知：Overview 提前提示、Inspection 独立阻断确认、Completion 驶离提醒；补充确认记录、原子提交、五语资源与场景 S-V，不新增投递完成通知、停车费详情页、支付或凭证上传能力。 |
| 2026-09-03 | Codex | 重构取车验车阶段车门控制：移除进入页面自动解锁，调整为先展示 License & Plate Photo、随后展示 Vehicle Controls；照片为空、上传中或审核中也允许用户主动解锁/锁闭，提交验车前仍要求照片完成；增加实时状态前置查询、20 秒弱网超时重试、实际状态轮询、前台恢复同步及解锁后约 30 秒重新落锁识别；补充车控接口幂等约束、i18n 资源和场景 L-R 验收标准。 |
