# AGENTS.md

## 适用范围

本文件适用于 `src/**`。这是 Customer 自助租赁 App。

## 权威输入

- 业务规格：`specs/`；设计基线与资料：`docs/`
- 入口页面：`/`（兼容 `/selfservice.html`）
- Vite alias：`@` → `src/`，`@shared` → `src/shared/`

实现前优先读取：

1. `docs/README.md`
2. `docs/templates/customer-h5-design-baseline.md`
3. `specs/epic/selfservice-rental-baseline.md`
4. 与当前任务相关的 `specs/**`

## 产品边界

- 页面目标是降低用户理解成本、建立信任、减少流程中断并提升自助取还完成率。
- 不要引入 store-ops 的任务台逻辑、内部异常语义、调度权限或高密度后台字段。
- 面向用户展示的术语需要转译成可理解的中文或对应语言文案。

## 代码组织

- `app/**` 与 `routes/**` 承载路由、守卫和页面装配。
- `modules/auth`、`online-checkin`、`selfservice-rental`、`rental-extension` 对应业务应用，`modules/home` 承载应用壳摘要与入口；`app/customer-journey` 编排跨应用导航及现有草稿。验车、押金、合同、车控与还车放在 `selfservice-rental` 内部，模块出口优先使用 `public-api.ts`。
- `components/**` 中存在历史页面组件；修改前确认当前路由是否仍在引用。
- `design/**` 保存本 App 的 token、theme 和 baseline，不要上收到 `src/shared`。

## i18n

- 现有文案资源分布在 `i18n/**` 与 `translations.ts`，修改时沿用当前触达页面的既有模式，不要新增第三套资源体系。
- 新增用户可见文案必须补齐相关语言资源，不能只在 JSX/TSX 中写中文。

## 验证

- 至少运行 `npm run build`。
- 用户流程变更需要验证 `/selfservice.html`，重点检查登录、押金、验车、签约、取车、还车等主路径。

