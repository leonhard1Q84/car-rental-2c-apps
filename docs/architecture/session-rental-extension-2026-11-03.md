# 2026-11-03 续租并行会话边界

用途：同目录两个会话的文件归属与集成记录。本文是协作记录，业务真值见 feature spec，接口见共享契约。

## 会话与归属

| 会话 | 目标 | 文件归属 |
|---|---|---|
| `01a19fc3-962c-77b1-9e74-35618346de86` | 完整租期排单、人工接受强占、搜索后直达支付、支付后生成合同 | `modules/rental-extension/contracts.ts`、`api.ts`、`model.ts`、`useRenewal.ts`；续租专项回归；`specs/modules/renewal/rental-extension.md`；共享续租接口契约 |
| `01a19fbc-15f2-7172-8d6c-5357963ee910` | 客户首页三入口与同订单续租接线 | 首页、路由、`PickupPreparationApp.tsx`、续租视图、六语 i18n、入口回归 |

同一文件不得同时写入；需要跨边界修改时先在本文记录。两个会话不提交或撤销对方文件。未接入后端的排单、通知、审批、支付与合同生成不得宣称已实现。

## 集成约定

- stage：`conditions | payment | status`，删除支付前 agreement/sign 步骤。
- useRenewal 保留 `lookup, record, stage, requested, setRequested, currentReturn, timezone, validTime, busy, error, unknown, reconnect, quote, pay, refresh`，不提供 sign。
- `record.allocation.status` 为 `HELD | REVIEW_REQUIRED | REJECTED`；只有有效 `HELD` 且申请 `AWAITING_PAYMENT` 可以付款。
- `record.manual_review.status` 为 `NOT_REQUIRED | PENDING | ACCEPTED | REJECTED`；PENDING 展示等待门店，REJECTED 展示续租失败。
- `record.contract.status` 为 `NOT_READY | GENERATING | READY | FAILED`；仅付款成功后生成。
- 人工接受来自服务端：`allocation.source=STORE_OVERRIDE`、有效 hold、`manual_review.status=ACCEPTED`；客户端没有强占按钮。
- 新接口要求 `workflow_version=FULL_RENTAL_V2`，旧接口缺少能力则阻断，避免旧版先签后付/先销售库存的行为混入。
- `quote()` 是“搜索并申请占位”的用户动作；报价仅算价，create 在服务端完成完整租期排单与原子占位，返回人工等待或待支付。

## 集成记录

- 续租逻辑会话：已取得取消支付前签署的用户确认，开始更新规格、接口与状态逻辑。

### 客户入口与视图会话确认（01a19fbc-15f2-7172-8d6c-5357963ee910）

- 已落盘旧版 `contracts.ts`、`api.ts`、`model.ts`、`useRenewal.ts`，即日起交由续租逻辑会话接管；本会话不再编辑这些文件或续租专项模型/API测试、共享接口契约。
- 本会话继续负责 `app/router.tsx`、`pickup-preparation` 的首页/step/续租接线、`RentalExtensionPage.tsx`、`public-api.ts`、`i18n/preparation.ts`、入口回归及 README/.env 使用说明。
- 续租页面将删除 agreement/sign 与签名组件，依照 `conditions | payment | status` 展示；支付前没有合同确认或手写签署；人工等待不显示付款按钮，服务端确认有效占位后才显示待支付；付款后展示合同生成状态。
- 本会话新增 `returnTime.ts` 复用参考项目的东京时区转换；原新增 `useSignature.ts` 会删除（续租不再需要签名）。逻辑会话可继续消费 `returnTime.ts`。
- 视图资源包将补齐人工等待、强占已确认、门店拒绝、合同生成中/已生成/生成失败文案，保留本仓库无后端的实现边界；不新增门店运营页面或客户端自报排单/支付成功。
- 现有身份核验截止和快速取车守卫继续保留；Renew 可打开同订单操作页，资格读取或未取车状态在页内阻断交易。

- 视图资源已落盘（六语）：`renewAwaitingStore`、`renewStoreAccepted`、`renewStoreRejected`、`renewHoldReady`、`renewHoldExpired`、`renewContractTitle`、`renewContractGenerating`、`renewContractReady`、`renewContractFailed`、`renewContractDownload`、`renewWorkflowUnavailable`；原 `renewAgreementMissing` 改为押金方案未就绪，不再指代支付前协议。
- 原客户回归已按三入口/不再电话续租更新且全部通过；最终仍会在新逻辑落盘后统一运行类型、边界、构建及回归。当前项目已有 127.0.0.1:3000 的 Vite 进程（PID 88863）；3001 与 *:3000 的旧目录页来自另一工作区，不修改其进程。

### 逻辑会话集成更新

- 核心类型/model/API/useRenewal 已按 FULL_RENTAL_V2 落盘，typecheck 通过；现在开始新增命令级逻辑/API回归。
- `quote` 的 API 响应新增 `quote_id`，create 原子排单并持有幂等键；pay 无签名和模拟卡号，带幂等键；旧后端能力不匹配阻断。
- 请视图会话补齐 `manual_review.notification_status=FAILED` 的页内提示，新增 `renewNotificationFailed` 六语；业务文案详见 feature spec §7。
- 请视图会话补齐 `stage=status && !record && unknown` 的占位/付款结果未知提示及 reconnect（创建响应超时可能暂时没有 request）；不能留空，也不能允许再次搜索创建。
- 请视图会话将合同链接限制为 HTTPS（共享契约）并覆盖 READY 缺有效链接的恢复提示。
- `renewalPayable` 判断占位和付款阶段；hook 还验证 deposit_plan 金额/币种/期限和同意版本。为避免按钮看似可用却无反应，请视图也检查 plan.currency、required_amount、required_through 至少覆盖新还车时间，缺/无效时使用页内方案缺失提示并禁用 CTA。
- 规格中人工等待 key 会与视图统一为 `renewAwaitingStore`，合同查看统一为 `renewContractDownload`。客户人工状态由 backend 返回，不新增客户端接受或拒绝操作。
- 已在 model 导出 `renewalDepositPlanValid(plan, record)`，视图可直接复用判定并禁用 CTA，无需重复字段校验。

### 客户视图集成补齐

- 已复用 `renewalPayable`、`renewalDepositPlanValid`，有效占位和担保方案均满足才开放付款；客户端每秒更新占位到期的按钮状态。
- 已补齐通知失败 `renewNotificationFailed`、创建结果未知且无 record 的 `renewRequestUnknown`＋reconnect、合同 READY 缺有效 HTTPS 下载地址的 `renewContractUnavailable`＋刷新；全部六语并有命令级渲染回归。
- 已删除续租签名组件与支付前协议/签名 UI；状态页只有服务端 PAID 才展示合同状态，合同链接仅接受有效 HTTPS。
- `scripts/test-customer-service-hub.mjs` 已加入 `npm run test:customer`。当前完整客户回归通过；本会话收尾时将再验证本次新增的担保和未知状态修订。

### 逻辑验证结果

- 已新增 `scripts/test-rental-extension-scheduling.mjs`，覆盖未签直达支付、完整租期/当前车证据、人工等待/强占接受/拒绝、占位到期、未知付款、支付后合同、快照绑定、会话及幂等载荷。
- 逻辑会话追加 package.json 的 `test:customer` 命令，串入上述专项脚本，保留视图会话刚加入的 service-hub 脚本。
- 类型、边界、构建及完整客户回归已通过；无 AI 浏览器交互。库存算法、通知、真实审核、扣款与文书生成尚需外部后端依据共享契约实现与联调。
- 核心逻辑已完成，后续仅做必要收尾，不修改首页/视图/i18n。

### 客户入口与视图交付结果

- `/`、`/selfservice.html` 默认进入截图红框对应的客户移动端；兼容 flow=pickup-preparation。预订摘要保留，首页仅三列 Online Check-in / Skip the counter / Renew，退出回订单验证。
- Renew 同订单接线、未取车/资格失败阻断、人工等待/通知失败/拒绝、有效占位直接支付、未知结果恢复、付款后合同状态及安全下载已落盘；保留六语、安全区和原有首次取车签约流程。
- 最终检查通过：`npm run typecheck`、`npm run check:boundaries`、`npm run test:customer`（含两项新增续租回归）、`npm run build`、`git diff --check`。没有执行 AI 浏览器交互。
- 本地查看地址 `http://127.0.0.1:3000/`，示例订单 PREP01 / 电话后四位5678。实际续租占位、门店审批、支付、合同生成仍需外部 FULL_RENTAL_V2 后端联调；未连接时不模拟交易成功。本会话未提交、推送或修改其他工作区运行进程。
