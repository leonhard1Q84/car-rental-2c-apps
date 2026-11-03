# FleetEdge 租车客户端

面向 FleetEdge 租车客户的独立在线应用，承载 ONLINE CHECK-IN、自助取车与还车旅程。

从 `ixtech-app-antigravity` 的客户端目录拆分而来。本仓库只构建租车客户端，商户与门店运营应用由原仓库维护。

当前来源为 Codeup `main` 分支的 `d6e5b1c31fbe0299c7d09bfec65659fad495f213`，包含取车准备、Online Check-in、审核补正、在线验车和取还车流程。

## 本地运行

使用支持 Vite 6 的 Node.js（建议 Node 22 LTS）和 npm：

```bash
npm ci
npm run dev
```

打开 `http://localhost:3000/`。兼容入口为 `/selfservice.html`；Vercel 配置另保留 `/selfservice.rental` 重写。其他服务器需要配置对应路由。

客户移动端取车准备入口：`http://localhost:3000/selfservice.html?flow=pickup-preparation`。该入口与默认自助取还入口沿用来源仓库的路由区分。

```bash
npm run check:boundaries
npm run typecheck
npm run test:customer
npm run build
npm run preview
```

产物位于 `dist/`。本项目不需要 Gemini API Key，不依赖原仓库目录或其 node_modules。

## 当前实现边界

默认运行来源仓库的本地演示适配器：订单、鉴权、押金、合同、审核与车控等仍包含 Mock / 模拟行为。验车及签署联动已保留可选 API adapter，可在 `.env.local` 设置 `VITE_CUSTOMER_SELF_SERVICE_API_BASE_URL`；配置样例见 `.env.example`，本仓库不包含后端服务。真实支付、合同平台、车辆设备及后端接入状态需单独联调确认。

客户端与商户端部署在不同源时，浏览器 IndexedDB 和 BroadcastChannel 无法跨源共享；两端联动须使用共同后端及对应认证、CORS 配置。本次未连接生产 API。外部示例图片和合同 PDF 保留来源地址。

取车准备演示账号：订单号 `PREP01`、联系电话后四位 `5678`。`PREP04` 等订单保留来源中的资料补正示例。证件核验沿用预约取车前至少 4 小时的办理截止规则，固定示例日期过后入口会显示办理限制。

默认自助取还入口使用订单号 `DEMO`、姓氏 `Smith`，并保留来源的演示账号选择界面。以上账号仅用于本地原型演示。

续约入口仍拨打门店电话（`tel:`），未引入独立续租应用，也未新增在线报价、申请、签署或付款。

迁入的规格描述目标业务契约，不能据此推断原型已完整实现。还车停车场推荐规格随客户资料保留，本次不新增该能力。

## 目录

- `src/apps/selfservice-rental/`：客户端页面、状态、组件、i18n 与设计 tokens，保留原路径以减少迁移差异。
- `src/shared/`：客户端引用的 Tailwind 样式、车辆读数组件、契约、API 与本地存储适配器。
- `workspace/customer/`：客户规格、设计基线和参考资料。
- `workspace/shared/`：稳定 schema、API、术语与模板。
- `.agent/rules/`：客户端协作与开发规则。
- `scripts/check-customer-boundaries.mjs`：应用目录、依赖和 import 边界检查。

## 来源与切换

Codeup：`https://codeup.aliyun.com/677b967610def31b486d77d9/ixtech-ai/ixtech-2c-apps.git`。

拆分依据与验收见 `workspace/customer/specs/epic/customer-app-extraction.md`，迁移来源和保留项见 `workspace/customer/docs/architecture/repository-extraction.md`。

原仓库的客户代码暂时保留作为切换对照；后续客户端功能在本仓库维护。生产部署、域名切换、历史客户端下线需在人工业务验收后单独安排。本次不修改原仓库。
