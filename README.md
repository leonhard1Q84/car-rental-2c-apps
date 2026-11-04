# FleetEdge 租车客户端（Fe-2c-apps）

面向 FleetEdge 租车客户的独立在线应用，承载取车准备（Online Check-in）、自助取还车与在线续租（Renew）旅程。

本仓库由 `ixtech-app-antigravity` 的客户端目录拆分而来，来源为 Codeup `main` 分支 `d6e5b1c31fbe0299c7d09bfec65659fad495f213`。只维护 customer lane；商户端与门店运营端仍在原仓库维护，不在此新增其页面、入口或依赖。

## 核心能力

默认入口 `/` 先做订单验证，成功后进入「我的行程」首页：预订摘要 + Online Check-in、自助取还、Renew 三项服务。历史自助取还旅程保留为独立演示入口。以下为规格口径与仓库实现现状摘要，详细规则以对应 spec 为准。

### 鉴权认证（统一订单验证）

- 统一口径：所有入口均为 **订单号 + 订单联系电话后四位**（2026-11-03 产品确认统一按手机号认证）。规格见 `specs/epic/customer-journey.md` v1.82 / v1.83、`specs/modules/home/service-hub.md` 与 `specs/epic/selfservice-rental-baseline.md`。
- 订单号忽略首尾空格与大小写；电话去除空格、括号、连字符后取末四位，仅接受 4 位数字；确认号不作为验证凭证。
- 验证一次后 Replace 到首页，三项服务共用同一订单上下文；续租不重新采集身份，URL 不携带凭证。显式 `step` 链接仅用于本地评审，不构成鉴权。
- 实现现状：默认入口由 `src/modules/auth/verification.ts`、历史自助取还由 `src/components/AuthScreen.tsx` + `src/mockAccounts.ts` 做本地 fixture 匹配，规则一致，不代表生产鉴权；已有可选鉴权 API adapter 与接口契约，未配置时仅匹配本地 fixture；生产风控、限流与隐私评审仍需独立验证。

### Online Check-in（在线登记 / 证件核验）

- 入口：首页「Online Check-in」→ `step=drivers`（兼容 `documents`）。
- 内容：填写驾驶人身份资料、上传证件并提交；现有提交进入 `PENDING_ONSITE_CHECK`（待现场核对）；历史审核通过/退回记录保留，退回可补正。参考项目的完整 active submission 与线上审核流程尚未整合。
- 准入：须在预约取车前至少 4 小时完成，过期后入口灰显，点击弹窗说明原因。
- 实现现状：资料与照片仅保存在本设备，审核结果来自演示 fixture，不代表真实审核。规格：`specs/epic/customer-journey.md`。

### 自助取还（验车与签约入口）

- 入口：首页「自助取还」→ `step=pickup`，按顺序办理两步：
  1. 在线验车：查看门店发布的车辆照片快照，确认车况或现场反馈问题；
  2. 签署合同：条款确认 + 手写签名 + 二次确认后提交。
- 准入：门店已发布车辆照片快照；未就绪时入口灰显并提示门店正在准备，读取失败可重试。
- 实现现状：默认本地演示；配置 `VITE_CUSTOMER_SELF_SERVICE_API_BASE_URL` 可接入验车与签署 API adapter。规格：`specs/modules/selfservice-rental/online-vehicle-inspection.md`、`specs/epic/customer-journey.md`。

### Renew（在线续租）

- 入口：首页「Renew」→ `step=renewal`，进入同订单续租页，不再直接拨号。
- 准入：同订单已取车（`PICKED_UP`）且未还车；未满足时入口灰显并说明原因。
- 流程：选择新还车时间（单次最多 15 天）→ 按完整租期排单。自动占位成功则直接付款；有风险时等待门店确认，接受后付款，拒绝则续租失败。支付前不签署，付款成功后由后端生成续租合同；只有服务端返回 `EFFECTIVE` 才显示续租生效。
- 实现现状：依赖外部 `FULL_RENTAL_V2` 后端（`VITE_RENTAL_EXTENSION_API_BASE_URL`），未配置时阻断交易并保留联系门店。详见下方「续租体验基线」「功能边界」与 `specs/modules/renewal/rental-extension.md`。

### 自助取还（完整演示旅程）

- 入口：`/selfservice.html?flow=selfservice`，演示账号见下方。
- 主线：鉴权 → 订单状态与身份核验门禁 → Overview → 押金预授权 → 取车验车并确认取车（`PICKED_UP`）→ 电子合同签署 → 用车（车控）→ 还车两步（位置围栏校验 + 车况确认 / End Trip）→ 行程结束与还车凭证。
- 实现现状：押金、合同、车控等均为 Mock / 模拟行为；鉴权沿用上方统一口径。规格：`specs/epic/selfservice-rental-baseline.md`、`specs/modules/selfservice-rental/pickup-inspection-security.md`。

### 待上线应用

Skip the counter 与投诉反馈为独立规划应用，尚未上线，不借用验车、电子钥匙或行程评价表示已完成。应用边界及参考项目差异见 [客户应用边界](specs/epic/customer-applications.md)。

## 仓库模型

- `src/`：运行时代码，单一客户应用，不再按 `src/apps/*` 分层。
  - `src/modules/**`：`auth`、`online-checkin`、`selfservice-rental`、`rental-extension`；`home` 保存应用壳摘要和服务入口。自助取还子能力按 `pickup`、`deposit`、`contract`、`vehicle-control`、`return-flow` 等组织。
  - `src/app/customer-journey/`：跨应用页面编排、导航与现有共享草稿；`src/routes/`、`src/components/` 保留历史适配和页面。
  - `src/design/`、`src/i18n/`、`src/translations.ts`：设计 tokens 与文案资源。
  - `src/shared/`：Tailwind 样式、车辆读数组件、契约、API 与本地存储适配器；不得反向依赖模块代码。
- `specs/`：客户需求的权威规格，按 `epic / modules/<app>` 组织，完整索引见 [specs/README.md](specs/README.md)。
- `docs/`：设计基线、journey、domain、architecture、asset 等 supporting docs；`docs/shared/` 放稳定跨端契约（schema、api-contract、glossary、event-taxonomy、templates）。
- `.agent/`：唯一可执行 AI 规则入口；`specs/`、`docs/` 只承载内容，不放可执行规则。
- `scripts/`：边界检查与客户回归脚本（`check-customer-boundaries.mjs` 等）。

## 续租体验基线

续租（Renew）旅程的 UI 与文案以参考实现为对齐基准：

- 参考仓库：`/Users/admin/Desktop/selfservice_rental`
- 参考分支：`codex/rental-extension-connection`（基线提交 `ee9635a`）
- 参考应用：`src/apps/rental-extension`，独立入口 `rental-extension.html`，含 `LookupPage`、`OrderOverviewPage`、`ExtensionWorkspace`、`PaymentPage`、`ProcessingPage`、`SuccessPage` 及五语言 i18n 资源。

本仓库 `src/modules/rental-extension` 及关联页面的视觉呈现、信息层级与文案语气需对齐该参考实现和 `docs/templates/customer-h5-design-baseline.md`。业务规则、状态语义与验收仍以 `specs/modules/renewal/rental-extension.md` 为唯一权威；参考实现只是 UI/文案与接口原型参照，不代表生产事实。

## 运行方式

需要支持 Vite 6 的 Node.js（建议 Node 22 LTS）：

```bash
npm ci
npm run dev
```

打开 `http://127.0.0.1:3000/` 进入客户移动端订单验证页。支持入口：

- `/`：默认入口。
- `/selfservice.html`：兼容入口；`?flow=pickup-preparation` 为取车准备演示，`?flow=selfservice` 显式进入历史自助取还演示。
- `/selfservice.rental`：Vercel 重写保留；其他服务器需自行配置路由。

## 验证命令

```bash
npm run check:boundaries   # 应用目录、依赖与 import 边界
npm run typecheck          # tsc --noEmit
npm run test:customer      # 客户旅程脚本回归
npm run build              # 产物输出到 dist/
npm run preview            # 预览生产构建
```

本项目不需要 Gemini API Key，不依赖原仓库目录或其 node_modules；仓库内不包含后端服务。

## 演示账号

用于本地及 Vercel 正式构建的原型演示；相关 API 留空时按登录账号加载场景：

| 场景 | 订单号 | 验证方式 |
| --- | --- | --- |
| 取车准备 | `RC10001`～`RC10005` | 联系电话后四位 `8888` |
| Renew 续租 | `RC10006`～`RC10013` | 联系电话后四位 `8888`（未配置相关 API，本地开发及正式构建行为一致） |
| 跨应用取车准备示例 | `RC10014` | 联系电话后四位 `8888` |
| 历史自助取还 | `RC10015`～`RC10024` | 联系电话后四位 `8888`（含演示账号选择界面） |

全部场景及旧编号对照见[本地 Mock 场景凭证](specs/modules/auth/booking-verification.md#本地-mock-场景凭证2026-11-03)。新编号使用独立本地记录，旧编号下的草稿保留，不自动迁移。

证件核验沿用预约取车前至少 4 小时的办理截止规则；固定示例日期过后入口会显示办理限制。

## 功能边界

- 默认运行本地演示适配器：订单、鉴权、押金、合同、审核与车控均含 Mock / 模拟行为，不代表生产事实。
- 验车与签署联动保留可选 API adapter：`.env.local` 中配置 `VITE_CUSTOMER_SELF_SERVICE_API_BASE_URL`，样例见 `.env.example`。
- 续租（Renew）进入当前订单的续租操作页（不再直接拨号），要求同订单已取车，并通过独立后端的 `FULL_RENTAL_V2` 能力校验；配置 `VITE_RENTAL_EXTENSION_API_BASE_URL`。服务按原取车起点至新还车时间安排完整租期：自动占位成功后直接付款；需门店确认时先等待，接受后进入待支付，拒绝则显示续租失败。支付前不做合同确认或手写签署，付款成功后由后端生成合同。服务未配置或使用旧协议时，页面阻断交易并保留联系门店。
- 客户端与商户端部署在不同源时，IndexedDB 与 BroadcastChannel 无法跨源共享；两端联动须走共同后端及对应认证、CORS 配置。
- 本仓库不包含排单、门店通知/审批、收款或合同生成后端；真实支付、合同平台、车辆设备接入需单独联调。外部示例图片与合同 PDF 保留来源地址。

续租规则及验收见 `specs/modules/renewal/rental-extension.md`，并行会话边界见 `docs/architecture/session-rental-extension-2026-11-03.md`，接口契约见 `docs/shared/api-contract/rental-extension-scheduling.md`。

## 证据边界

- 代码、Mock、fixture 与本地运行结果只证明仓库实现现状，不代表生产事实。
- 迁入的规格描述目标业务契约，不能据此推断原型已完整实现；规格要求与实现差异须显式记录。
- 参考仓库的 `rental-extension` 应用是 UI/文案与接口原型参照，不证明本仓库或生产环境已实现同等能力。
- 还车停车场推荐规格随客户资料保留，本次不新增该能力。

## 协作约束（摘要）

- 修改 `src/**` 前锁定具体 spec 与验收标准，不实现 active spec 未覆盖的行为。
- UI 文案走 `src/i18n/**` 与 `src/translations.ts`，不在 JSX/TSX 中硬编码。
- 续租相关页面与文案对齐上方「续租体验基线」。
- `src` 单文件不超过 1500 行。
- 验证环节 AI 不做浏览器交互；需要交互验收时由人工操作。
- 完整规则见 `AGENTS.md` 与 `.agent/rules/`。

## 来源与切换

- Codeup：`https://codeup.aliyun.com/677b967610def31b486d77d9/ixtech-ai/ixtech-2c-apps.git`
- 拆分依据与验收：`specs/epic/customer-app-extraction.md`
- 迁移来源与保留项：`docs/architecture/repository-extraction.md`

原仓库客户代码暂时保留作切换对照；后续客户端功能在本仓库维护。生产部署、域名切换与历史客户端下线须在人工业务验收后单独安排，本次不修改原仓库。
