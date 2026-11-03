# FleetEdge 租车客户端

面向 FleetEdge 租车客户的独立在线应用，承载 ONLINE CHECK-IN、自助取车与还车旅程。

从 `ixtech-app-antigravity` 的客户端目录拆分而来。本仓库只构建租车客户端，商户与门店运营应用由原仓库维护。

## 本地运行

使用支持 Vite 6 的 Node.js（建议 Node 22 LTS）和 npm：

```bash
npm ci
npm run dev
```

打开 `http://localhost:3000/`。兼容入口为 `/selfservice.html`；Vercel 配置另保留 `/selfservice.rental` 重写。其他服务器需要配置对应路由。

```bash
npm run check:boundaries
npm run typecheck
npm run build
npm run preview
```

产物位于 `dist/`。本项目不需要 Gemini API Key，不依赖原仓库目录或其 node_modules。

## 当前实现边界

当前迁入的是原仓库前端原型：订单、鉴权、押金、合同、审核与车控等包含 Mock / 模拟行为；真实后端、支付、合同平台和车辆设备接入需要另行实现与联调。外部示例图片和合同 PDF 仍依赖原有远程地址。

演示账号：订单号 `DEMO`、姓氏 `Smith`。`CANCEL01`、`REGULAR01`、`PENDING01`、`REJECT01` 可用于查看现有阻断场景。它们只用于本地原型演示。

迁入的规格描述目标业务契约，不能据此推断原型已完整实现。还车停车场推荐规格随客户资料保留，本次不新增该能力。

## 目录

- `src/apps/selfservice-rental/`：客户端页面、状态、组件、i18n 与设计 tokens，保留原路径以减少迁移差异。
- `src/shared/`：客户端引用的 Tailwind 样式与稳定履约领域类型。
- `workspace/customer/`：客户规格、设计基线和参考资料。
- `workspace/shared/`：稳定 schema、API、术语与模板。
- `.agent/rules/`：客户端协作与开发规则。
- `scripts/check-customer-boundaries.mjs`：应用目录、依赖和 import 边界检查。

## 来源与切换

Codeup：`https://codeup.aliyun.com/677b967610def31b486d77d9/ixtech-ai/ixtech-2c-apps.git`。

拆分依据与验收见 `workspace/customer/specs/epic/customer-app-extraction.md`，迁移来源和保留项见 `workspace/customer/docs/architecture/repository-extraction.md`。

原仓库的客户代码暂时保留作为切换对照；后续客户端功能在本仓库维护。生产部署、域名切换、历史客户端下线需在人工业务验收后单独安排。本次不修改原仓库。
