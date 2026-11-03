# FleetEdge 客户端协作指南

## 项目边界

- 本仓库仅维护 FleetEdge 面向租车客户的在线应用，业务 lane 为 `customer`。
- 运行时代码：`src/apps/selfservice-rental`；默认入口 `/`，兼容入口 `/selfservice.html`。
- 客户端需求与设计基线：`workspace/customer`。
- 稳定领域契约与模板：`workspace/shared`；本地通用代码：`src/shared`。
- 商户端、门店运营端在原独立仓库维护，不得在本仓库新增其页面、入口或依赖。
- 根 `.agent/` 是唯一可执行规则入口，`workspace/` 只承载内容。

## 必须读取

1. `.agent/rules/global-constitution.md`
2. `workspace/customer/README.md`
3. `workspace/customer/docs/templates/customer-h5-design-baseline.md`
4. `workspace/customer/specs/epic/selfservice-rental-baseline.md`
5. 本次任务对应的 feature spec；写代码时读取 `.agent/rules/runtime-coder.md`，写规格时读取 `.agent/rules/spec-author.md`。

## 证据边界

- 代码、Mock、fixture 和本地运行结果只证明仓库实现现状，不代表生产事实。
- 不得把模拟数据、TODO 或实现缺口写成已确认的业务问题。
- 规格中的业务事实应注明来源、时间和适用范围；规格要求与仓库实现有差异时明确记录。

## 开发约束

- 修改运行时前锁定具体 spec 和验收标准，不新增规格未覆盖的业务行为。
- `workspace/**` 业务说明默认使用中文，标准术语和标识符保留原文。
- UI 文案沿用 `i18n/**` 与 `translations.ts`，不得在 JSX/TSX 中新增硬编码文案。
- App 专属组件、样式和 tokens 留在 App 内；`src/shared` 不得反向依赖 App。
- 移动端考虑 loading / empty / error / success、弱网、重复提交、权限拒绝与 safe area。
- `src` 单文件不得超过 1500 行。
- 验证时不允许 AI 进行浏览器交互；需要交互验收时由人工操作。

## 验证

- 安装：`npm ci`
- 开发：`npm run dev`
- 边界检查：`npm run check:boundaries`
- 类型检查：`npm run typecheck`
- 构建：`npm run build`
- 预览：`npm run preview`
