# Feature Spec: 自助取还体验革新与支付安全增强 (Pickup Inspection & Security) — 还车 Location & Parking

- **所属模块**：`selfservice-rental`
- **拆分来源**：`specs/feature/pickup-inspection-security.md` v1.17（2026-11-03 按产品模块拆分，正文未改写）
- **基线依赖**：`specs/epic/selfservice-rental-baseline.md` (v1.0)
- **同源拆分文件**：[access/link-access-security.md](../auth/link-access-security.md)、[online-checkin/online-checkin-not-started-demo.md](../online-checkin/online-checkin-not-started-demo.md)、[return/trip-rating.md](trip-rating.md)、[skip-the-counter/pickup-inspection-security.md](pickup-inspection-security.md)

本特征说明书（Feature Spec）是对生产基线文档的增量更新。此次迭代聚焦于解决目前在线鉴权的越权安全隐患、补齐前端对于 Stripe 预授权复杂状态的响应能力，并对现有的“客户自行拍照验车”流程进行了架构重构，以实现低阻力取车。同时规定验车阶段先展示驾照与车牌合照，再展示车辆控制区；车门控制由客户主动触发，不依赖照片是否已上传或审核通过，并补充弱网等待、超时恢复和自动重新落锁识别规则。对于可能投递至收费停车场的自助取车订单，通过取车前责任告知和取车完成后的驶离提醒，确保客户了解停车费承担与缴纳要求。

---

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

---

## 5. 修改记录

| 日期 | 修改人 | 变更说明 |
|---|---|---|
| 2026-10-28 | Codex | 还车第一步改为钥匙、灯光、自动锁车三项图标提示清单，取消钥匙照片上传及必填门槛；保留定位准入，补齐五语和窄屏、定位重试及返回验收。 |
| 2026-10-15 | Codex | 更新客户还车第二步生产基线引用，移除旧灯光／上锁勾选及读数上传门槛，损伤报告改为无／有选择；取车规则保持原有范围。 |
