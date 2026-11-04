# 续租完整租期排单接口契约

日期：2026-11-03。来源：当日产品指令与取消支付前续租签署的补充确认。适用：客户续租、外部门店审核、库存、付款、合同服务。状态：待后端实现与联调；本仓库仅实现客户消费端。

## 1. 接口兼容与主体

沿用参考路径 `/api/mock/rental-extension`。lookup 返回 `workflow_version: FULL_RENTAL_V2` 才允许新工作流；旧接口缺少该值时客户端阻断。`/auth/lookup` 携带客户统一鉴权 token（见 `customer-auth.md`），请求体仅 `order_id`，不再接受 confirmation_number/surname/brand，不签发新 token；后续请求复用同一 token，token 绑定租户、品牌与同订单。不得信任客户传入的车辆、原租期、占位成功、审批或付款结果。

报价 `/quotes/calculate` POST：`confirmation_number, extension_days, new_return_time, scheduling_policy: FULL_RENTAL_V2`。只计算价格，不用销售 ATP 作前置否决、不写入库存；返回 `quote_id`、同输入租期和 pricing/deposit_plan 快照。创建 `/requests/create` POST 在原字段基础上带 `quote_id, scheduling_policy: FULL_RENTAL_V2` 与 `Idempotency-Key`，校验报价仍有效后原子排单；返回同一 `RequestRecord`，包括人工等待的结果。`GET /requests/{id}` 恢复同申请。`POST /requests/{id}/pay` 带 `Idempotency-Key` 与必要的 deposit_consent；服务端发起支付，客户端不提交 card_last4、PAID、EFFECTIVE 或签名。不再调用 sign。

lookup、get、create、pay 返回的订单、申请、报价和交易必须属于相同会话。服务端以同订单最多一个活动申请约束跨端并发；不同幂等键也不能绕过。重复键返回原结果；相同键不同载荷拒绝。

## 2. 库存事务

库存真值是服务端完整排单结果；原预订起点至新还车时间替换本订单旧区间，不能重复计入原预订或仅对续租尾段先查销售库存再排当前车辆。客户当前车辆必须连续保留。

自动试排检查新增超售风险及已排老单是否落入待排区；可行则在同库存版本上提交 hold 与 AWAITING_PAYMENT。风险存在时试排全部回滚、不释放原订单有效安排，保存 REVIEW_REQUIRED 与 PENDING_STORE_CONFIRMATION；服务端原子写入通知任务，再异步投递门店。无论 available 与否均以完整试排结果裁决。

外部审核接受以申请版本、门店权限和最新库存版本执行强占；允许超售，强占成功后 allocation.source=STORE_OVERRIDE、manual_review.status=ACCEPTED、申请 AWAITING_PAYMENT。拒绝关闭申请，closed_reason=STORE_REJECTED，不改变原安排、不发生付款。审核事件不由客户调用。人工接受失败仍不得开放付款；接受/拒绝重复提交幂等，旧版本决策拒绝。

## 3. 客户响应模型

```ts
interface Allocation {
  mode: 'FULL_RENTAL';
  status: 'HELD' | 'REVIEW_REQUIRED' | 'REJECTED';
  pickup_time: string;             // 原预订起点，ISO 8601
  original_return_time: string;    // 本次申请时有效还车时间
  new_return_time: string;
  vehicle_id: string;              // 当前正在使用的车辆
  hold_id: string | null;
  expires_at: string | null;
  source: 'AUTO' | 'STORE_OVERRIDE' | null;
}
interface ManualReview {
  status: 'NOT_REQUIRED' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  notification_status: 'NOT_REQUIRED' | 'PENDING' | 'SENT' | 'FAILED';
}
interface ContractArtifact {
  status: 'NOT_READY' | 'GENERATING' | 'READY' | 'FAILED';
  url?: string; // READY 时必填有效 HTTPS 链接
}
```

RequestRecord.status 扩展为 `DRAFT | AWAITING_CUSTOMER_CONFIRMATION | PENDING_STORE_CONFIRMATION | AWAITING_PAYMENT | PROCESSING | EFFECTIVE | CLOSED`。旧 DRAFT/确认状态仅兼容读取，不能凭 signed_at 推导支付资格。响应必含上述三个新对象，且满足以下组合：

| 申请 | allocation | manual_review | payment / contract |
|---|---|---|---|
| AWAITING_PAYMENT 自动 | HELD/AUTO，有有效 hold | NOT_REQUIRED | PENDING 或已确认 FAILED；contract NOT_READY |
| PENDING_STORE_CONFIRMATION | REVIEW_REQUIRED，hold/source 为空 | PENDING；通知真实阶段 | 未扣款；contract NOT_READY |
| AWAITING_PAYMENT 人工接受 | HELD/STORE_OVERRIDE，有有效 hold | ACCEPTED | 未扣款；contract NOT_READY |
| CLOSED/STORE_REJECTED | REJECTED，无 hold | REJECTED | 未扣款；contract NOT_READY |
| PROCESSING | 保留事务快照 | 保留审批结果 | PROCESSING/PAID；只有 PAID 可生成合同 |
| EFFECTIVE | 已成功提交续租的占位快照 | 保留审批结果 | PAID；contract GENERATING/READY/FAILED |

所有阶段均返回 pricing_snapshot、deposit_plan、original_return_time、new_return_time、order_id、confirmation_number、brand_code、extension_days。allocation 时间和车辆须匹配申请/鉴权订单，租期 > 0，金额与币种完整。响应不得包含其他客户的订单编号或内部调度详情。

### 3.1 客户续租记录投影（待联调确认）

来源：2026-11-03客户续租记录与详情补充需求，以及参考应用 `codex/rental-extension-connection@ee9635a` 的客户结果页。适用范围为同订单已鉴权客户；以下为消费端接入约定，不代表接口已上线。

lookup 可返回 `request_history?: RequestRecord[]`，按申请编号区分各次续租，仍返回当前 `active_request` 与最近 `latest_request`。客户端合并同编号的最新结果，缺少列表时只展示已经收到的记录。每条记录复用申请的租期、费用、付款与合同快照，`insurance_snapshot`、`addon_snapshot` 提供该次保障与设备；缺失快照显示无明细，不从当前订单补写历史。`payment.card_last4` 为可选的4位数字展示字段，付款凭证编号取 `payment_intent_id`，仅在 PAID 后显示；客户端付款载荷仍不携带卡资料。

续租生效后，lookup 的 `order.current_return_time` 与 `limits.current_return_time` 必须反映最新有效期限。再次续租前重新 lookup；存在活动申请则恢复，无活动申请且有效期限已同步才重新报价。历史数组、完整性、分页及正式合同附件仍需服务端联调确认；本仓库不另行假定可用的历史查询端点。原主合同继续使用客户已有正式合同附件，不从续租文书推导。

## 4. 支付、超时与合同

支付原子校验：当前 AWAITING_PAYMENT、有效 hold、同申请、报价/担保版本匹配；AUTO 必须 NOT_REQUIRED，STORE_OVERRIDE 必须 ACCEPTED。支付前不要求续租合同、签署、hash/version。对已 PROCESSING/PAID 的请求只返回原交易，不再扣款。支付失败只有被服务端明确确认后才允许在有效 hold 上重试；超时、不可解析结果或未知状态一律只查询原申请。

create/pay 必须持久化处理结果及幂等键。create 响应未知先 lookup 恢复活动申请；pay 响应未知先 get。无法确认旧结果时不得发起新创建或付款。15秒客户端超时不构成服务端取消。

hold/申请有效期由服务端返回；到期关闭并仅撤回本次续租增量，保留原订单有效安排。人工确认与到期、付款与到期并发按同一申请和库存事务锁裁决，不能既释放又接受扣款。已确认扣款但生效失败进入补偿流程及真实退款状态，不由客户端推断已退款。

可信付款成功回调幂等冻结实际支付金额/币种、租期、车辆、费用及审批快照，触发合同任务；付款前 contract=NOT_READY，支付失败/拒绝不生成合同。重复回调不重复生效或生成文书。合同失败可以重试生成，不重新扣款、不回滚已经成立的付款事实；READY 返回 HTTPS 下载链接。续租生效与合同产物分开返回，客户端仅以 EFFECTIVE 展示新还车时间。

## 5. 通知与审计

通知失败保留人工待处理申请并返回 FAILED，由服务端重试同一任务；客户端不能宣称已送达。通知仅发给原门店授权人员，具体渠道由外部通知服务配置，本仓库不发送真实消息。服务端记录通知事件/重试、库存版本和风险、审核人及理由、强占及超售、付款和合同任务；客户只看等待、接受后付款或拒绝，不显示内部排单细节。

后端集成验收必须覆盖：销售 available 但完整排单失败、销售不足但完整排单可行、老单被挤出、当前车辆连续保留、无重复原租期、风险试排回滚、并发库存变化、重复人工决定、强占超售、通知失败、占位到期、创建/付款超时与重复回调、支付前不生成合同、合同失败不重复扣款。客户端测试只能证明消费端的载荷与状态守卫。
