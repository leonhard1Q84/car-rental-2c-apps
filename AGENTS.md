# FleetEdge 客户端协作指南

## 项目边界

- 本仓库仅维护 FleetEdge 面向租车客户的在线应用，业务 lane 为 `customer`。
- 运行时代码：`src/`（单一客户应用，无 `src/apps/*` 分层）；默认入口 `/`，兼容入口 `/selfservice.html`。
- 客户需求权威规格：`specs/`；设计基线与 supporting docs：`docs/`。
- 稳定跨端契约与模板：`docs/shared`；本地通用代码：`src/shared`。
- 商户端、门店运营端在原独立仓库维护，不得在本仓库新增其页面、入口或依赖。
- 根 `.agent/` 是唯一可执行规则入口，`specs/`、`docs/` 只承载内容。
- 应用边界见 `specs/epic/customer-applications.md`：鉴权、Online Check-in、自助取还、Renew；Skip the counter 与投诉反馈尚未上线。验车、押金、签约、电子钥匙、取还车及评价均为自助取还内部能力。

## 必须读取

1. `.agent/rules/global-constitution.md`
2. `docs/README.md`
3. `docs/templates/customer-h5-design-baseline.md`
4. `specs/epic/selfservice-rental-baseline.md`
5. 本次任务所属模块 `specs/modules/<module>/` 下的 feature spec；写代码时读取 `.agent/rules/runtime-coder.md`，写规格时读取 `.agent/rules/spec-author.md`。

## 续租体验基线

- 续租（Renew）旅程的 UI 与文案以参考实现为对齐基准：`/Users/admin/Desktop/selfservice_rental` 仓库 `codex/rental-extension-connection` 分支（基线提交 `ee9635a`）下的 `src/apps/rental-extension`。
- 修改 `src/modules/rental-extension` 或相关入口页面时，先阅读参考应用的页面结构、组件与 i18n 资源，视觉呈现、信息层级与文案语气向其看齐。
- 业务规则与状态语义仍以 `specs/modules/renewal/rental-extension.md` 为唯一权威；参考实现不构成生产事实，缺口要在实现或评审中显式记录。

## 证据边界

- 代码、Mock、fixture 和本地运行结果只证明仓库实现现状，不代表生产事实。
- 不得把模拟数据、TODO 或实现缺口写成已确认的业务问题。
- 规格中的业务事实应注明来源、时间和适用范围；规格要求与仓库实现有差异时明确记录。

## 开发约束

- 修改运行时前锁定具体 spec 和验收标准，不新增规格未覆盖的业务行为。
- `specs/**`、`docs/**` 业务说明默认使用中文，标准术语和标识符保留原文。
- UI 文案沿用 `src/i18n/**` 与 `src/translations.ts`，不得在 JSX/TSX 中新增硬编码文案。
- 模块专属组件、样式和 tokens 留在 `src/` 对应目录；`src/shared` 不得反向依赖模块代码。
- 移动端考虑 loading / empty / error / success、弱网、重复提交、权限拒绝与 safe area。
- `src` 单文件不得超过 1500 行。
- 验证时不允许 AI 进行浏览器交互；需要交互验收时由人工操作。

## 验证

- 安装：`npm ci`
- 开发：`npm run dev`
- 边界检查：`npm run check:boundaries`
- 类型检查：`npm run typecheck`
- 客户回归：`npm run test:customer`
- 构建：`npm run build`
- 预览：`npm run preview`
